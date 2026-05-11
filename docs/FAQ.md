---
layout: default
title: FAQ
nav-title: FAQ
---

# Frequently Asked Questions (FAQ)

* required preceding note
{:toc}

---

## What is Security Insights?

Security Insights is a standardized YAML format that lets open source projects self-report their security practices, policies, and processes. It fills the gap between simplified solutions like `SECURITY.md` and comprehensive automated solutions like SBOMs — recording elements that must be self-asserted by the project itself.

It's intended to be useful for:

- **Project maintainers** communicating their security posture clearly
- **Security researchers** finding how to report vulnerabilities
- **End users and organizations** evaluating the security of dependencies
- **Automated tools** parsing and analyzing security information consistently

### What problems does Security Insights solve?

| AS A/AN | I WANT TO | SO THAT |
|---|---|---|
| user | know which tools are used to lint or scan the code, and which are the security processes in place | I can evaluate the security best practices followed by the project |
| user | know what are the trusted sources for this project | I can read, download or install only trusted code |
| user | know project status, release cycle time, security maintenance, and project end of life | I can schedule ordinary and extraordinary maintenance |
| user | contact the project maintainers | I can get answers or report issues |
| user | read a security policy | I can easily know security practices in place |
| maintainer | know which free tools (better open-source) I can use to lint or scan the code and the dependencies | I can reduce risks related to supply-chain attacks or human errors |
| maintainer | receive reports related only to certain types of vulnerabilities | I can work on more urgent features and fixes instead of reading out-of-scope reports |
| security researcher | report a potential vulnerability | the project's maintainers may be aware of it |
| developer of a security tool | have a standard machine-readable file containing security information about the project | I can scan it to reduce false-positive results |

## Getting Started

### How do I get started as a project maintainer?

See the [Get Started guide](get-started.md). It walks through both the single-repository and multi-repository layouts, with copyable examples and the validation command.

### Where should I place the security-insights.yml file?

At the repository root (`security-insights.yml`) or in the source-forge directory (`.github/security-insights.yml`, `.gitlab/security-insights.yml`, etc.). Tools that consume the file look in these locations.

### What's the minimum required information?

At minimum, the file should let a reader contact a maintainer, find the vulnerability disclosure policy, and identify the repository's basic posture. The [minimum example](https://github.com/ossf/security-insights/blob/main/examples/example-minimum.yml) is the canonical starting point — every field it shows is a reasonable default to fill in or drop.

### How do I handle multi-repository projects?

Publish a *parent* file containing the `project:` section in one repository, and a *child* file in each of the other repositories that sets `header.project-si-source` to the raw URL of the parent. Children inherit project-level data from the parent and only need to describe their own repository.

The [multi-repository path in the Get Started guide](get-started.md#multi-repository-path) covers the mechanics — including the raw-URL requirement that catches most first-time setups — and points at the parent and child example files.

## Trust and Maintenance

### How much can tools trust this file?

The format records assertions made by the project itself. These assertions may be obsolete or even maliciously false. Tools that consume the file should treat it as additional context that wouldn't otherwise be available, and may want to report results both with and without unverified self-assertions.

### How do I keep my file accurate over time?

Treat each file as describing your project at the commit or release artifact it ships with, and update it as your project evolves. A quick review every 1–6 months is enough for most projects; bump `header.last-updated` and `header.last-reviewed` whenever you make changes.

## Versioning

### How is the specification versioned?

The specification follows [Semantic Versioning](https://semver.org/). See the [Versioning Policy](versioning-policy.md) for the release cadence, the criteria distinguishing major, minor, and patch releases, and the procedure for proposing changes.

## Tooling and Contributing

### What tools support Security Insights?

See the [Tooling Ecosystem](index.md#tooling-ecosystem) on the home page.

### How can I contribute to the specification?

The spec is maintained by the [Security Insights maintainers](MAINTAINERS.md) per the [governance documentation](GOVERNANCE.md). Discussion happens in [GitHub Issues](https://github.com/ossf/security-insights/issues), on the OpenSSF Slack [#security_insights](https://openssf.slack.com/messages/security_insights/) channel, and on the [mailing list](mailto:openssf-sig-security-insights+subscribe@lists.openssf.org).

To propose a change to the specification, follow the [Security Insights Enhancement Proposal](GOVERNANCE.md#security-insights-enhancement-proposals) process.
