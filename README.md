# Security Insights Specification
[<img src="https://img.shields.io/badge/slack-@openssf/security%20insights-green.svg?logo=slack">](https://openssf.slack.com/messages/security_insights/)

<img align="right" src="docs/assets/security-insights-logo.png" alt="Security Insights Logo" width="200">

Security Insights provides a mechanism for projects to report information about their security in a machine-processable way. It is formatted as a YAML file to make it easy to read and edit by humans.

The data tracked within this specification is intended to fill the gaps between simplified solutions such as `SECURITY.md` and comprehensive automated solutions such as SBOMs. In that gap lay elements that must be self-reported by projects to allow end-users to make informed security decisions.

## What is Security Insights?

Security Insights is a standardized YAML format that enables open source projects to self-report their security practices, policies, and processes. This information helps:

- **Project maintainers** communicate their security posture clearly
- **Security researchers** understand how to report vulnerabilities
- **End users and organizations** evaluate the security of dependencies
- **Automated tools** parse and analyze security information consistently

## Quick Start

### For Consumers

Consumers of the `security-insights.yml` file(s) provided by projects should assume the contents is only relative to the commit or release artifact it is associated with.

The specification enables automated tooling to parse and analyze security information. Look for `security-insights.yml` in the root of repositories, or in the source forge directory (e.g. `.github/` or `.gitlab/`).

### For Project Maintainers

Projects adopting the specification in a single repository should be able to get started and produce a useful `security-insights.yml` in about 30 minutes.

**Getting Started:**
1. Review the [Schema Documentation](docs/schema.md) to understand available fields
2. Start with the [minimum example](https://github.com/ossf/security-insights-spec/blob/main/examples/example-minimum.yml)
3. Place your `security-insights.yml` file in the root of your repository or in your source forge directory (e.g. `.github/` or `.gitlab/`) to support automated detection
4. Validate your file using [`cue vet`](https://cuelang.org/docs/introduction/installation/) against the [CUE schema](https://github.com/ossf/security-insights-spec/blob/main/spec/schema.cue)

**Multi-Repository Projects:**

More complex projects will want to take advantage of the `header.project-si-source` value to allow for multiple repositories to reference a shared location for project data.

See the [multi-repository examples](https://github.com/ossf/security-insights-spec/tree/main/examples) for details.

**Ongoing Maintenance:**
As your project evolves, keep your `security-insights.yml` file up to date. Consider scheduling periodic reminders (every 1, 3, or 6 months) to ensure the information remains accurate.

## Documentation

- **[Schema Documentation](docs/schema.md)** - Complete reference for all fields in the specification
- **[Examples](https://github.com/ossf/security-insights-spec/tree/main/examples)** - Example files for different use cases:
  - [example-minimum.yml](https://github.com/ossf/security-insights-spec/blob/main/examples/example-minimum.yml) - Minimal required fields
  - [example-full.yml](https://github.com/ossf/security-insights-spec/blob/main/examples/example-full.yml) - All possible fields
  - [example-multi-repository-project.yml](https://github.com/ossf/security-insights-spec/blob/main/examples/example-multi-repository-project.yml) - Primary repository for multi-repo projects
  - [example-multi-repository-project-reuse.yml](https://github.com/ossf/security-insights-spec/blob/main/examples/example-multi-repository-project-reuse.yml) - Secondary repository example

## Releases

The Git repository typically remains unchanged from the latest release, but may diverge as incremental development takes place in preparation for an upcoming release. Any differences between the latest release and the main branch should be considered as non-authoritative previews of the next release.

You may download the official schema in the [latest release](https://github.com/ossf/security-insights-spec/releases/latest).

## Tooling Ecosystem

As the adoption of Security Insights grows, so does the opportunity to automatically ingest it:

- **[si-tooling](https://github.com/ossf/si-tooling)** - Community-maintained tools for reading, validating and manipulating Security Insights data
- **[CLOMonitor](https://clomonitor.io/)** - The Linux Foundation's tool that parses Security Insights files to determine whether projects have reported on select security factors
- **[LFX Insights](https://insights.lfx.linuxfoundation.org/)** - The Linux Foundation's tool that reads a project's Security Insights file to evaluate security hygiene against the OSPS Baseline assessment requirements
- **[OSPS Baseline Scanner](https://github.com/marketplace/actions/open-source-project-security-baseline-scanner)** - GitHub Action that runs OSPS Baseline assessments on individual repositories using the same scanner as LFX Insights

## Contributing

The specification is maintained by the [Security Insights maintainers](https://github.com/ossf/security-insights-spec/blob/main/docs/MAINTAINERS.md) according to the [governance documentation](https://github.com/ossf/security-insights-spec/blob/main/docs/GOVERNANCE.md).

Discussion and feedback should take place in [GitHub Issues](https://github.com/ossf/security-insights-spec/issues). We ask that you follow the [Security Insights Enhancement Proposal](https://github.com/ossf/security-insights-spec/blob/main/docs/GOVERNANCE.md#security-insights-enhancement-proposals) process to explore potential changes to the specification.

## Get Involved

- **Slack**: Join the [OpenSSF Security Insights channel](https://openssf.slack.com/messages/security_insights/)
- **GitHub**: Contribute at [ossf/security-insights-spec](https://github.com/ossf/security-insights-spec)
- **Email**: Subscribe to [openssf-sig-security-insights@lists.openssf.org](mailto:openssf-sig-security-insights+subscribe@lists.openssf.org)

