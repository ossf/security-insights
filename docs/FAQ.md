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

Security Insights is a standardized YAML format that enables open source projects to self-report their security practices, policies, and processes. It provides a mechanism for projects to report information about their security in a machine-processable way, formatted as a YAML file to make it easy to read and edit by humans.

This information helps:
- **Project maintainers** communicate their security posture clearly
- **Security researchers** understand how to report vulnerabilities
- **End users and organizations** evaluate the security of dependencies
- **Automated tools** parse and analyze security information consistently

The data tracked within this specification is intended to fill the gaps between simplified solutions such as `SECURITY.md` and comprehensive automated solutions such as SBOMs. In that gap lay elements that must be self-reported by projects to allow end-users to make informed security decisions.

---

### Why does this specification exist?

Security is important, and many potential users (final users, engineers, developers, or companies) might want to evaluate the security of a particular open-source project. There are many ways to evaluate the security of a project, including evaluating the code itself (statically or dynamically), the processes used, and/or the people involved (e.g., whether or not they know how to develop secure software).

Some information can be determined automatically by tools, but determining information via tools is often imperfect. For example, many would want to know if a project uses an automated test suite, yet because there are so many different kinds of test suites & ways to invoke them, automated tools often fail to correctly identify whether or not automated tests are performed. It can be provided manually, but that must be done for each approach.

This specification provides a mechanism for projects to report information about their security in a machine-processable way. It is formatted as a YAML file to make it easy to read and edit directly by people. It is expected that a first draft of the file would be created by automated tools, "wizards" that guide users through the answers, and linter tools that help users to check the YAML file schema. The file is then put under version control, provided to potential users, and updated as needed. The file's contents may then be extracted for a variety of different reasons (e.g., extracted into security evaluations, etc.).

### What problems does Security Insights solve?

**SECURITY-INSIGHTS.yml** helps solve the following user stories:

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

Projects adopting the specification in a single repository should be able to get started and produce a useful `security-insights.yml` in about 30 minutes.

