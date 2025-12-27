package main

// Example: Validating a Security Insights YAML file
//
// This example shows how to validate a security-insights.yml file
// against the Security Insights schema using the CUE module.
//
// Usage:
//   cue vet example-validate.cue security-insights.yml
//
// Or if your YAML file is named security-insights.yml:
//   cue vet example-validate.cue

import "github.com/ossf/security-insights"

// Load and validate the security insights data
// The YAML file will be automatically loaded and validated
data: #SecurityInsights
