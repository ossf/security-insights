package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"

	"cuelang.org/go/cue/load"
)

func main() {
	schemaPath := flag.String("schema", "spec/schema.cue", "Path to the CUE schema file")
	outputPath := flag.String("output", "openapi.yaml", "Output path for OpenAPI schema")
	flag.Parse()

	if err := convertCUEToOpenAPI(*schemaPath, *outputPath); err != nil {
		fmt.Fprintf(os.Stderr, "Error converting CUE to OpenAPI: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("OpenAPI schema generated successfully at %s\n", *outputPath)
}

func convertCUEToOpenAPI(schemaPath, outputPath string) error {
	// Resolve to absolute path if relative
	if !filepath.IsAbs(schemaPath) {
		wd, err := os.Getwd()
		if err != nil {
			return fmt.Errorf("failed to get working directory: %v", err)
		}
		schemaPath = filepath.Join(wd, schemaPath)
	}

	// Load and parse the CUE schema
	dir := filepath.Dir(schemaPath)
	insts := load.Instances([]string{filepath.Base(schemaPath)}, &load.Config{
		Dir: dir,
	})

	if len(insts) == 0 || insts[0].Err != nil {
		return fmt.Errorf("failed to load CUE schema: %v", insts[0].Err)
	}

	// Parse the AST to extract structure
	file := insts[0].Files[0]
	openapiSpec := parseCUEToOpenAPI(file)

	// Write OpenAPI spec as YAML
	return writeOpenAPISpec(openapiSpec, outputPath)
}

