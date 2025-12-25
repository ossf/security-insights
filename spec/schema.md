# Security Insights Specification _(2.0.0)_

SecurityInsights defines a schema that projects can use to report information about their security in a machine-processable way. The data tracked within this specification is intended to fill the gaps between simplified solutions such as SECURITY.md and comprehensive automated solutions such as SBOMs. In that gap lay elements that must be self-reported by projects to allow end-users to make informed security decisions.

## Required vs Optional Fields

Required:

- `header`

Optional:

- `project`
- `repository`

---

## `header`

header captures high level metadata about the schema.

- **Type**: [Header]

### Required vs Optional Fields

Required if `header` is present:

- `last-reviewed`
- `last-updated`
- `schema-version`
- `url`

Optional:

- `comment`
- `project-si-source`

---

### `header.comment`

**Optional Field**

Additional information about the schema.

- **Type**: `string`

---

### `header.last-reviewed`

The date when the document or data was last reviewed.

- **Type**: [Date]

---

### `header.last-updated`

The date when the document or data was last updated.

- **Type**: [Date]

---

### `header.project-si-source`

**Optional Field**

A URL to the security insights file that contains project information for this file to inherit. The URL provided here should respond to an unauthenticated GET request and return a valid security insights file using a content-type of "text/plain" or "application/yaml". This is useful for projects that are part of a larger organization or ecosystem, where much of the security insights data is shared across multiple projects.

- **Type**: [URL]

---

### `header.schema-version`

The version of the Security Insights schema being used.

- **Type**: [SchemaVersion]

---

### `header.url`

The primary reference URL for this schema’s origin or repository.

- **Type**: [URL]

---

## `project`

**Optional Field**

project describes the overall project, including basic info, documentation links, repositories, vulnerability reporting, and security details. This field is not required if `header.project-si-source` is supplied.

- **Type**: [Project]

### Required vs Optional Fields

Required if `project` is present:

- `administrators`
- `name`
- `repositories`
- `vulnerability-reporting`

Optional:

- `documentation`
- `funding`
- `homepage`
- `roadmap`
- `steward`

---

### `project.administrators`

A list of 1 or more individuals who have administrative access to the project's resources.

- **Type**: `array`
- **Items**: [Contact]

---

### `project.documentation`

**Optional Field**

the project's documentation resources

- **Type**: [ProjectDocumentation]

### Required vs Optional Fields


Optional:

- `code-of-conduct`
- `detailed-guide`
- `quickstart-guide`
- `release-process`
- `signature-verification`
- `support-policy`

---

#### `project.documentation.code-of-conduct`

**Optional Field**

URL to the document outlining contributor and user conduct guidelines.

- **Type**: [URL]

---

#### `project.documentation.detailed-guide`

**Optional Field**

URL to more extensive or advanced documentation.

- **Type**: [URL]

---

#### `project.documentation.quickstart-guide`

**Optional Field**

URL to a concise guide to basic functionality for new users.

- **Type**: [URL]

---

#### `project.documentation.release-process`

**Optional Field**

URL describing how releases are planned, prepared, and published.

- **Type**: [URL]

---

#### `project.documentation.signature-verification`

**Optional Field**

URL to documentation explaining how to verify digital signatures on assets.

- **Type**: [URL]

---

#### `project.documentation.support-policy`

**Optional Field**

