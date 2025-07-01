# `project` _(v2.0.0)_

The `project` object describes the overall project, including basic info, documentation links, repositories, vulnerability reporting, and security details.

This field is not required if `header.project-si-source` is supplied.

## Required vs Optional Fields

Required if `project` is present:

- `name`
- `administrators`
- `repositories`
- `vulnerability-reporting`

Optional:

- `homepage`
- `funding`
- `roadmap`
- `documentation`
- `steward`

---

## `project.name`

- **Type**: `string`
- **Description**: The name of the project.

---

## `project.administrators`

- **Type**: `slice` of [Contact]
- **Description**: A list of 1 or more individuals who have administrative access to the project's resources.

---

## `project.repositories`

A list of 1 or more repositories that are part of this project, including the repository this file is published in.

- `repositories[].name`
  - **Type**: `string`
  - **Description**: The name or short label of the repository.
- `repositories[].comment`
  - **Type**: `string`
  - **Description**: Explanation of the repository purpose or contents and its relation to the rest of the project.
- `repositories[].url`
  - **Type**: [URL]
  - **Description**: The URL where the repository is hosted.

---

## `project.vulnerability-reporting`

An object describing how security vulnerabilities can be reported and how they are handled by the project.

### `vulnerability-reporting.reports-accepted`

- **Type**: `bool`
- **Description**: Indicates whether this project currently accepts vulnerability reports.

### `vulnerability-reporting.bug-bounty-available`

- **Type**: `bool`
- **Description**: Specifies whether a bug bounty program is offered.

### `vulnerability-reporting.bug-bounty-program` (optional)

- **Type**: [URL]
- **Description**: Path to a page providing details about any bug bounty program.

### `vulnerability-reporting.contact` (optional)

- **Type**: [Contact]
- **Description**: Point of contact for reporting vulnerabilities. This may be a single person or a mailgroup.

### `vulnerability-reporting.comment` (optional)

- **Type**: `string`
- **Description**: Additional comments or instructions about vulnerability reporting.

### `vulnerability-reporting.in-scope` (optional)

- **Type**: `slice` of `strings`
- **Description**: A list of issues or components that are covered by the vulnerability reporting process.

### `vulnerability-reporting.out-of-scope` (optional)

- **Type**: `slice` of `strings`
- **Description**: A list of issues or components not covered by the vulnerability reporting process.

### `vulnerability-reporting.pgp-key` (optional)

- **Type**: `string`
- **Description**: The PGP public key for secure communication.

### `vulnerability-reporting.security-policy` (optional)

- **Type**: [URL]
- **Description**: Path to a page containing guidelines for security-related disclosures.

---

## `project.documentation` (optional)

An object containing references to key documentation URLs.

### `project.documentation.code-of-conduct` (optional)

- **Type**: [URL]
- **Description**: URL to the document outlining contributor and user conduct guidelines.

### `project.documentation.detailed-guide` (optional)

- **Type**: [URL]
- **Description**: URL to more extensive or advanced documentation.

### `project.documentation.quickstart-guide` (optional)

- **Type**: [URL]
- **Description**: URL to a concise guide to basic functionality for new users.

### `project.documentation.release-process` (optional)

- **Type**: [URL]
- **Description**: URL describing how releases are planned, prepared, and published.

### `project.documentation.support-policy` (optional)

- **Type**: [URL]
- **Description**: URL to documentation describing how releases are supported. See [Recommendations for publishing End-of-life dates and support timelines](https://endoflife.date/recommendations) for best practices.

### `project.documentation.signature-verification` (optional)

- **Type**: [URL]
- **Description**: URL to documentation explaining how to verify digital signatures on assets.

---

## `project.homepage` (optional)

- **Type**: [URL]
- **Description**: A path to the project’s landing page. This may be a project website, a version control system repository, or a project/organization page in the VCS.

---

## `project.funding` (optional)

- **Type**: [URL]
- **Description**: A URL to information about sponsorships, donations, or other funding topics.

---

## `project.roadmap` (optional)

- **Type**: [URL]
- **Description**: A URL pointing to a roadmap or schedule for planned features and releases.

---

## `project.steward` (optional)

- **Type**: [Link]
- **Description**: This field is to communicate the relationship between the project and "a legal person, other than a manufacturer, that has the purpose or objective of systematically providing support on a sustained basis for the development of specific products with digital elements, qualifying as free and open-source software and intended for commercial activities, and that ensures the viability of those products" This definition is drawn from the [European Union Cyber Resilience Act, Article 3](https://eur-lex.europa.eu/eli/reg/2024/2847/oj/eng#art_3).

[URL]: ./aliases.md#url
[Contact]: ./aliases.md#contact
[Link]: ./aliases.md#link
