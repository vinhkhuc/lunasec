// Copyright 2021 by LunaSec (owned by Refinery Labs, Inc)
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
package scan

import (
	"archive/zip"
	"bufio"
	"bytes"
	"github.com/lunasec-io/lunasec/tools/log4shell/constants"
	"github.com/lunasec-io/lunasec/tools/log4shell/types"
	"github.com/lunasec-io/lunasec/tools/log4shell/util"
	"github.com/rs/zerolog/log"
	"io"
	"io/ioutil"
	"os"
)

func identifyPotentiallyVulnerableFile(reader io.Reader, path, fileName string, hashLookup types.VulnerableHashLookup) {
	fileHash, err := util.HexEncodedSha256FromReader(reader)
	if err != nil {
		log.Warn().
			Str("fileName", fileName).
			Str("path", path).
			Err(err).
			Msg("unable to hash file")
		return
	}

	if versionInfo, ok := hashLookup[fileHash]; ok {
		log.Info().
			Str("fileName", fileName).
			Str("path", path).
			Str("versionInfo", versionInfo).
			Msg("identified vulnerable path")
	}
}

func scanClassFile(path string, file *zip.File) {
	reader, err := file.Open()
	if err != nil {
		log.Warn().
			Str("classFile", file.Name).
			Str("path", path).
			Err(err).
			Msg("unable to open class file")
		return
	}
	identifyPotentiallyVulnerableFile(reader, path, file.Name, constants.KnownVulnerableClassFileHashes)
}

func scanArchive(path string, file *zip.File) {
	reader, err := file.Open()
	if err != nil {
		log.Warn().
			Str("classFile", file.Name).
			Str("path", path).
			Err(err).
			Msg("unable to open archive")
		return
	}
	defer reader.Close()

	buffer, err := ioutil.ReadAll(reader)
	if err != nil {
		log.Warn().
			Str("classFile", file.Name).
			Str("path", path).
			Err(err).
			Msg("unable to read archive")
		return
	}

	newPath := path + "::" + file.Name
	archiveReader := bytes.NewReader(buffer)
	archiveSize := int64(len(buffer))

	scanArchiveForVulnerableClassFiles(newPath, archiveReader, archiveSize)
}

func scanFile(path string, file *zip.File) {
	fileExt := util.FileExt(file.Name)
	switch fileExt {
	case constants.ClassFileExt:
		scanClassFile(path, file)
		return
	case constants.JarFileExt, constants.WarFileExt:
		scanArchive(path, file)
		return
	}
}

func scanArchiveForVulnerableClassFiles(path string, reader io.ReaderAt, size int64) {
	zipReader, err := zip.NewReader(reader, size)
	if err != nil {
		log.Warn().
			Str("path", path).
			Err(err).
			Msg("unable to open archive")
		return
	}

	for _, zipFile := range zipReader.File {
		scanFile(path, zipFile)
	}
}

func scanLocatedArchive(path string, info os.FileInfo, onlyScanArchives bool) {
	file, err := os.Open(path)
	if err != nil {
		log.Warn().
			Str("path", path).
			Err(err).
			Msg("unable to open archive")
		return
	}
	defer file.Close()

	if onlyScanArchives {
		reader := bufio.NewReader(file)
		identifyPotentiallyVulnerableFile(reader, path, file.Name(), constants.KnownVulnerableArchiveFileHashes)
		return
	}

	scanArchiveForVulnerableClassFiles(path, file, info.Size())
}

// SearchDirsForVulnerableClassFiles walks each search dir looking for .class files in archives which have a hash
// matching a known vulnerable file hash. The search will also recursively crawl nested archives while searching.
// This function by default will scan class files, but can also be configured to only scan and match for vulnerable
// java archives.
func SearchDirsForVulnerableClassFiles(searchDirs []string, onlyScanArchives bool) {
	locatedFileCallback := func(path string, info os.FileInfo, accessError error) (err error) {
		if accessError != nil {
			log.Warn().
				Str("path", path).
				Err(accessError).
				Msg("unable to access file")
			return
		}

		if info.IsDir() {
			return
		}

		fileExt := util.FileExt(path)
		switch fileExt {
		case constants.JarFileExt, constants.WarFileExt:
			log.Debug().
				Str("path", path).
				Msg("scanning archive")

			scanLocatedArchive(path, info, onlyScanArchives)
		}
		return
	}

	util.SearchDirs(searchDirs, locatedFileCallback)
}
