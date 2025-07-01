# `repository` _(v2.0.0)_

The `repository` object specifies repository-related configurations, including status, policies, team members, documentation, license, releases, and security posture.

This section is not required if the file is intended for use as a parent security insights file with project information to be inherited by multiple repositories via their respective `header.project-si-source`.

## Required vs Optional Fields

Required if `repository` is present:

- `status`
- `url`
- `accepts-change-request`
- `accepts-automated-change-request`
- `core-team`
- `license`
- `security`

Optional top-level fields:

- `documentation`
- `release`
- `bug-fixes-only` (assume false if not present)
- `no-third-party-packages` (assume false if not present)

---

## `repository.status`

- **Type**: `string`
- **Matches Pattern**: `^(active|abandoned|concept|inactive|moved|suspended|unsupported|WIP)$`
- **Description**: Indicates the repository’s current [Repo Status](https://repostatus.org). 

---

## `repository.accepts-change-request`

- **Type**: `bool`
- **Description**: Indicates whether the repository currently accepts any change requests.

---

## `repository.accepts-automated-change-request`

- **Type**: `bool`
- **Description**: Indicates whether the repository accepts automated or machine-generated change requests.

---

## `repository.bug-fixes-only`

- **Type**: `bool`
- **Description**: Specifies whether the repository only accepts bug-fixes and not feature work.

---

## `repository.no-third-party-packages`

- **Type**: `bool`
- **Description**: Indicates whether the repository universally avoids package dependencies from outside of the project.

---

## `repository.url`

- **Type**: [URL]
- **Description**: The main URL for this repository.

---

## `repository.core-team`

- **Type**: `slice` of [Contact]
- **Description**: A list of 1 or more core team members for this repository, such as maintainers or approvers.

---

## `repository.license`

- **Type**: [License]
- **Description**: The license information for this repository.

---

## `repository.security`

An object describing security-related artifacts, champions, and tooling for the repository.

### `repository.security.assessments`

An object describing security assessments for the repository.

- `repository.security.assessments.self`
  - **Type**: [Assessment]
  - **Description**: Results of the contributor team's assessment of software produced by this repository.
- `repository.security.assessments.third-party` (optional)
  - **Type**: `slice` of [Assessment]
  - **Description**: Results of third-party assessments of software produced by this repository.

### `repository.security.champions` (optional)

- **Type**: `slice` of [Contact]
- **Description**: A list of core team members who advocate for continuous improvement of security practices. These individuals may take responsibility for security reviews, training, interfacing with stakeholders on security topics, or other similar activities.

### `repository.security.tools`

A list of objects describing security-related tools used in the repository.

- `tools[].name`
  - **Type**: `string`
  - **Description**: The name of the tool.
- `tools[].type`
  - **Type**: `string`
  - **Matches Pattern**: `^(fuzzing|container|secret|SCA|SAST|other)$`
  - **Description**: The general category or type of the tool.
- `tools[].version` (optional)
  - **Type**: `string`
  - **Description**: The version of the tool that is used.
- `tools[].comment` (optional)
  - **Type**: `string`
  - **Description**: Additional notes about the tool’s usage or configuration.
- `tools[].rulesets`
  - **Type**: `slice` of `string`
  - **Description**: The set of rules or configurations applied by the tool. If customization is not enabled, the only value here should be "default".
- `tools[].integration`
  - `integration.adhoc`
    - **Type**: `bool`
    - **Description**: Indicates whether the tool is used in a scheduled process or supports an on-demand.
  - `integration.ci`
    - **Type**: `bool`
    - **Description**: Indicates whether the tool is used in the continuous integration process.
  - `integration.release`
    - **Type**: `bool`
    - **Description**: Indicates whether the tool is run before or during the release process.
- `tools[].results`
  - `results.adhoc` (optional)
    - **Type**: [Attestation]
    - **Description**: Results of scheduled or on-demand security scans.
  - `results.ci` (optional)
    - **Type**: [Attestation]
    - **Description**: Results of security scans run in the continuous integration process.
  - `results.release` (optional)
    - **Type**: [Attestation]
    - **Description**: Results of security scans run in the build and release process.

---

## `repository.documentation` (optional)

An object referencing documentation URLs.

- **`documentation.contributing-guide`** (optional)  
  - **Type**: [URL]
  - **Description**: The URL to a guide for proper contributions.

- **`documentation.dependency-management-policy`** (optional)  
  - **Type**: [URL]
  - **Description**: The URL to information about how dependencies are managed in this repository.

- **`documentation.governance`** (optional)  
  - **Type**: [URL]
  - **Description**: The URL to any governance documents regarding roles, responsibilities, processes, and decision-making.

- **`documentation.review-policy`** (optional)  
  - **Type**: [URL]
  - **Description**: The URL to a guide for proper change reviews.

- **`documentation.security-policy`** (optional)  
  - **Type**: [URL]
  - **Description**: The URL with information about the repository's security, including the policy for reporting security vulnerabilities.

---

## `repository.release` (optional)

An object describing release-related details for this repository.

### `release.automated-pipeline`

- **Type**: `bool`
- **Description**: Indicates if the repository uses an automated release pipeline.

### `release.distribution-points`

- **Type**: `slice` of [Link]
- **Description**: A list of 1 or more links describing where the repository’s releases are distributed. This may be the VCS releases page, a package manager, or other distribution points.

### `release.changelog` (optional)

- **Type**: [URL]
- **Description**: A URL to the repository’s release changelog. The URL value should include placeholders such as `{version}` if relevant.

### `release.license` (optional)

- **Type**: [License]
- **Description**: An object describing the license details specifically for releases. This should be used when the release license differs from the repository license.

### `release.attestations` (optional)

- **Type**: `slice` of [Attestation]
- **Description**: A list of attestations for the repository’s releases.

---

[Assessment]: ./aliases.md#assessment
[Attestation]: ./aliases.md#attestation
[Contact]: ./aliases.md#contact
[License]: ./aliases.md#license
[Link]: ./aliases.md#link
[URL]: ./aliases.md#url