URL to documentation describing how releases are supported. See [Recommendations for publishing End-of-life dates and support timelines](https://endoflife.date/recommendations) for best practices.

- **Type**: [URL]

---

### `project.funding`

**Optional Field**

A URL to information about sponsorships, donations, or other funding topics.

- **Type**: [URL]

---

### `project.homepage`

**Optional Field**

A path to the project’s landing page. This may be a project website, a version control system repository, or a project/organization page in the VCS.

- **Type**: [URL]

---

### `project.name`

The name of the project.

- **Type**: `string`

---

### `project.repositories`

A list of 1 or more repositories that are part of this project, including the repository this file is published in.

- **Type**: `array`
- **Items**: [ProjectRepository]

---

### `project.roadmap`

**Optional Field**

A URL pointing to a roadmap or schedule for planned features and releases.

- **Type**: [URL]

---

### `project.steward`

**Optional Field**

This field is to communicate the relationship between the project and "a legal person, other than a manufacturer, that has the purpose or objective of systematically providing support on a sustained basis for the development of specific products with digital elements, qualifying as free and open-source software and intended for commercial activities, and that ensures the viability of those products" This definition is drawn from the [European Union Cyber Resilience Act, Article 3](https://eur-lex.europa.eu/eli/reg/2024/2847/oj/eng#art_3).

- **Type**: [Link]

### Required vs Optional Fields

Required if `project.steward` is present:

- `comment`
- `uri`

---

#### `project.steward.comment`

Instructions or information about the link.

- **Type**: `string`

---

#### `project.steward.uri`

A link to a resource, not restricted to http/s.

- **Type**: `string`

---

### `project.vulnerability-reporting`

An object describing how security vulnerabilities can be reported and how they are handled by the project.

- **Type**: [VulnerabilityReporting]

### Required vs Optional Fields

Required if `project.vulnerability-reporting` is present:

- `bug-bounty-available`
- `reports-accepted`

Optional:

- `bug-bounty-program`
- `comment`
- `contact`
- `in-scope`
- `out-of-scope`
- `pgp-key`
- `security-policy`

---

#### `project.vulnerability-reporting.bug-bounty-available`

Specifies whether a bug bounty program is offered.

- **Type**: `boolean`

---

#### `project.vulnerability-reporting.bug-bounty-program`

**Optional Field**

Path to a page providing details about any bug bounty program.

- **Type**: [URL]

---

#### `project.vulnerability-reporting.comment`

**Optional Field**

Additional comments or instructions about vulnerability reporting.

- **Type**: `string`

---

#### `project.vulnerability-reporting.contact`

**Optional Field**

Point of contact for reporting vulnerabilities. This may be a single person or a mailgroup.

- **Type**: [Contact]

### Required vs Optional Fields

Required if `project.vulnerability-reporting.contact` is present:

- `name`
- `primary`

Optional:

- `affiliation`
- `email`
- `social`

---

##### `project.vulnerability-reporting.contact.affiliation`

**Optional Field**

The entity with which the contact is affiliated, such as a school or employer.

- **Type**: `string`

---

##### `project.vulnerability-reporting.contact.email`

**Optional Field**

A preferred email address to reach the contact.

- **Type**: [Email]

---

##### `project.vulnerability-reporting.contact.name`

The contact person's name.

- **Type**: `string`

---

##### `project.vulnerability-reporting.contact.primary`

Indicates whether this admin is the first point of contact for inquiries. Only one entry should be marked as primary.

- **Type**: `boolean`

---

##### `project.vulnerability-reporting.contact.social`

**Optional Field**

A social media handle or profile for the contact.

- **Type**: `string`

---

#### `project.vulnerability-reporting.in-scope`

**Optional Field**

A list of issues or components that are covered by the vulnerability reporting process.

- **Type**: `array`
- **Items**: `string`

---

#### `project.vulnerability-reporting.out-of-scope`

**Optional Field**

A list of issues or components not covered by the vulnerability reporting process.

- **Type**: `array`
- **Items**: `string`

---

#### `project.vulnerability-reporting.pgp-key`

**Optional Field**

The PGP public key for secure communication.

- **Type**: `string`

---

#### `project.vulnerability-reporting.reports-accepted`

Indicates whether this project currently accepts vulnerability reports.

- **Type**: `boolean`

---

#### `project.vulnerability-reporting.security-policy`

**Optional Field**

Path to a page containing guidelines for security-related disclosures.

- **Type**: [URL]

---

## `repository`

**Optional Field**

repository describes repository-related configurations, including status, policies, team members, documentation, license, releases, and security posture. This field is not required if `header.project-si-source` is supplied. This field is required if the file is intended for use as a parent security insights file with project information to be inherited by multiple repositories via their respective `header.project-si-source`.

- **Type**: [Repository]

### Required vs Optional Fields

Required if `repository` is present:

- `accepts-automated-change-request`
- `accepts-change-request`
- `core-team`
- `license`
- `security`
- `status`
- `url`

Optional:

- `bug-fixes-only`
- `documentation`
- `no-third-party-packages`
- `release`

---

### `repository.accepts-automated-change-request`

Indicates whether the repository accepts automated or machine-generated change requests.

- **Type**: `boolean`

---

### `repository.accepts-change-request`

Indicates whether the repository currently accepts any change requests.

- **Type**: `boolean`

---

### `repository.bug-fixes-only`

**Optional Field**

Specifies whether the repository only accepts bug-fixes and not feature work.

- **Type**: `boolean`

---

### `repository.core-team`

A list of 1 or more core team members for this repository, such as maintainers or approvers.

- **Type**: `array`
- **Items**: [Contact]

---

### `repository.documentation`

**Optional Field**

Documentation links for the repository, including links to contributing guides, dependency management policies, governance documents, and review policies.

- **Type**: [RepositoryDocumentation]

### Required vs Optional Fields


Optional:

- `contributing-guide`
- `dependency-management-policy`
- `governance`
- `review-policy`
- `security-policy`

---

#### `repository.documentation.contributing-guide`

**Optional Field**

URL to a document outlining the process for contributing to the repository.

- **Type**: [URL]

---

#### `repository.documentation.dependency-management-policy`

**Optional Field**

URL to a document outlining the process for managing dependencies in the repository.

- **Type**: [URL]

---

#### `repository.documentation.governance`

**Optional Field**

URL to any governance documents regarding roles, responsibilities, processes, and decision-making.

- **Type**: [URL]

---

#### `repository.documentation.review-policy`

**Optional Field**

URL to a document outlining the process for reviewing changes to the repository.

- **Type**: [URL]

---

#### `repository.documentation.security-policy`

**Optional Field**

URL with information about the repository's security, including the policy for reporting security vulnerabilities.

- **Type**: [URL]

---

### `repository.license`

The license information for this repository.

- **Type**: [License]

### Required vs Optional Fields

Required if `repository.license` is present:

- `expression`
- `url`

---

#### `repository.license.expression`

The SPDX license expression for the license.

- **Type**: `string`

---

#### `repository.license.url`

A web address where the license can be found.

- **Type**: [URL]

---

### `repository.no-third-party-packages`

**Optional Field**

Indicates whether the repository universally avoids package dependencies from outside of the project.

- **Type**: `boolean`

---

### `repository.release`

**Optional Field**

Release describes the release process for the repository.

- **Type**: [ReleaseDetails]

### Required vs Optional Fields

Required if `repository.release` is present:

- `automated-pipeline`
- `distribution-points`

Optional:

- `attestations`
- `changelog`
- `license`

---

#### `repository.release.attestations`

**Optional Field**

List of attestations for the repository’s releases.

- **Type**: `array`
- **Items**: [Attestation]

---

#### `repository.release.automated-pipeline`

Indicates if the repository uses an automated release pipeline.

- **Type**: `boolean`

---

#### `repository.release.changelog`

**Optional Field**

A URL to the repository’s release changelog. The URL value should include placeholders such as `{version}` if relevant.

- **Type**: [URL]

---

#### `repository.release.distribution-points`

A list of 1 or more links describing where the repository’s releases are distributed. This may be the VCS releases page, a package manager, or other distribution points.

- **Type**: `array`
- **Items**: [Link]

---

#### `repository.release.license`

**Optional Field**

Describes the license details specifically for releases. This should be used when the release license differs from the repository license.

- **Type**: [License]

### Required vs Optional Fields

Required if `repository.release.license` is present:

- `expression`
- `url`

---

##### `repository.release.license.expression`

The SPDX license expression for the license.

- **Type**: `string`

---

##### `repository.release.license.url`

A web address where the license can be found.

- **Type**: [URL]

---

### `repository.security`

An object describing security-related artifacts, champions, and tooling for the repository.

- **Type**: [SecurityPosture]

### Required vs Optional Fields

Required if `repository.security` is present:

- `assessments`

Optional:

- `champions`
- `tools`

---

#### `repository.security.assessments`

An object describing security assessments for the repository.

### Required vs Optional Fields

Required if `repository.security.assessments` is present:

- `self`

Optional:

- `third-party`

---

##### `repository.security.assessments.self`

Results of the contributor team's assessment of software produced by this repository.

- **Type**: [Assessment]

### Required vs Optional Fields

Required if `repository.security.assessments.self` is present:

- `comment`

Optional:

- `date`
- `evidence`
- `name`

---

###### `repository.security.assessments.self.comment`

Notes or commentary about the findings or purpose of the assessment.

- **Type**: `string`

---

###### `repository.security.assessments.self.date`

**Optional Field**

The date the assessment was published.

- **Type**: [Date]

---

###### `repository.security.assessments.self.evidence`

**Optional Field**

The URL where the assessment report or artifact is located.

- **Type**: [URL]

---

###### `repository.security.assessments.self.name`

**Optional Field**

The name or identifier of the assessment artifact.

- **Type**: `string`

---

##### `repository.security.assessments.third-party`

**Optional Field**

Results of third-party assessments of software produced by this repository.

- **Type**: `array`
- **Items**: [Assessment]

---

#### `repository.security.champions`

**Optional Field**

A list of core team members who advocate for continuous improvement of security practices. These individuals may take responsibility for security reviews, training, interfacing with stakeholders on security topics, or other similar activities.

- **Type**: `array`
- **Items**: [Contact]

---

#### `repository.security.tools`

**Optional Field**

A list of objects describing security-related tools used in the repository.

- **Type**: `array`
- **Items**: [SecurityTool]

---

### `repository.status`

Indicates the repository’s current [Repo Status](https://repostatus.org).

- **Type**: `string`

---

### `repository.url`

The main URL for this repository.

- **Type**: [URL]

---


## Aliases

The following aliases are used throughout the schema for consistency.

## `date`

Date is a date in the format YYYY-MM-DD

- **Type**: `string`
- **Format**: `date`
- **Value**: `^\d{4}-\d{2}-\d{2}$`

---

## `email`

Email is a valid email address

- **Type**: `string`
- **Value**: `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$`

---

## `schemaversion`

SchemaVersion is a version string in the format X.Y.Z

- **Type**: `string`
- **Value**: `^[1-9]+\\.[0-9]+\\.[0-9]+$`

---

## `url`

URL is a TLS URL

- **Type**: `string`
- **Value**: `^https?://[^\\s]+$`

---

