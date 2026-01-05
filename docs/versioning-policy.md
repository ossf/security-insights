# Security Insights Specification Versioning Policy

## 1. Introduction

The versioning policy for the Security Insights Specification should provide guidelines for releasing new versions of the Security Insights YAML schema. This policy ensures that changes are documented, tracked, and communicated to the community and stakeholders.

## 2. Versioning Scheme

The Security Insights Specification uses a semantic versioning (SemVer) scheme to indicate changes. The version number format is as follows:

**Major.Minor.Patch**

**Major**: Incremented for significant changes. Ideally at most one per year.
**Minor**: Incremented for important changes and improvements. Ideally, at most four per year.
**Patch**: Incremented for minor changes, and typo fixes.

## 3. Version Release Process

Whenever a new version of the specification is released, a new version of the ossf/si-tooling project should also be released.

### 3.1. Major Releases

A major release (e.g., from `1.X.X` to `2.X.X`) signifies significant changes that may require a substantial update to the Security Insights specification. Major releases may include:

- Major and important changes to the SECURITY INSIGHTS schema;
- Significant policy or procedure modifications.

### 3.2. Minor Releases

A minor release (e.g., from `1.1.X` to `1.2.X`) introduces changes and improvements that need to be properly released. Minor releases may include:

- Improvements, changes, or minor milestones to the SECURITY INSIGHTS schema.

### 3.3. Patch Releases

A patch release (e.g., from `1.1.0` to `1.1.1`) includes minor fixes, typo corrections, or updates that do not introduce substantial changes. Patch releases may include:

- Typo corrections or language improvements.

### 3.4 Procedure for Major Releases:

- Discuss and propose the changes through open-source project communication channels (GitHub repo [ossf/security-insights](https://github.com/ossf/security-insights), OpenSSF Slack channels [#wg_metrics_and_metadata](https://openssf.slack.com/archives/C01A50B978T) and [#security_insights](https://openssf.slack.com/archives/C04BB493NET)).
- Conduct a review and discussion among community, and OpenSSF working groups.
- Update the project with proposed changes, and update the changelog.
- Release the updates through GitHub Release.

## 4. Changelog

A changelog will be maintained, detailing all changes made in each release (major, minor, or patch). The changelog should include:

- A proper tag;
- A summary of changes for each version (major, minor, or patch);
- References to pull requests, issues, or discussions related to the changes.

## 5. Communication

All the releases can be monitored via GitHub Release. Major and minor releases may be communicated through OpenSSF communication channels.

## 6. Review and Adoption

Feedback and suggestions for improvements to the policy are encouraged and can be submitted through the project's communication channels.
