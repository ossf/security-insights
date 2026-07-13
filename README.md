# Security Insights Specification
[<img src="https://img.shields.io/badge/slack-@openssf/security%20insights-green.svg?logo=slack">](https://openssf.slack.com/messages/security_insights/)

<img align="right" src="docs/assets/security-insights-logo.png" alt="Security Insights Logo" width="200">

Security Insights is a single YAML file where a project reports its security practices in a standard, machine-readable format.

It fills the gap between a plain-text `SECURITY.md` and an SBOM (a machine-readable list of everything inside your software). Some security facts can only be reported by maintainers themselves. This file is where they go.

## Who is it for?

- **Project maintainers** — communicate your security posture clearly
- **Security researchers** — learn how to report vulnerabilities
- **End users and organizations** — evaluate the security of dependencies
- **Automated tools** — parse security information consistently

## Quick Start

### For Project Maintainers

Most single-repository projects can produce a useful `security-insights.yml` in about 30 minutes.

1. Copy the [minimum example](https://github.com/ossf/security-insights/blob/main/examples/example-minimum.yml) into your repository. The recommended location is `.github/security-insights.yml`. The repository root and `.gitlab/` also work.
2. Edit the values to match your project. The [Schema Documentation](docs/schema.md) explains every field.
3. Validate your file with [CUE](https://cuelang.org/docs/introduction/installation/), the tool that powers this spec's schema:

   ```sh
   curl -LO https://raw.githubusercontent.com/ossf/security-insights/main/spec/schema.cue
   cue vet -d '#SecurityInsights' schema.cue .github/security-insights.yml
   ```

   No output means your file is valid.

**Multi-Repository Projects:**

Projects with many repositories can keep shared project data in one file. Each repository's own file then points to it using the `header.project-si-source` field. See the [multi-repository examples](https://github.com/ossf/security-insights/tree/main/examples) for details.

**Ongoing Maintenance:**

Keep your `security-insights.yml` up to date as your project evolves. A periodic reminder (every 3 or 6 months) helps.

### For Consumers

Tools and researchers can read these files automatically. Look for `security-insights.yml` in a repository's root, `.github/`, or `.gitlab/` directory.

Treat the contents as a snapshot. It describes the commit or release it ships with, not necessarily the project's current state.

## Documentation

- **[Schema Documentation](docs/schema.md)** - Complete reference for all fields in the specification
- **[Examples](https://github.com/ossf/security-insights/tree/main/examples)** - Example files for different use cases:
  - [example-minimum.yml](https://github.com/ossf/security-insights/blob/main/examples/example-minimum.yml) - Minimal required fields
  - [example-full.yml](https://github.com/ossf/security-insights/blob/main/examples/example-full.yml) - All possible fields
  - [example-multi-repository-project.yml](https://github.com/ossf/security-insights/blob/main/examples/example-multi-repository-project.yml) - Primary repository for multi-repo projects
  - [example-multi-repository-project-reuse.yml](https://github.com/ossf/security-insights/blob/main/examples/example-multi-repository-project-reuse.yml) - Secondary repository example

## Releases

Download the official schema from the [latest release](https://github.com/ossf/security-insights/releases/latest).

The `main` branch may be slightly ahead of the latest release. Treat any differences as a preview of the next release, not as final.

## Tooling Ecosystem

As the adoption of Security Insights grows, so does the opportunity to automatically ingest it:

- **[si-tooling](https://github.com/ossf/si-tooling)** - Community-maintained tools for reading, validating and manipulating Security Insights data
- **[CLOMonitor](https://clomonitor.io/)** - The Linux Foundation's tool that parses Security Insights files to determine whether projects have reported on select security factors
- **[LFX Insights](https://insights.lfx.linuxfoundation.org/)** - The Linux Foundation's tool that reads a project's Security Insights file to evaluate security hygiene against the OSPS Baseline (a set of minimum security requirements for open source projects)
- **[OSPS Baseline Scanner](https://github.com/marketplace/actions/open-source-project-security-baseline-scanner)** - GitHub Action that runs OSPS Baseline assessments on individual repositories using the same scanner as LFX Insights

## Contributing

The specification is maintained by the [Security Insights maintainers](https://github.com/ossf/security-insights/blob/main/docs/MAINTAINERS.md) according to the [governance documentation](https://github.com/ossf/security-insights/blob/main/docs/GOVERNANCE.md).

Discussion and feedback should take place in [GitHub Issues](https://github.com/ossf/security-insights/issues). We ask that you follow the [Security Insights Enhancement Proposal](https://github.com/ossf/security-insights/blob/main/docs/GOVERNANCE.md#security-insights-enhancement-proposals) process to explore potential changes to the specification.

## Get Involved

- **Slack**: Join the [OpenSSF Security Insights channel](https://openssf.slack.com/messages/security_insights/)
- **GitHub**: Contribute at [ossf/security-insights](https://github.com/ossf/security-insights)

