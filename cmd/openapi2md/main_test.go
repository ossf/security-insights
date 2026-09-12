package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestMarkdownPreservesArrayAndEnumSemantics(t *testing.T) {
	t.Parallel()

	inputPath := filepath.Join(t.TempDir(), "openapi.yaml")
	input := `openapi: 3.0.3
info:
  title: Security Insights
  version: test
components:
  schemas:
    SecurityInsights:
      type: object
      properties: {}
    SecurityTool:
      type: object
      properties:
        rulesets:
          type: array
          items:
            type: string
        type:
          type: string
          enum:
            - fuzzing
            - container
            - secret
            - SCA
            - SAST
            - other
      required:
        - rulesets
        - type
`
	if err := os.WriteFile(inputPath, []byte(input), 0o600); err != nil {
		t.Fatalf("write OpenAPI fixture: %v", err)
	}

	outputDir := t.TempDir()
	if err := convertOpenAPIToMarkdown(inputPath, outputDir, []string{"SecurityInsights"}); err != nil {
		t.Fatalf("convert OpenAPI to Markdown: %v", err)
	}
	data, err := os.ReadFile(filepath.Join(outputDir, "schema.md"))
	if err != nil {
		t.Fatalf("read generated Markdown: %v", err)
	}
	got := string(data)
	if !strings.Contains(got, "`rulesets` **array[string]** _Required_") {
		t.Fatalf("generated Markdown does not preserve rulesets as array[string]:\n%s", got)
	}
	wantAllowed := "Allowed values: `fuzzing`, `container`, `secret`, `SCA`, `SAST`, `other`."
	if !strings.Contains(got, wantAllowed) {
		t.Fatalf("generated Markdown does not preserve enum values; want %q:\n%s", wantAllowed, got)
	}
}

func TestFormatEnumValueUsesSafeCodeSpans(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name  string
		value string
		want  string
	}{
		{name: "plain", value: "fuzzing", want: "`fuzzing`"},
		{name: "embedded backtick", value: "tick`mark", want: "``tick`mark``"},
		{name: "edge backticks", value: "`tick`", want: "`` `tick` ``"},
		{name: "newline", value: "line\nfeed", want: "`\"line\\nfeed\"`"},
		{name: "empty", value: "", want: "`\"\"`"},
		{name: "edge whitespace", value: " padded ", want: "`\" padded \"`"},
		{name: "nul", value: "a\x00b", want: "`\"a\\x00b\"`"},
		{name: "backspace", value: "a\bb", want: "`\"a\\bb\"`"},
		{name: "form feed", value: "a\fb", want: "`\"a\\fb\"`"},
		{name: "escape", value: "a\x1bb", want: "`\"a\\x1bb\"`"},
		{name: "line separator", value: "a\u2028b", want: "`\"a\\u2028b\"`"},
	}

	for _, test := range tests {
		test := test
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			if got := formatEnumValue(test.value); got != test.want {
				t.Fatalf("formatEnumValue(%q) = %q; want %q", test.value, got, test.want)
			}
		})
	}
}