**Getting Started:**
1. Review the [Schema Documentation](schema.md) to understand available fields
2. Start with the [minimum example](https://github.com/ossf/security-insights/blob/main/examples/example-minimum.yml)
3. Place your `security-insights.yml` file in the root of your repository or in your source forge directory (e.g. `.github/` or `.gitlab/`) to support automated detection
4. Validate your file using [`cue vet`](https://cuelang.org/docs/introduction/installation/) against the [CUE schema](https://github.com/ossf/security-insights/blob/main/schema.cue)

### Where should I place the security-insights.yml file?

Place your `security-insights.yml` file in the root of your repository or in your source forge directory (e.g. `.github/` or `.gitlab/`) to support automated detection. Consumers of the `security-insights.yml` file(s) should look for it in these locations.

### How do I validate my security-insights.yml file?

Validate your file using [`cue vet`](https://cuelang.org/docs/introduction/installation/) against the [CUE schema](https://github.com/ossf/security-insights/blob/main/schema.cue). You can also use linter tools that help users to check the YAML file schema.

### How do I use the Security Insights CUE module in my project?

The Security Insights schema is available as a CUE module that can be imported and used in your own CUE projects for validation and type checking.

**To use the module:**

1. Initialize a CUE module in your project (if not already done):
   ```bash
   cue mod init github.com/your-org/your-project
   ```

2. Add the Security Insights module as a dependency:
   ```bash
   cue mod get github.com/ossf/security-insights@v2.2.0
   ```

3. Import and use the schema in your CUE files:
   ```cue
   import "github.com/ossf/security-insights"

   // Validate your security insights data
   data: #SecurityInsights
   ```

**Example validation:**

Create a `validate.cue` file:
```cue
package main

import "github.com/ossf/security-insights"

data: #SecurityInsights
```

Then validate your YAML file:
```bash
cue vet validate.cue security-insights.yml
```

The module is published to the CUE registry at `registry.cue.works/github.com/ossf/security-insights`. You can use any published version by specifying it in the import path (e.g., `@v2.2.0` for a specific version or `@latest` for the latest version).

### What's the minimum required information?

The minimum viable product (MVP) should provide the following information:
- Procedure to report a vulnerability (security contact, Vulnerability Disclosure Policy (VDP))
- Owners contacts

See the [minimum example](https://github.com/ossf/security-insights/blob/main/examples/example-minimum.yml) for a complete reference.

## Trust and Reliability

### How much can tools trust this file?

That is an issue ultimately decided by the tools that read this data. The format records assertions made by a project itself. These assertions may be obsolete or even maliciously false. Still, it provides additional information that otherwise would not be automatically accessible. Humans and tools that evaluate projects may want to report results both including and not including self-assertions, or assertions unverified by a trusted third party.

### What if the information is outdated or incorrect?

Consumers of the `security-insights.yml` file(s) provided by projects should assume the contents is only relative to the commit or release artifact it is associated with. As your project evolves, keep your `security-insights.yml` file up to date. Consider scheduling periodic reminders (every 1, 3, or 6 months) to ensure the information remains accurate.

## Versioning and Releases

### How is the specification versioned?

The Security Insights Specification uses a semantic versioning (SemVer) scheme to indicate changes. The version number format is as follows:

**Major.Minor.Patch**

- **Major**: Incremented for significant changes. Ideally at most one per year.
- **Minor**: Incremented for important changes and improvements. Ideally, at most four per year.
- **Patch**: Incremented for minor changes, and typo fixes.

### How often are new versions released?

- **Major releases** (e.g., from `1.X.X` to `2.X.X`) signify significant changes that may require a substantial update to the Security Insights specification. Major releases may include major and important changes to the SECURITY INSIGHTS schema, or significant policy or procedure modifications.

- **Minor releases** (e.g., from `1.1.X` to `1.2.X`) introduce changes and improvements that need to be properly released. Minor releases may include improvements, changes, or minor milestones to the SECURITY INSIGHTS schema.

- **Patch releases** (e.g., from `1.1.0` to `1.1.1`) include minor fixes, typo corrections, or updates that do not introduce substantial changes. Patch releases may include typo corrections or language improvements.

Whenever a new version of the specification is released, a new version of the ossf/si-tooling project should also be released.

### Where can I find the latest release?

The Git repository typically remains unchanged from the latest release, but may diverge as incremental development takes place in preparation for an upcoming release. Any differences between the latest release and the main branch should be considered as non-authoritative previews of the next release.

You may download the official schema in the [latest release](https://github.com/ossf/security-insights/releases/latest). All releases can be monitored via GitHub Release. Major and minor releases may be communicated through OpenSSF communication channels.

A changelog is maintained, detailing all changes made in each release (major, minor, or patch). The changelog includes a proper tag, a summary of changes for each version, and references to pull requests, issues, or discussions related to the changes.

## Usage Questions

### How do I handle multi-repository projects?

More complex projects will want to take advantage of the `header.project-si-source` value to allow for multiple repositories to reference a shared location for project data.

See the [multi-repository examples](https://github.com/ossf/security-insights/tree/main/examples) for details:
- [example-multi-repository-project.yml](https://github.com/ossf/security-insights/blob/main/examples/example-multi-repository-project.yml) - Primary repository for multi-repo projects
- [example-multi-repository-project-reuse.yml](https://github.com/ossf/security-insights/blob/main/examples/example-multi-repository-project-reuse.yml) - Secondary repository example

### How often should I update my security-insights.yml file?

As your project evolves, keep your `security-insights.yml` file up to date. Consider scheduling periodic reminders (every 1, 3, or 6 months) to ensure the information remains accurate.

### What tools support Security Insights?

As the adoption of Security Insights grows, so does the opportunity to automatically ingest it:

- **[si-tooling](https://github.com/ossf/si-tooling)** - Community-maintained tools for reading, validating and manipulating Security Insights data
- **[CLOMonitor](https://clomonitor.io/)** - The Linux Foundation's tool that parses Security Insights files to determine whether projects have reported on select security factors
- **[LFX Insights](https://insights.lfx.linuxfoundation.org/)** - The Linux Foundation's tool that reads a project's Security Insights file to evaluate security hygiene against the OSPS Baseline assessment requirements
- **[OSPS Baseline Scanner](https://github.com/marketplace/actions/open-source-project-security-baseline-scanner)** - GitHub Action that runs OSPS Baseline assessments on individual repositories using the same scanner as LFX Insights

## Contributing

### How can I contribute to the specification?

The specification is maintained by the [Security Insights maintainers](MAINTAINERS.md) according to the [governance documentation](GOVERNANCE.md).

Discussion and feedback should take place in [GitHub Issues](https://github.com/ossf/security-insights/issues).

**Get Involved:**
- **Slack**: Join the [OpenSSF Security Insights channel](https://openssf.slack.com/messages/security_insights/)
- **GitHub**: Contribute at [ossf/security-insights](https://github.com/ossf/security-insights)
- **Email**: Subscribe to [openssf-sig-security-insights@lists.openssf.org](mailto:openssf-sig-security-insights+subscribe@lists.openssf.org)

### How are changes to the specification proposed?

We ask that you follow the [Security Insights Enhancement Proposal](GOVERNANCE.md#security-insights-enhancement-proposals) process to explore potential changes to the specification.

For major releases, the procedure includes:
- Discuss and propose the changes through open-source project communication channels (GitHub repo [ossf/security-insights](https://github.com/ossf/security-insights), OpenSSF Slack channels [#wg_metrics_and_metadata](https://openssf.slack.com/archives/C01A50B978T) and [#security_insights](https://openssf.slack.com/archives/C04BB493NET))
- Conduct a review and discussion among community, and OpenSSF working groups
- Update the project with proposed changes, and update the changelog
- Release the updates through GitHub Release

Feedback and suggestions for improvements to the policy are encouraged and can be submitted through the project's communication channels.

