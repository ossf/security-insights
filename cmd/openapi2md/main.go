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
	OpenAPI    string            `yaml:"openapi"`
	Info       OpenAPIInfo       `yaml:"info"`
	Components OpenAPIComponents `yaml:"components"`
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
	Required    []string               `yaml:"required"`
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

	// Find SecurityInsights schema
	securityInsightsData, exists := spec.Components.Schemas["SecurityInsights"]
	if !exists {
		return fmt.Errorf("SecurityInsights schema not found in OpenAPI spec")
	}

	securityInsightsBytes, _ := yaml.Marshal(securityInsightsData)
	var securityInsights Schema
	if err := yaml.Unmarshal(securityInsightsBytes, &securityInsights); err != nil {
		return fmt.Errorf("failed to parse SecurityInsights schema: %v", err)
	}

	// Collect aliases
	var aliasTypes []string
	for schemaName, schemaData := range spec.Components.Schemas {
		if schemaName == "SecurityInsights" {
			continue
		}
		schemaBytes, _ := yaml.Marshal(schemaData)
		var schema Schema
		if err := yaml.Unmarshal(schemaBytes, &schema); err != nil {
			continue
		}
		if isAlias(schema) {
			aliasTypes = append(aliasTypes, schemaName)
		}
	}
	sortStrings(aliasTypes)

	// Generate markdown starting with SecurityInsights
	var buf strings.Builder
	visited := make(map[string]bool)

	// Generate SecurityInsights section
	buf.WriteString(generateSecurityInsightsSection(securityInsights, spec, spec.Info.Version, visited))

	// Generate aliases section
	if len(aliasTypes) > 0 {
		buf.WriteString(fmt.Sprintf("\n## Aliases _(%s)_\n\n", spec.Info.Version))
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
				buf.WriteString(fmt.Sprintf("- **Value**: `%s`\n", schema.Pattern))
			} else if schema.Format != "" {
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

func isAlias(schema Schema) bool {
	// Aliases are anything that is NOT an object with properties
	// This includes: string types (with or without patterns), boolean, and simple object types
	return schema.Properties == nil
}

func resolveSchemaRef(ref string, spec OpenAPISpec) (*Schema, error) {
	if !strings.HasPrefix(ref, "#/components/schemas/") {
		return nil, fmt.Errorf("invalid ref format: %s", ref)
	}

	schemaName := strings.TrimPrefix(ref, "#/components/schemas/")
	schemaData, exists := spec.Components.Schemas[schemaName]
	if !exists {
		return nil, fmt.Errorf("schema not found: %s", schemaName)
	}

	schemaBytes, _ := yaml.Marshal(schemaData)
	var schema Schema
	if err := yaml.Unmarshal(schemaBytes, &schema); err != nil {
		return nil, fmt.Errorf("failed to parse schema %s: %v", schemaName, err)
	}

	return &schema, nil
}

func generateSecurityInsightsSection(schema Schema, spec OpenAPISpec, version string, visited map[string]bool) string {
	var buf strings.Builder

	// H1 Title
	buf.WriteString(fmt.Sprintf("# Security Insights Specification _(%s)_\n\n", version))

	// Description
	if schema.Description != "" {
		buf.WriteString(schema.Description + "\n\n")
	}

	// Required vs Optional Fields
	if len(schema.Required) > 0 || schema.Properties != nil {
		buf.WriteString("## Required vs Optional Fields\n\n")
		if len(schema.Required) > 0 {
			buf.WriteString("Required:\n\n")
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

	// Generate nested sections for each field
	if schema.Properties != nil {
		for propName, propData := range schema.Properties {
			propBytes, _ := yaml.Marshal(propData)
			var prop Schema
			yaml.Unmarshal(propBytes, &prop)

			isRequired := false
			for _, req := range schema.Required {
				if req == propName {
					isRequired = true
					break
				}
			}

			buf.WriteString(generateFieldSection(propName, prop, spec, 2, "", visited, !isRequired))
		}
	}

	return buf.String()
}

func generateFieldSection(fieldName string, fieldSchema Schema, spec OpenAPISpec, headingLevel int, prefix string, visited map[string]bool, isOptional bool) string {
	var buf strings.Builder

	// Build field path
	fieldPath := fieldName
	if prefix != "" {
		fieldPath = prefix + "." + fieldName
	}

	// Generate heading
	heading := strings.Repeat("#", headingLevel)
	buf.WriteString(fmt.Sprintf("%s `%s`\n\n", heading, fieldPath))
	if isOptional {
		buf.WriteString("**Optional Field**\n\n")
	}

	// Handle $ref - resolve and recurse
	if fieldSchema.Ref != "" {
		refType := strings.TrimPrefix(fieldSchema.Ref, "#/components/schemas/")

		// Check if it's an alias - if so, just show the type reference
		refSchema, err := resolveSchemaRef(fieldSchema.Ref, spec)
		if err == nil && isAlias(*refSchema) {
			// Just show description and type reference
			if fieldSchema.Description != "" {
				buf.WriteString(fieldSchema.Description + "\n\n")
			}
			buf.WriteString(fmt.Sprintf("- **Type**: [%s]\n", refType))
			buf.WriteString("\n---\n\n")
			return buf.String()
		}

		// Prevent infinite recursion
		if visited[refType] {
			if fieldSchema.Description != "" {
				buf.WriteString(fieldSchema.Description + "\n\n")
			}
			buf.WriteString(fmt.Sprintf("- **Type**: [%s]\n\n", refType))
			buf.WriteString("---\n\n")
			return buf.String()
		}

		visited[refType] = true
		defer delete(visited, refType)

		// Resolve the referenced schema
		refSchema, err = resolveSchemaRef(fieldSchema.Ref, spec)
		if err != nil {
			buf.WriteString(fmt.Sprintf("Error resolving reference: %v\n\n", err))
			return buf.String()
		}

		// Show description (from field or referenced type)
		description := fieldSchema.Description
		if description == "" {
			description = refSchema.Description
		}
		if description != "" {
			buf.WriteString(description + "\n\n")
		}

		// Show type reference (refType already declared above)
		buf.WriteString(fmt.Sprintf("- **Type**: [%s]\n", refType))

		// Show required vs optional for the referenced type
		if len(refSchema.Required) > 0 || refSchema.Properties != nil {
			buf.WriteString("\n")
			buf.WriteString("### Required vs Optional Fields\n\n")
			if len(refSchema.Required) > 0 {
				buf.WriteString(fmt.Sprintf("Required if `%s` is present:\n\n", fieldPath))
				for _, req := range refSchema.Required {
					buf.WriteString(fmt.Sprintf("- `%s`\n", req))
				}
			}
			if refSchema.Properties != nil {
				var optional []string
				for propName := range refSchema.Properties {
					isRequired := false
					for _, req := range refSchema.Required {
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

		// Recursively generate nested fields
		if refSchema.Properties != nil {
			for propName, propData := range refSchema.Properties {
				propBytes, _ := yaml.Marshal(propData)
				var prop Schema
				yaml.Unmarshal(propBytes, &prop)

				propIsRequired := false
				for _, req := range refSchema.Required {
					if req == propName {
						propIsRequired = true
						break
					}
				}

				buf.WriteString(generateFieldSection(propName, prop, spec, headingLevel+1, fieldPath, visited, !propIsRequired))
			}
		}
	} else if fieldSchema.Type == "object" && fieldSchema.Properties != nil {
		// Inline object with properties - recurse into it
		if fieldSchema.Description != "" {
			buf.WriteString(fieldSchema.Description + "\n\n")
		}

		// Show required vs optional for the inline object
		if len(fieldSchema.Required) > 0 || fieldSchema.Properties != nil {
			buf.WriteString("### Required vs Optional Fields\n\n")
			if len(fieldSchema.Required) > 0 {
				buf.WriteString(fmt.Sprintf("Required if `%s` is present:\n\n", fieldPath))
				for _, req := range fieldSchema.Required {
					buf.WriteString(fmt.Sprintf("- `%s`\n", req))
				}
			}
			if fieldSchema.Properties != nil {
				var optional []string
				for propName := range fieldSchema.Properties {
					isRequired := false
					for _, req := range fieldSchema.Required {
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

		// Recursively generate nested fields
		for propName, propData := range fieldSchema.Properties {
			propBytes, _ := yaml.Marshal(propData)
			var prop Schema
			yaml.Unmarshal(propBytes, &prop)

			propIsRequired := false
			for _, req := range fieldSchema.Required {
				if req == propName {
					propIsRequired = true
					break
				}
			}

			buf.WriteString(generateFieldSection(propName, prop, spec, headingLevel+1, fieldPath, visited, !propIsRequired))
		}
	} else {
		// Simple field (no $ref, no inline object)
		if fieldSchema.Description != "" {
			buf.WriteString(fieldSchema.Description + "\n\n")
		}

		if fieldSchema.Type != "" {
			buf.WriteString(fmt.Sprintf("- **Type**: `%s`\n", fieldSchema.Type))
		}

		if fieldSchema.Pattern != "" {
			buf.WriteString(fmt.Sprintf("- **Matches Pattern**: `%s`\n", fieldSchema.Pattern))
		}

		// Handle array items
		if fieldSchema.Type == "array" && fieldSchema.Items != nil {
			itemsBytes, _ := yaml.Marshal(fieldSchema.Items)
			var itemsSchema Schema
			if err := yaml.Unmarshal(itemsBytes, &itemsSchema); err == nil {
				if itemsSchema.Ref != "" {
					refType := strings.TrimPrefix(itemsSchema.Ref, "#/components/schemas/")
					buf.WriteString(fmt.Sprintf("- **Items**: [%s]\n", refType))
				} else if itemsSchema.Type != "" {
					buf.WriteString(fmt.Sprintf("- **Items**: `%s`\n", itemsSchema.Type))
				}
			}
		}

		buf.WriteString("\n---\n\n")
	}

	return buf.String()
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
