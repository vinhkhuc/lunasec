// Copyright by LunaSec (owned by Refinery Labs, Inc)
//
// Licensed under the Business Source License v1.1
// (the "License"); you may not use this file except in compliance with the
// License. You may obtain a copy of the License at
//
// https://github.com/lunasec-io/lunasec/blob/master/licenses/BSL-LunaTrace.txt
//
// See the License for the specific language governing permissions and
// limitations under the License.
package epss

import (
	"bytes"
	"compress/gzip"
	"encoding/csv"
	"fmt"
	"github.com/rs/zerolog/log"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"time"
)

// EpssVulnerability has a CVE, Epss, and Percentile
type EpssVulnerability struct {
	Cve        string
	Epss       float64
	Percentile float64
}

func FetchEpssScores() ([]EpssVulnerability, error) {
	// Get the current date and time
	now := time.Now()

	// Format the date and time according to the desired format
	dateStr := now.Format("2006-01-02")

	// Use the formatted date string to construct the URL
	url := fmt.Sprintf("https://epss.cyentia.com/epss_scores-%s.csv.gz", dateStr)

	// Download the file
	response, err := http.Get(url)
	if err != nil {
		fmt.Printf("Error downloading file: %v\n", err)
		return nil, err
	}
	defer response.Body.Close()

	body, err := io.ReadAll(response.Body)
	if err != nil {
		log.Error().Err(err).Msg("failed to read cwe data")
		return nil, err
	}

	buf := bytes.NewReader(body)

	// Create a new gzip reader
	gzipReader, err := gzip.NewReader(buf)
	if err != nil {
		fmt.Printf("Error creating gzip reader: %v\n", err)
		return nil, err
	}
	defer gzipReader.Close()

	// Create a new CSV reader
	csvReader := csv.NewReader(gzipReader)

	csvReader.Comment = '#'
	csvReader.FieldsPerRecord = 3

	// The data looks like this:
	// #model_version:v2022.01.01,score_date:2022-12-29T00:00:00+0000
	// cve,epss,percentile
	// CVE-2022-27206,0.09029,0.93925
	// CVE-2022-38447,0.07947,0.92976

	// Read the first header row
	_, err = csvReader.Read()
	if err != nil {
		fmt.Printf("Error reading CSV header: %v\n", err)
		return nil, err
	}

	// Read the second header row
	_, err = csvReader.Read()
	if err != nil {
		fmt.Printf("Error reading CSV header: %v\n", err)
		return nil, err
	}

	// Read the rest of the rows
	rows, err := csvReader.ReadAll()
	if err != nil {
		fmt.Printf("Error reading CSV rows: %v\n", err)
		return nil, err
	}

	// Regex to verify that cvePair.Cve is a valid CVE
	r, err := regexp.Compile(`^CVE-\d{4}-\d+$`)

	epssScores := make([]EpssVulnerability, 0, len(rows))

	// Create an array of EpssVulnerability objects
	for _, row := range rows {
		epss, err := strconv.ParseFloat(row[1], 64)
		if err != nil {
			fmt.Printf("Error parsing Epss value: %v\n", err)
			return nil, err
		}

		percentile, err := strconv.ParseFloat(row[2], 64)
		if err != nil {
			fmt.Printf("Error parsing Percentile value: %v\n", err)
			return nil, err
		}

		cve := row[0]

		// Validates that the CVE is not a SQL injection payload :)
		if !r.MatchString(cve) {
			return nil, fmt.Errorf("invalid cve %s", cve)
		}

		epssScores = append(epssScores, EpssVulnerability{
			Cve:        cve,
			Epss:       epss,
			Percentile: percentile,
		})
	}

	return epssScores, nil
}
