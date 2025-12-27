package main

import (
	"fmt"
	"os"
	"strings"

	"cuelang.org/go/cue/ast"
	"cuelang.org/go/cue/token"
	"gopkg.in/yaml.v3"
)

type OpenAPISpec struct {
	OpenAPI    string            `yaml:"openapi" json:"openapi"`
	Info       OpenAPIInfo       `yaml:"info" json:"info"`
	Components OpenAPIComponents `yaml:"components" json:"components"`
}

type OpenAPIInfo struct {
	Title       string `yaml:"title" json:"title"`
	Version     string `yaml:"version" json:"version"`
	Description string `yaml:"description,omitempty" json:"description,omitempty"`
}

type OpenAPIComponents struct {
	Schemas map[string]interface{} `yaml:"schemas" json:"schemas"`
}

type SchemaInfo struct {
	Type        string                 `yaml:"type,omitempty" json:"type,omitempty"`
	Description string                 `yaml:"description,omitempty" json:"description,omitempty"`
	Properties  map[string]interface{} `yaml:"properties,omitempty" json:"properties,omitempty"`
	Required    []string               `yaml:"required,omitempty" json:"required,omitempty"`
	Pattern     string                 `yaml:"pattern,omitempty" json:"pattern,omitempty"`
	Format      string                 `yaml:"format,omitempty" json:"format,omitempty"`
	Items       interface{}            `yaml:"items,omitempty" json:"items,omitempty"`
	Ref         string                 `yaml:"$ref,omitempty" json:"$ref,omitempty"`
}

func readVersion() string {
	path := "../../VERSION"

	if data, err := os.ReadFile(path); err == nil {
		version := strings.TrimSpace(string(data))
		if version != "" {
			return version
		}
	}

	return "unknown version"
}

func parseCUEToOpenAPI(file *ast.File) *OpenAPISpec {
	version := readVersion()
	spec := &OpenAPISpec{
		OpenAPI: "3.0.3",
		Info: OpenAPIInfo{
			Title:   "Security Insights Specification",
			Version: version,
		},
		Components: OpenAPIComponents{
			Schemas: make(map[string]interface{}),
		},
	}

	// Extract root type description
	var rootDescription string
	for _, decl := range file.Decls {
		if field, ok := decl.(*ast.Field); ok {
			if ident, ok := field.Label.(*ast.Ident); ok && ident.Name == "#SecurityInsights" {
				if field.Comments() != nil {
					for _, cg := range field.Comments() {
						for _, c := range cg.List {
							if c.Text != "" {
								rootDescription = extractComment(c.Text)
								break
							}
						}
					}
				}
				if rootDescription != "" {
					spec.Info.Description = rootDescription
				}
				break
			}
		}
	}

	// Walk through all declarations to find type definitions
	for _, decl := range file.Decls {
		switch x := decl.(type) {
		case *ast.Field:
			parseDefinitionField(x, spec)
		}
	}

	return spec
}

func parseDefinitionField(field *ast.Field, spec *OpenAPISpec) {
	var typeName string

	// Extract type name from label
	switch label := field.Label.(type) {
	case *ast.Ident:
		if strings.HasPrefix(label.Name, "#") {
			typeName = strings.TrimPrefix(label.Name, "#")
		} else {
			return // Not a definition
		}
	default:
		return // Not a definition
	}

	// Extract description from comments
	description := ""
	if field.Comments() != nil {
		for _, cg := range field.Comments() {
			for _, c := range cg.List {
				if c.Text != "" {
					desc := extractComment(c.Text)
					if desc != "" {
						description = desc
						break
					}
				}
			}
		}
	}

	// Parse struct body
	if st, ok := field.Value.(*ast.StructLit); ok {
		schema := convertStructToSchema(st, spec, description)
		spec.Components.Schemas[typeName] = schema
	} else {
		// Handle type aliases (like #URL, #Email with patterns)
		// Check if it's a UnaryExpr (CUE parses =~"pattern" as UnaryExpr with MAT op)
		if ue, ok := field.Value.(*ast.UnaryExpr); ok {
			// Check if it's a regex match operator
			if ue.Op == token.MAT || ue.Op == token.NMAT {
				// Extract the pattern from the BasicLit
				if lit, ok := ue.X.(*ast.BasicLit); ok && lit.Kind == token.STRING {
					pattern := strings.Trim(lit.Value, "\"")
					spec.Components.Schemas[typeName] = &SchemaInfo{
						Type:        "string",
						Description: description,
						Pattern:     pattern,
					}
					return
				}
			}
		}
		// Also check if it's directly a BinaryExpr
		if be, ok := field.Value.(*ast.BinaryExpr); ok {
			if be.Op == token.MAT || be.Op == token.NMAT {
				var pattern string
				if lit, ok := be.Y.(*ast.BasicLit); ok && lit.Kind == token.STRING {
					pattern = strings.Trim(lit.Value, "\"")
				} else if lit, ok := be.X.(*ast.BasicLit); ok && lit.Kind == token.STRING {
					pattern = strings.Trim(lit.Value, "\"")
				}
				if pattern != "" {
					spec.Components.Schemas[typeName] = &SchemaInfo{
						Type:        "string",
						Description: description,
						Pattern:     pattern,
					}
					return
				}
			}
		}
		// Check if it's a CallExpr (e.g., time.Format for Date)
		if ce, ok := field.Value.(*ast.CallExpr); ok {
			schema := convertTypeAlias(ce, spec, description)
			if schema != nil && (schema.Pattern != "" || schema.Format != "") {
				spec.Components.Schemas[typeName] = schema
				return
			}
		}
		// Use convertExprToSchema for other cases
		schema := convertExprToSchema(field.Value, spec, description)
		if schemaInfo, ok := schema.(*SchemaInfo); ok {
			spec.Components.Schemas[typeName] = schemaInfo
		} else {
			// Fallback: create a basic string schema
			spec.Components.Schemas[typeName] = &SchemaInfo{Type: "string", Description: description}
		}
	}
}

