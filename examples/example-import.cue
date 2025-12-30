package main

// Example: Importing and using the Security Insights CUE module
//
// This example demonstrates how to import the Security Insights schema
// and use it to validate your security-insights.yml file.
//
// To use this example:
// 1. Initialize a CUE module in your project:
//    cue mod init github.com/your-org/your-project
//
// 2. Add the Security Insights module as a dependency:
//    cue mod get github.com/ossf/security-insights@v2.2.0
//
// 3. Validate your YAML file:
//    cue vet example-import.cue security-insights.yml

import "github.com/ossf/security-insights"

// Validate that your data conforms to the Security Insights schema
data: #SecurityInsights
