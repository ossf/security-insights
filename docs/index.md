---
layout: default
title: Home
nav-title: About
---

# Security Insights Specification

<img align="right" src="/assets/security-insights-logo.png" alt="Security Insights Logo" width="200">

Security Insights provides a mechanism for projects to report information about their security in a machine-processable way. It is formatted as a YAML file to make it easy to read and edit by humans.

The data tracked within this specification is intended to fill the gaps between simplified solutions such as `SECURITY.md` and comprehensive automated solutions such as SBOMs. In that gap lay elements that must be self-reported by projects to allow end-users to make informed security decisions.

## Quick Start

### For Project Maintainers

Projects adopting the specification in a single project repository should be able to get started and produce a useful `security-insights.yml` in about 30 minutes by consulting the [example-minimum.yml](https://github.com/ossf/security-insights-spec/blob/main/examples/example-minimum.yml).

**Getting Started:**
1. Review the [Schema Documentation]({{ '/schema/' | relative_url }}) to understand available fields
2. Start with the [minimum example](https://github.com/ossf/security-insights-spec/blob/main/examples/example-minimum.yml)
3. Place your `security-insights.yml` file in the root of your repository or in `.github/` or `.gitlab/`
4. Validate your file using the [CUE schema](https://github.com/ossf/security-insights-spec/blob/main/spec/schema.cue)

**Multi-Repository Projects:**
If your project has multiple repositories, you can define a detailed and centralized insights file in one repository and reuse the `project` definition across other files. See the [multi-repository examples](https://github.com/ossf/security-insights-spec/tree/main/examples) for details.

### For Project Consumers

Consumers of the `security-insights.yml` file(s) provided by projects should assume the contents will be updated any time the relevant information changes. The specification enables automated tooling to parse and analyze security information.

## Documentation

- **[Schema Documentation]({{ '/schema/' | relative_url }})** - Complete reference for all fields in the specification
- **[Examples](https://github.com/ossf/security-insights-spec/tree/main/examples)** - Example files for different use cases:
  - [example-minimum.yml](https://github.com/ossf/security-insights-spec/blob/main/examples/example-minimum.yml) - Minimal required fields
  - [example-full.yml](https://github.com/ossf/security-insights-spec/blob/main/examples/example-full.yml) - All possible fields
  - [example-multi-repository-project.yml](https://github.com/ossf/security-insights-spec/blob/main/examples/example-multi-repository-project.yml) - Primary repository for multi-repo projects
  - [example-multi-repository-project-reuse.yml](https://github.com/ossf/security-insights-spec/blob/main/examples/example-multi-repository-project-reuse.yml) - Secondary repository example

## Releases

This repository often remains unchanged from the latest release, but may diverge as incremental development takes place in preparation for an upcoming release. Any differences between the latest release and the main branch should only be considered previews of the next release.

To ensure you are adhering to an official version of the specification, please refer to the `schema.cue` and `Security-Insights-{version}.pdf` in the [latest release](https://github.com/ossf/security-insights-spec/releases/latest).

## Tooling Ecosystem

As the adoption of Security Insights grows, so does the opportunity to automatically ingest it:

- **[CLOMonitor](https://clomonitor.io/)** - The Linux Foundation's tool that parses Security Insights files to determine whether projects have reported on select security factors
- **[LFX Insights](https://insights.lfx.linuxfoundation.org/)** - The Linux Foundation's tool that reads a project's Security Insights file to evaluate security hygiene against the OSPS Baseline assessment requirements
- **[si-tooling](https://github.com/ossf/si-tooling)** - Community-maintained tools for reading, validating and manipulating Security Insights data

## Maintenance

The specification is maintained by the [Security Insights maintainers](https://github.com/ossf/security-insights-spec/blob/main/docs/MAINTAINERS.md) according to the [governance documentation](https://github.com/ossf/security-insights-spec/blob/main/docs/GOVERNANCE.md).

Discussion and feedback should take place in [GitHub Issues](https://github.com/ossf/security-insights-spec/issues). We ask that you follow the [Security Insights Enhancement Proposal](https://github.com/ossf/security-insights-spec/blob/main/docs/GOVERNANCE.md#security-insights-enhancement-proposals) process to explore potential changes to the specification.

## Get Involved

- **Slack**: Join the [OpenSSF Security Insights channel](https://openssf.slack.com/messages/security_insights/)
- **GitHub**: Contribute at [ossf/security-insights-spec](https://github.com/ossf/security-insights-spec)
- **Email**: Subscribe to [openssf-sig-security-insights@lists.openssf.org](mailto:openssf-sig-security-insights+subscribe@lists.openssf.org)

