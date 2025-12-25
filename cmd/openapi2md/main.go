package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"gopkg.in/yaml.v3"
)

type OpenAPISpec struct {
	OpenAPI    string                 `yaml:"openapi"`
	Info       OpenAPIInfo            `yaml:"info"`
	Components OpenAPIComponents      `yaml:"components"`
}

type OpenAPIInfo struct {
	Title       string `yaml:"title"`
	Version     string `yaml:"version"`
	Description string `yaml:"description"`
}

type OpenAPIComponents struct {
	Schemas map[string]interface{} `yaml:"schemas"`
}

type Schema struct {
	Type        string                 `yaml:"type"`
	Description string                 `yaml:"description"`
	Properties  map[string]interface{} `yaml:"properties"`
	Required    []string                `yaml:"required"`
	Pattern     string                 `yaml:"pattern"`
	Format      string                 `yaml:"format"`
	Items       interface{}            `yaml:"items"`
	Ref         string                 `yaml:"$ref"`
}

func main() {
	inputFile := flag.String("input", "openapi.yaml", "Input OpenAPI YAML file")
	outputDir := flag.String("output", "spec", "Output directory for markdown files")
	flag.Parse()

	if err := convertOpenAPIToMarkdown(*inputFile, *outputDir); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Markdown documentation generated successfully in %s/\n", *outputDir)
}

func convertOpenAPIToMarkdown(inputFile, outputDir string) error {
	data, err := os.ReadFile(inputFile)
	if err != nil {
		return fmt.Errorf("failed to read OpenAPI file: %v", err)
	}

	var spec OpenAPISpec
	if err := yaml.Unmarshal(data, &spec); err != nil {
		return fmt.Errorf("failed to parse OpenAPI YAML: %v", err)
	}

	if err := os.MkdirAll(outputDir, 0755); err != nil {
		return fmt.Errorf("failed to create output directory: %v", err)
	}

	// Generate single combined markdown file
	var buf strings.Builder
	
	// Title and description
	buf.WriteString(fmt.Sprintf("# %s _(%s)_\n\n", spec.Info.Title, spec.Info.Version))
	if spec.Info.Description != "" {
		buf.WriteString(spec.Info.Description + "\n\n")
	}
	buf.WriteString("---\n\n")

	// Sort schemas: main types first, then aliases
	var mainTypes []string
	var aliasTypes []string
	
	for schemaName, schemaData := range spec.Components.Schemas {
		schemaBytes, _ := yaml.Marshal(schemaData)
		var schema Schema
		if err := yaml.Unmarshal(schemaBytes, &schema); err != nil {
			continue
		}
		
		// Simple type aliases (string with pattern or format, no properties)
		if schema.Type == "string" && (schema.Pattern != "" || schema.Format != "") && schema.Properties == nil {
			aliasTypes = append(aliasTypes, schemaName)
		} else {
			mainTypes = append(mainTypes, schemaName)
		}
	}
	
	// Sort for consistent output
	sortStrings(mainTypes)
	sortStrings(aliasTypes)
	
	// Generate markdown for main types
	for _, schemaName := range mainTypes {
		schemaBytes, _ := yaml.Marshal(spec.Components.Schemas[schemaName])
		var schema Schema
		yaml.Unmarshal(schemaBytes, &schema)
		
		buf.WriteString(generateSchemaMarkdown(schemaName, schema, spec, spec.Info.Version))
		buf.WriteString("\n\n")
	}
	
	// Generate aliases section
	if len(aliasTypes) > 0 {
		buf.WriteString(fmt.Sprintf("# Aliases _(%s)_\n\n", spec.Info.Version))
		buf.WriteString("The following aliases are used throughout the schema for consistency.\n\n")
		
		for _, name := range aliasTypes {
			schemaBytes, _ := yaml.Marshal(spec.Components.Schemas[name])
			var schema Schema
			yaml.Unmarshal(schemaBytes, &schema)
			
			buf.WriteString(fmt.Sprintf("## `%s`\n\n", strings.ToLower(name)))
			if schema.Description != "" {
				buf.WriteString(schema.Description + "\n\n")
			}
			buf.WriteString(fmt.Sprintf("- **Type**: `%s`\n", schema.Type))
			if schema.Pattern != "" {
				buf.WriteString(fmt.Sprintf("- **Pattern**: `%s`\n", schema.Pattern))
			}
			if schema.Format != "" {
				buf.WriteString(fmt.Sprintf("- **Format**: `%s`\n", schema.Format))
			}
			buf.WriteString("\n---\n\n")
		}
	}

	// Write single output file
	outputPath := filepath.Join(outputDir, "schema.md")
	if err := os.WriteFile(outputPath, []byte(buf.String()), 0644); err != nil {
		return fmt.Errorf("failed to write %s: %v", outputPath, err)
	}

	return nil
}

