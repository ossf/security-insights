package main

import (
	"os"
	"path/filepath"
	"reflect"
	"testing"

	"cuelang.org/go/cue/parser"
	"github.com/goccy/go-yaml"
)

func TestSecurityToolUnionProjection(t *testing.T) {
	t.Parallel()

	schemaDir := t.TempDir()
	schemaPath := filepath.Join(schemaDir, "schema.cue")
	schema := `package spec

#SecurityTool: {
	type: "fuzzing" | "container" | "secret" | "SCA" | "SAST" | "other"
	rulesets: ["default"] | [...string]
}
`
	if err := os.WriteFile(schemaPath, []byte(schema), 0o600); err != nil {
		t.Fatalf("write schema fixture: %v", err)
	}

	outputPath := filepath.Join(t.TempDir(), "openapi.yaml")
	if err := convertCUEToOpenAPI(schemaDir, outputPath, ConvertOpts{Version: "test"}); err != nil {
		t.Fatalf("convert CUE to OpenAPI: %v", err)
	}

	data, err := os.ReadFile(outputPath)
	if err != nil {
		t.Fatalf("read generated OpenAPI: %v", err)
	}
	var document struct {
		Components struct {
			Schemas map[string]struct {
				Properties map[string]struct {
					Type  string   `yaml:"type"`
					Enum  []string `yaml:"enum"`
					Items *struct {
						Type string `yaml:"type"`
					} `yaml:"items"`
				} `yaml:"properties"`
			} `yaml:"schemas"`
		} `yaml:"components"`
	}
	if err := yaml.Unmarshal(data, &document); err != nil {
		t.Fatalf("parse generated OpenAPI: %v", err)
	}

	securityTool, ok := document.Components.Schemas["SecurityTool"]
	if !ok {
		t.Fatal("generated OpenAPI is missing SecurityTool")
	}
	rulesets := securityTool.Properties["rulesets"]
	if rulesets.Type != "array" || rulesets.Items == nil || rulesets.Items.Type != "string" {
		t.Fatalf("rulesets = type %q items %#v; want array[string]", rulesets.Type, rulesets.Items)
	}

	wantEnum := []string{"fuzzing", "container", "secret", "SCA", "SAST", "other"}
	if got := securityTool.Properties["type"].Enum; !reflect.DeepEqual(got, wantEnum) {
		t.Fatalf("SecurityTool.type enum = %#v; want %#v", got, wantEnum)
	}
}

func TestUnionProjectionIsTypeSafe(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name          string
		expression    string
		wantType      string
		wantItemsType string
		wantEnum      []string
	}{
		{
			name:       "nested enum preserves source order and removes duplicates",
			expression: `("fuzzing" | "SCA") | ("SAST" | "fuzzing")`,
			wantType:   "string",
			wantEnum:   []string{"fuzzing", "SCA", "SAST"},
		},
		{
			name:       "fully parenthesized enum is preserved",
			expression: `((("fuzzing" | "SCA")))`,
			wantType:   "string",
			wantEnum:   []string{"fuzzing", "SCA"},
		},
		{
			name:       "defaulted enum is preserved",
			expression: `*"fuzzing" | "SCA"`,
			wantType:   "string",
			wantEnum:   []string{"fuzzing", "SCA"},
		},
		{
			name:       "escaped and unicode enum literals are decoded",
			expression: `"line\nfeed" | "café"`,
			wantType:   "string",
			wantEnum:   []string{"line\nfeed", "café"},
		},
		{
			name:       "mixed scalar union fails closed without enum",
			expression: `"fuzzing" | bool`,
			wantType:   "string",
		},
		{
			name:          "string list union becomes array of strings",
			expression:    `["default"] | ([...string] | [string])`,
			wantType:      "array",
			wantItemsType: "string",
		},
		{
			name:          "fully parenthesized list union remains an array",
			expression:    `((["default"] | [...string]))`,
			wantType:      "array",
			wantItemsType: "string",
		},
		{
			name:          "parenthesized list elements and ellipsis type remain strings",
			expression:    `[("default")] | [...(string)]`,
			wantType:      "array",
			wantItemsType: "string",
		},
		{
			name:          "defaulted string list remains an array",
			expression:    `*["default"] | [...string]`,
			wantType:      "array",
			wantItemsType: "string",
		},
		{
			name:       "mixed list union fails closed",
			expression: `["default"] | [...int]`,
			wantType:   "string",
		},
		{
			name:       "non-default unary constraint is not treated as a string list",
			expression: `!=["default"] | [...string]`,
			wantType:   "string",
		},
		{
			name:       "empty list does not imply string items",
			expression: `[] | [...string]`,
			wantType:   "string",
		},
		{
			name:       "bytes literals are not projected as string enums",
			expression: `'fuzzing' | 'SCA'`,
			wantType:   "string",
		},
		{
			name:       "mixed string and bytes literals fail closed",
			expression: `"fuzzing" | 'SCA'`,
			wantType:   "string",
		},
	}

	for _, test := range tests {
		test := test
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			expr, err := parser.ParseExpr("test.cue", test.expression)
			if err != nil {
				t.Fatalf("parse expression %q: %v", test.expression, err)
			}
			got, ok := convertExprToSchema(expr, &OpenAPISpec{}, "").(*SchemaInfo)
			if !ok {
				t.Fatalf("projection type = %T; want *SchemaInfo", got)
			}
			if got.Type != test.wantType {
				t.Fatalf("type = %q; want %q", got.Type, test.wantType)
			}
			if !reflect.DeepEqual(got.Enum, test.wantEnum) {
				t.Fatalf("enum = %#v; want %#v", got.Enum, test.wantEnum)
			}
			if test.wantItemsType == "" {
				if got.Items != nil {
					t.Fatalf("items = %#v; want nil", got.Items)
				}
				return
			}
			items, ok := got.Items.(*SchemaInfo)
			if !ok || items.Type != test.wantItemsType {
				t.Fatalf("items = %#v; want type %q", got.Items, test.wantItemsType)
			}
		})
	}
}
