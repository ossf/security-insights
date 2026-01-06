package main

// Example: Extending the Security Insights schema
//
// This example demonstrates how to import the Security Insights schema
// and extend it with additional validation or default values.
//
// Usage:
//   cue vet example-extend.cue security-insights.yml

import "github.com/ossf/security-insights"

// Extend the Security Insights schema with additional constraints
data: #SecurityInsights & {
	// Ensure schema version is at least 2.0.0
	header: {
		"schema-version": >="2.0.0"
	}

	// Ensure project has at least one repository
	if project != _|_ {
		project: {
			repositories: [...]
			repositories: len >= 1
		}
	}

	// Ensure repository status is active if it accepts change requests
	if repository != _|_ {
		repository: {
			if "accepts-change-request" == true {
				status: "active"
			}
		}
	}
}
