---
layout: default
title: FAQ
nav-title: FAQ
---

# Frequently Asked Questions (FAQ)

* required preceding note
{:toc}

---

## Overview

### What is Security Insights?

Security Insights is a single YAML file, `security-insights.yml`, where a project reports its security practices in a standard, machine-readable format.

This information helps:
- **Project maintainers** — communicate your security posture clearly
- **Security researchers** — learn how to report vulnerabilities
- **End users and organizations** — evaluate the security of dependencies
- **Automated tools** — parse security information consistently

### How is this different from SECURITY.md or an SBOM?

`SECURITY.md` is free-form text written for humans. An SBOM is a machine-readable list of everything inside your software. Security Insights fills the gap between them: structured facts about your security practices that only maintainers can report.

### Why does this specification exist?

Tools can guess some things about a project's security, but they often guess wrong. For example, tools frequently fail to detect whether a project runs automated tests. Security Insights lets the project state such facts directly, in a format both people and tools can read.

### What problems does Security Insights solve?

`security-insights.yml` answers questions like:

- Which security tools and processes does this project use?
- Where do I find trusted sources and releases for this project?
- Is the project actively maintained? When does it reach end of life?
- How do I contact the maintainers or report a vulnerability?

## Getting Started

### How do I get started as a project maintainer?

Start small — the minimum file needs little more than a security contact and the project owners. Most single-repository projects produce a useful file in about 30 minutes.

Follow the [Get Started guide](get-started.md). It walks through both single-repo and multi-repo setups.

### Where should I place the security-insights.yml file?

Place it at the repository root as `security-insights.yml`, or in your code host's config directory (`.github/` or `.gitlab/`). Tools look in these locations automatically.

### How do I validate my security-insights.yml file?

Use [CUE](https://cuelang.org/docs/introduction/installation/), the tool that powers this spec's schema:

```sh
curl -LO https://raw.githubusercontent.com/ossf/security-insights/main/spec/schema.cue
cue vet -d '#SecurityInsights' schema.cue .github/security-insights.yml
```

No output means your file is valid.

### What's the minimum required information?

At minimum, a file identifies:
- How to report a vulnerability
- Who owns and maintains the project
- Basic repository facts (URL, status, license)

See the [minimum example](https://github.com/ossf/security-insights/blob/main/examples/example-minimum.yml) for the complete smallest valid file.

## Trust and Reliability

### How much can tools trust this file?

The file contains a project's own claims, so treat it as self-reported. It may be out of date or even wrong. It still adds useful information a tool could not get any other way. Tools may choose to show results with and without unverified claims.

### What if the information is outdated or incorrect?

The file describes the commit or release it ships with, not necessarily the project's current state. Maintainers should [update it regularly](#how-often-should-i-update-my-security-insightsyml-file).

## Versioning and Releases

### How is the specification versioned?

The specification uses semantic versioning: **Major.Minor.Patch**.

- **Major** — significant changes; ideally at most one per year
- **Minor** — improvements; ideally at most four per year
- **Patch** — small fixes and typo corrections

See the [versioning policy](versioning-policy.md) for details.

### Where can I find the latest release?

Download the official schema from the [latest release](https://github.com/ossf/security-insights/releases/latest). The `main` branch may preview unreleased changes.

## Usage Questions

### How do I handle multi-repository projects?

Projects with many repositories can keep shared project data in one file. Each repository's own file then points to it using the `header.project-si-source` field.

See the multi-repository examples:
- [example-multi-repository-project.yml](https://github.com/ossf/security-insights/blob/main/examples/example-multi-repository-project.yml) - Primary repository for multi-repo projects
- [example-multi-repository-project-reuse.yml](https://github.com/ossf/security-insights/blob/main/examples/example-multi-repository-project-reuse.yml) - Secondary repository example

### How often should I update my security-insights.yml file?

Keep the file up to date as your project evolves. A periodic reminder (every 3 or 6 months) helps.

### What tools support Security Insights?

- **[si-tooling](https://github.com/ossf/si-tooling)** - Community-maintained tools for reading, validating and manipulating Security Insights data
- **[CLOMonitor](https://clomonitor.io/)** - The Linux Foundation's tool that parses Security Insights files to determine whether projects have reported on select security factors
- **[LFX Insights](https://insights.lfx.linuxfoundation.org/)** - The Linux Foundation's tool that evaluates security hygiene against the OSPS Baseline (a set of minimum security requirements for open source projects)
- **[OSPS Baseline Scanner](https://github.com/marketplace/actions/open-source-project-security-baseline-scanner)** - GitHub Action that runs OSPS Baseline assessments using the same scanner as LFX Insights

## Contributing

### How can I contribute to the specification?

The specification is maintained by the [Security Insights maintainers](MAINTAINERS.md) according to the [governance documentation](GOVERNANCE.md).

**Get Involved:**
- **GitHub**: Open or join a discussion in [GitHub Issues](https://github.com/ossf/security-insights/issues)
- **Slack**: Join the [OpenSSF Security Insights channel](https://openssf.slack.com/messages/security_insights/)
- **Email**: Subscribe to [openssf-sig-security-insights@lists.openssf.org](mailto:openssf-sig-security-insights+subscribe@lists.openssf.org)

### How are changes to the specification proposed?

Schema changes start as a Security Insights Enhancement Proposal (SIEP). To file one, [open a new issue](https://github.com/ossf/security-insights/issues/new/choose) and pick the SIEP template. See the [governance documentation](GOVERNANCE.md#security-insights-enhancement-proposals) for how proposals are discussed and accepted.