func convertStructToSchema(st *ast.StructLit, spec *OpenAPISpec, description string) *SchemaInfo {
	schema := &SchemaInfo{
		Type:        "object",
		Description: description,
		Properties:  make(map[string]interface{}),
		Required:    []string{},
	}

	var pendingComment string

	for _, elt := range st.Elts {
		switch x := elt.(type) {
		case *ast.Field:
			fieldSchema := convertFieldToSchema(x, spec, pendingComment)
			if fieldSchema != nil {
				fieldName := getFieldName(x)
				if fieldName != "" {
					schema.Properties[fieldName] = fieldSchema
					// Check if field is required
					if x.Optional == token.NoPos {
						schema.Required = append(schema.Required, fieldName)
					}
				}
			}
			pendingComment = ""
		case *ast.CommentGroup:
			// Collect comment for next field
			for _, c := range x.List {
				if c.Text != "" {
					pendingComment = extractComment(c.Text)
					break
				}
			}
		}
	}

	return schema
}

func convertFieldToSchema(field *ast.Field, spec *OpenAPISpec, pendingComment string) interface{} {
	fieldDesc := pendingComment

	// Extract description from field's own comments
	if field.Comments() != nil {
		for _, cg := range field.Comments() {
			for _, c := range cg.List {
				if c.Text != "" {
					desc := extractComment(c.Text)
					if desc != "" {
						fieldDesc = desc
						break
					}
				}
			}
		}
	}

	return convertExprToSchema(field.Value, spec, fieldDesc)
}

func convertExprToSchema(expr ast.Expr, spec *OpenAPISpec, description string) interface{} {
	switch x := expr.(type) {
	case *ast.Ident:
		return convertIdentToSchema(x, spec, description)
	case *ast.BinaryExpr:
		return convertBinaryExprToSchema(x, spec, description)
	case *ast.ListLit:
		return convertListLitToSchema(x, spec, description)
	case *ast.StructLit:
		// Inline struct - convert recursively
		return convertStructToSchema(x, spec, description)
	case *ast.UnaryExpr:
		// Handle optional markers
		return convertExprToSchema(x.X, spec, description)
	}

	return &SchemaInfo{Type: "string", Description: description}
}

func convertIdentToSchema(ident *ast.Ident, spec *OpenAPISpec, description string) interface{} {
	name := ident.Name

	if name == "string" {
		return &SchemaInfo{Type: "string", Description: description}
	} else if name == "bool" {
		return &SchemaInfo{Type: "boolean", Description: description}
	} else if strings.HasPrefix(name, "#") {
		// Type reference
		refType := strings.TrimPrefix(name, "#")
		return &SchemaInfo{Ref: fmt.Sprintf("#/components/schemas/%s", refType), Description: description}
	}

	return &SchemaInfo{Type: "string", Description: description}
}

