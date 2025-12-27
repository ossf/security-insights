package main

// Example: Generating a Security Insights file from CUE
//
// This example shows how to define Security Insights data in CUE
// and export it as YAML or JSON.
//
// Usage:
//   cue export example-generate.cue -o security-insights.yml
//   cue export example-generate.cue -o security-insights.json

import "github.com/ossf/security-insights"

// Define your security insights data
data: #SecurityInsights & {
	header: {
		"schema-version": "2.2.0"
		"last-updated":   "2025-01-15"
		"last-reviewed":  "2025-01-15"
		url:              "https://example.com/security-insights.yml"
		comment:          "Example Security Insights file generated from CUE"
	}

	project: {
		name: "Example Project"
		administrators: [{
			name:    "Jane Doe"
			primary: true
			email:   "jane@example.com"
		}]
		repositories: [{
			name:    "example-repo"
			url:     "https://github.com/example/example-repo"
			comment: "Main repository"
		}]
		"vulnerability-reporting": {
			"reports-accepted":     true
			"bug-bounty-available": false
		}
	}

	repository: {
		url:                                "https://github.com/example/example-repo"
		status:                             "active"
		"accepts-change-request":           true
		"accepts-automated-change-request": true
		"core-team": [{
			name:    "Jane Doe"
			primary: true
			email:   "jane@example.com"
		}]
		license: {
			url:        "https://github.com/example/example-repo/blob/main/LICENSE"
			expression: "MIT"
		}
		security: {
			assessments: {
				self: {
					comment: "Self-assessment completed"
					date:    "2025-01-15"
				}
			}
		}
	}
}