func sortStrings(s []string) {
	for i := 0; i < len(s)-1; i++ {
		for j := i + 1; j < len(s); j++ {
			if s[i] > s[j] {
				s[i], s[j] = s[j], s[i]
			}
		}
	}
}

func generateSchemaMarkdown(name string, schema Schema, spec OpenAPISpec, version string) string {
	var buf strings.Builder
	
	// Title
	buf.WriteString(fmt.Sprintf("# `%s` _(%s)_\n\n", strings.ToLower(name), version))
	
	// Description
	if schema.Description != "" {
		buf.WriteString(schema.Description + "\n\n")
	}

	// Required vs Optional
	if len(schema.Required) > 0 || schema.Properties != nil {
		buf.WriteString("## Required vs Optional Fields\n\n")
		if len(schema.Required) > 0 {
			buf.WriteString(fmt.Sprintf("Required if `%s` is present:\n\n", strings.ToLower(name)))
			for _, req := range schema.Required {
				buf.WriteString(fmt.Sprintf("- `%s`\n", req))
			}
		}
		if schema.Properties != nil {
			var optional []string
			for propName := range schema.Properties {
				isRequired := false
				for _, req := range schema.Required {
					if req == propName {
						isRequired = true
						break
					}
				}
				if !isRequired {
					optional = append(optional, propName)
				}
			}
			if len(optional) > 0 {
				buf.WriteString("\nOptional:\n\n")
				for _, opt := range optional {
					buf.WriteString(fmt.Sprintf("- `%s`\n", opt))
				}
			}
		}
		buf.WriteString("\n---\n\n")
	}

	// Properties
	if schema.Properties != nil {
		for propName, propData := range schema.Properties {
			propBytes, _ := yaml.Marshal(propData)
			var prop Schema
			yaml.Unmarshal(propBytes, &prop)
			
			buf.WriteString(fmt.Sprintf("## `%s.%s", strings.ToLower(name), propName))
			isRequired := false
			for _, req := range schema.Required {
				if req == propName {
					isRequired = true
					break
				}
			}
			if !isRequired {
				buf.WriteString(" (optional)")
			}
			buf.WriteString("`\n\n")
			
			if prop.Description != "" {
				buf.WriteString(fmt.Sprintf("- **Description**: %s\n", prop.Description))
			}
			
			if prop.Ref != "" {
				refType := strings.TrimPrefix(prop.Ref, "#/components/schemas/")
				buf.WriteString(fmt.Sprintf("- **Type**: [%s]\n", refType))
			} else if prop.Type != "" {
				buf.WriteString(fmt.Sprintf("- **Type**: `%s`\n", prop.Type))
			}
			
			if prop.Pattern != "" {
				buf.WriteString(fmt.Sprintf("- **Matches Pattern**: `%s`\n", prop.Pattern))
			}
			
			buf.WriteString("\n---\n\n")
		}
	}

	return buf.String()
}