func convertBinaryExprToSchema(expr *ast.BinaryExpr, spec *OpenAPISpec, description string) interface{} {
	// Handle patterns like =~"^pattern$"
	// In CUE, =~ is token.MAT (match) and !~ is token.NMAT (not match)
	// The pattern is typically on the right side (Y) for =~"pattern"
	if expr.Op == token.MAT || expr.Op == token.NMAT {
		// Check right side first (most common case: =~"pattern")
		if lit, ok := expr.Y.(*ast.BasicLit); ok && lit.Kind == token.STRING {
			pattern := strings.Trim(lit.Value, "\"")
			return &SchemaInfo{
				Type:        "string",
				Description: description,
				Pattern:     pattern,
			}
		}
		// Check left side (less common: "pattern"=~)
		if lit, ok := expr.X.(*ast.BasicLit); ok && lit.Kind == token.STRING {
			pattern := strings.Trim(lit.Value, "\"")
			return &SchemaInfo{
				Type:        "string",
				Description: description,
				Pattern:     pattern,
			}
		}
	}

	// Handle union types (disjunctions)
	if expr.Op == token.OR {
		return &SchemaInfo{Type: "string", Description: description}
	}

	return &SchemaInfo{Type: "string", Description: description}
}

func convertListLitToSchema(list *ast.ListLit, spec *OpenAPISpec, description string) interface{} {
	// Check if it's an ellipsis list like [...#Contact] or [#Contact, ...]
	for _, elt := range list.Elts {
		if ellipsis, ok := elt.(*ast.Ellipsis); ok {
			if ellipsis.Type != nil {
				itemSchema := convertExprToSchema(ellipsis.Type, spec, "")
				return &SchemaInfo{
					Type:        "array",
					Description: description,
					Items:       itemSchema,
				}
			}
		}
		// Also check for [#Contact, ...] pattern
		if ident, ok := elt.(*ast.Ident); ok {
			if strings.HasPrefix(ident.Name, "#") {
				refType := strings.TrimPrefix(ident.Name, "#")
				return &SchemaInfo{
					Type:        "array",
					Description: description,
					Items: &SchemaInfo{
						Ref: fmt.Sprintf("#/components/schemas/%s", refType),
					},
				}
			}
		}
	}

	return &SchemaInfo{Type: "array", Description: description, Items: &SchemaInfo{Type: "string"}}
}

func convertTypeAlias(expr ast.Expr, spec *OpenAPISpec, description string) *SchemaInfo {
	switch x := expr.(type) {
	case *ast.BinaryExpr:
		// Handle pattern validators like #URL: =~"^https?://..."
		// In CUE, =~ is a match operator, pattern is on the right (Y)
		if x.Op == token.MAT || x.Op == token.NMAT {
			// Check if pattern is on the right side
			if lit, ok := x.Y.(*ast.BasicLit); ok && lit.Kind == token.STRING {
				pattern := strings.Trim(lit.Value, "\"")
				return &SchemaInfo{
					Type:        "string",
					Description: description,
					Pattern:     pattern,
				}
			}
			// Also check left side in case AST structure is reversed
			if lit, ok := x.X.(*ast.BasicLit); ok && lit.Kind == token.STRING {
				pattern := strings.Trim(lit.Value, "\"")
				return &SchemaInfo{
					Type:        "string",
					Description: description,
					Pattern:     pattern,
				}
			}
		}
	case *ast.CallExpr:
		// Handle time.Format calls for Date
		if sel, ok := x.Fun.(*ast.SelectorExpr); ok {
			if ident, ok := sel.X.(*ast.Ident); ok && ident.Name == "time" {
				if selLabel, ok := sel.Sel.(*ast.Ident); ok && selLabel.Name == "Format" {
					return &SchemaInfo{
						Type:        "string",
						Description: description,
						Format:      "date",
						Pattern:     "^\\d{4}-\\d{2}-\\d{2}$",
					}
				}
			}
		}
	}

	return &SchemaInfo{Type: "string", Description: description}
}

func getFieldName(field *ast.Field) string {
	switch label := field.Label.(type) {
	case *ast.Ident:
		return label.Name
	case *ast.BasicLit:
		if label.Kind == token.STRING {
			return strings.Trim(label.Value, "\"")
		}
	}
	return ""
}

func extractComment(text string) string {
	// Remove leading // and clean up
	text = strings.TrimPrefix(text, "//")
	text = strings.TrimSpace(text)
	return text
}

func writeOpenAPISpec(spec *OpenAPISpec, outputPath string) error {
	// Convert to YAML
	data, err := yaml.Marshal(spec)
	if err != nil {
		return fmt.Errorf("failed to marshal OpenAPI spec: %v", err)
	}

	return os.WriteFile(outputPath, data, 0644)
}
