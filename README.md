[<img src="https://img.shields.io/badge/slack-@openssf/security%20insights-green.svg?logo=slack">](https://openssf.slack.com/messages/security_insights/)

# Security Insights Specification

This specification provides a mechanism for projects to report information about their security in a machine-processable way. It is formatted as a YAML file to make it easy to read and edit by humans.

The data tracked within this specification is intended to fill the gaps between simplified solutions such as `SECURITY.md` and comprehensive automated solutions such as SBOMs. In that gap lay elements that must be self-reported by projects to allow end-users to make informed security decisions.

## Usage by project maintainers

We hope your project appreciates the value the specification provides and makes the decision to use it. Here's how you can.

### Initial Adoption

Projects adopting the specification in a single project repository should be able to get started and produce a useful `security-insights.yml` in about 30 minutes by consulting the [`example-minimum.yml`](examples/example-minimum.yml).

If your project has multiple repositories, you can define a detailed and centralized insights file in one repository and then reuse the `project` definition from that across other files. The consuming insights files must provide a URL in `header.project-si-source` that points to the parent insights file. The URL provided must respond to an unauthenticated GET request and return a valid security insights file using a content-type of "text/plain" or "application/yaml". See [`example-multi-repository-project.yml`](examples/example-multi-repository-project.yml) and [`example-multi-repository-project-reuse.yml`](examples/example-multi-repository-project-reuse.yml) that demonstrate how this use case can be implemented.

Projects should include a `security-insights.yml` file in the root of their repository, or in the appropriate source forge directory such as `.github/` or `.gitlab/`.

To ensure you are adhering to an official version of the specification, please refer to the `schema.cue` and `Security-Insights-{version}.pdf` in the [latest release](https://github.com/ossf/security-insights-spec/releases/latest).

### Plan your project security investments

In reviewing the schema, the examples, and creating a `security-insights.yml` for your project, you probably found many parts of the specification that you would like to be able to add over time. It can be helpful to refer to [`example-full.yml`](examples/example-full.yml) and identify sections for targeted improvement. Consider filing issues in your project's issue tracker for each section so the community understands how you prioritize these investments.

### Ongoing Maintenance

As the project and community around it evolve over time, so too does the project's security posture. As the posture of the project changes, these changes should be reflected in updates to `security-insights.yml`. In the example below, we see the insights data was `last-updated` quite some time ago, but the `last-reviewed` highlights the project's ongoing maintenance efforts to review the data for accuracy.

```yaml
header:
  schema-version: 2.0.0
  last-updated: '2025-01-15'
  last-reviewed: '2025-04-03' # no changes needed, reviewed as part of last minor version release
```

Consider using [a scheduled issue](https://docs.github.com/en/actions/use-cases-and-examples/project-management/scheduling-issue-creation) in your project's issue tracker to review the data every 1, 3 or 6 months and make required updates to `security-insights.yml`.

## Usage by project consumers

Consumers of the `security-insights.yml` file(s) provided by projects should assume the contents will be updated any time the relevant information changes.

## Releases

This repository often remains unchanged from the latest release, but may diverge as incremental development takes place in preparation for an upcoming release. Any differences between the latest release and the main branch should only be considered previews of the next release.

## Tooling Ecosystem

As the adoption of Security Insights grows, so does the opportunity to automatically ingest it:

- **[CLOMonitor](https://clomonitor.io/)** - The Linux Foundation's tool that parses Security Insights files to determine whether projects have reported on select security factors
- **[LFX Insights](https://insights.lfx.linuxfoundation.org/)** - The Linux Foundation's tool that reads a project's Security Insights file to evaluate security hygiene against the OSPS Baseline assessment requirements
- **[si-tooling](https://github.com/ossf/si-tooling)** - Community-maintained tools for reading, validating and manipulating Security Insights data

## Maintenance

The specification maintenance occurs in the following places:

- `spec/`: Contains markdown documentation for all specification values (generated from `schema.cue`)
- `schema.cue`: Contains the CUE schema that can be used to validate files against the specification

### Generating Documentation

Documentation is generated from the CUE schema using a CUE→OpenAPI→Markdown pipeline:

1. **Generate OpenAPI schema**: `make genopenapi` - Converts `schema.cue` to `openapi.yaml`
2. **Generate Markdown**: `make gendocs` - Converts `openapi.yaml` to markdown files in `spec/`
3. **Generate PDF**: `make genpdf` - Converts markdown files to PDF (requires pandoc)

**Prerequisites:**
- Go (for CUE to OpenAPI and OpenAPI to Markdown conversion)
- Pandoc (optional, for PDF generation): `brew install pandoc` (macOS) or `apt-get install pandoc` (Linux)

Examples are also available to provide further context to the specification details above.

- `examples/example-full.yml`: Contains a template that includes all possible fields
- `examples/example-minimum.yml`: Contains a template that includes only the required fields
- `examples/example-multi-repository-project.yml`: Contains an extension of `examples/example-minimum.yml` for the primary repository of a multi-repository project
- `examples/example-multi-repository-project-reuse.yml`: Contains a template for a secondary repository of a multi-repository project

Discussion and feedback should take place in [GitHub Issues](https://github.com/ossf/security-insights-spec/issues). We ask that you follow the [Security Insights Enhancement Proposal](./docs/GOVERNANCE.md#security-insights-enhancement-proposals) process to explore potential changes to the specification.
