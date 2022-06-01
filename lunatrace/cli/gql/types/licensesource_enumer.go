// Code generated by "enumer -type=PackageManager -type=LicenseSource -json -transform snake"; DO NOT EDIT.

package types

import (
	"encoding/json"
	"fmt"
	"strings"
)

const _LicenseSourceName = "manualscan_reposcan_binaryapi_npm"

var _LicenseSourceIndex = [...]uint8{0, 6, 15, 26, 33}

const _LicenseSourceLowerName = "manualscan_reposcan_binaryapi_npm"

func (i LicenseSource) String() string {
	if i < 0 || i >= LicenseSource(len(_LicenseSourceIndex)-1) {
		return fmt.Sprintf("LicenseSource(%d)", i)
	}
	return _LicenseSourceName[_LicenseSourceIndex[i]:_LicenseSourceIndex[i+1]]
}

// An "invalid array index" compiler error signifies that the constant values have changed.
// Re-run the stringer command to generate them again.
func _LicenseSourceNoOp() {
	var x [1]struct{}
	_ = x[Manual-(0)]
	_ = x[ScanRepo-(1)]
	_ = x[ScanBinary-(2)]
	_ = x[ApiNpm-(3)]
}

var _LicenseSourceValues = []LicenseSource{Manual, ScanRepo, ScanBinary, ApiNpm}

var _LicenseSourceNameToValueMap = map[string]LicenseSource{
	_LicenseSourceName[0:6]:        Manual,
	_LicenseSourceLowerName[0:6]:   Manual,
	_LicenseSourceName[6:15]:       ScanRepo,
	_LicenseSourceLowerName[6:15]:  ScanRepo,
	_LicenseSourceName[15:26]:      ScanBinary,
	_LicenseSourceLowerName[15:26]: ScanBinary,
	_LicenseSourceName[26:33]:      ApiNpm,
	_LicenseSourceLowerName[26:33]: ApiNpm,
}

var _LicenseSourceNames = []string{
	_LicenseSourceName[0:6],
	_LicenseSourceName[6:15],
	_LicenseSourceName[15:26],
	_LicenseSourceName[26:33],
}

// LicenseSourceString retrieves an enum value from the enum constants string name.
// Throws an error if the param is not part of the enum.
func LicenseSourceString(s string) (LicenseSource, error) {
	if val, ok := _LicenseSourceNameToValueMap[s]; ok {
		return val, nil
	}

	if val, ok := _LicenseSourceNameToValueMap[strings.ToLower(s)]; ok {
		return val, nil
	}
	return 0, fmt.Errorf("%s does not belong to LicenseSource values", s)
}

// LicenseSourceValues returns all values of the enum
func LicenseSourceValues() []LicenseSource {
	return _LicenseSourceValues
}

// LicenseSourceStrings returns a slice of all String values of the enum
func LicenseSourceStrings() []string {
	strs := make([]string, len(_LicenseSourceNames))
	copy(strs, _LicenseSourceNames)
	return strs
}

// IsALicenseSource returns "true" if the value is listed in the enum definition. "false" otherwise
func (i LicenseSource) IsALicenseSource() bool {
	for _, v := range _LicenseSourceValues {
		if i == v {
			return true
		}
	}
	return false
}

// MarshalJSON implements the json.Marshaler interface for LicenseSource
func (i LicenseSource) MarshalJSON() ([]byte, error) {
	return json.Marshal(i.String())
}

// UnmarshalJSON implements the json.Unmarshaler interface for LicenseSource
func (i *LicenseSource) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return fmt.Errorf("LicenseSource should be a string, got %s", data)
	}

	var err error
	*i, err = LicenseSourceString(s)
	return err
}
