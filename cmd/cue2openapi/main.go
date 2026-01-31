package main

import (
	"flag"
	"fmt"
	"os"
)

func main() {
	schemaDir := flag.String("schema", "../..", "Path to the CUE package directory")
	outputPath := flag.String("output", "openapi.yaml", "Output path for OpenAPI schema")
	manifestPath := flag.String("manifest", "", "Optional path to write schema→file manifest JSON")
	root := flag.String("root", "", "Optional root definition (#Name) whose comment sets spec description")
	version := flag.String("version", "", "Optional version string (default: VERSION file in schema dir or \"unknown\")")
	title := flag.String("title", "Security Insights", "OpenAPI info title")
	flag.Parse()

	if err := convertCUEToOpenAPI(*schemaDir, *outputPath, ConvertOpts{
		ManifestPath: *manifestPath,
		Root:         *root,
		Version:      *version,
		Title:        *title,
	}); err != nil {
		fmt.Fprintf(os.Stderr, "Error converting CUE to OpenAPI: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("OpenAPI schema generated successfully at %s\n", *outputPath)
}
