# Security Insights Specification _(2.0.0)_

SecurityInsights defines a schema that projects can use to report information about their security in a machine-processable way. The data tracked within this specification is intended to fill the gaps between simplified solutions such as SECURITY.md and comprehensive automated solutions such as SBOMs. In that gap lay elements that must be self-reported by projects to allow end-users to make informed security decisions.

---

# `assessment` _(2.0.0)_

Assessment represents the results of a security assessment, including comments, evidence, and date.

## Required vs Optional Fields

Required if `assessment` is present:

- `comment`

Optional:

- `date`
- `evidence`
- `name`

---

## `assessment.comment`

- **Description**: Notes or commentary about the findings or purpose of the assessment.
- **Type**: `string`

---

## `assessment.date (optional)`

- **Description**: The date the assessment was published.
- **Type**: [Date]

---

## `assessment.evidence (optional)`

- **Description**: The URL where the assessment report or artifact is located.
- **Type**: [URL]

---

## `assessment.name (optional)`

- **Description**: The name or identifier of the assessment artifact.
- **Type**: `string`

---



# `attestation` _(2.0.0)_

Attestation describes an [in-toto attestation](https://github.com/in-toto/attestation/blob/main/spec/README.md#in-toto-attestation-framework-spec), including its name, location, predicate URI, and any additional comments.

## Required vs Optional Fields

Required if `attestation` is present:

- `name`
- `location`
- `predicate-uri`

Optional:

- `comment`

---

## `attestation.location`

- **Description**: A web location where the attestation can be found.
- **Type**: [URL]

---

## `attestation.name`

- **Description**: The name or identifier of the attestation.
- **Type**: `string`

---

## `attestation.predicate-uri`

- **Description**: A URI to a resource describing the attestation’s predicate or specification.
- **Type**: `string`

---

## `attestation.comment (optional)`

- **Description**: Additional context or instructions for using the attestation.
- **Type**: `string`

---



# `contact` _(2.0.0)_

Contact represents a person or entity responsible for the project, including their name, affiliation, and contact details.

## Required vs Optional Fields

Required if `contact` is present:

- `name`
- `primary`

Optional:

- `affiliation`
- `email`
- `social`

---

## `contact.affiliation (optional)`

- **Description**: The entity with which the contact is affiliated, such as a school or employer.
- **Type**: `string`

---

## `contact.email (optional)`

- **Description**: A preferred email address to reach the contact.
- **Type**: [Email]

---

## `contact.name`

- **Description**: The contact person's name.
- **Type**: `string`

---

## `contact.primary`

- **Description**: Indicates whether this admin is the first point of contact for inquiries. Only one entry should be marked as primary.
- **Type**: `boolean`

---

## `contact.social (optional)`

- **Description**: A social media handle or profile for the contact.
- **Type**: `string`

---



# `email` _(2.0.0)_

Email is a valid email address



# `header` _(2.0.0)_

The Header object captures high-level metadata about the schema.

## Required vs Optional Fields

Required if `header` is present:

- `last-reviewed`
- `last-updated`
- `schema-version`
- `url`

Optional:

- `project-si-source`
- `comment`

---

## `header.schema-version`

- **Description**: The version of the Security Insights schema being used.
- **Type**: [SchemaVersion]

---

## `header.url`

- **Description**: The primary reference URL for this schema’s origin or repository.
- **Type**: [URL]

---

## `header.comment (optional)`

- **Description**: Additional information about the schema.
- **Type**: `string`

---

## `header.last-reviewed`

- **Description**: The date when the document or data was last reviewed.
- **Type**: [Date]

---

## `header.last-updated`

- **Description**: The date when the document or data was last updated.
- **Type**: [Date]

---

## `header.project-si-source (optional)`

- **Description**: A URL to the security insights file that contains project information for this file to inherit. The URL provided here should respond to an unauthenticated GET request and return a valid security insights file using a content-type of "text/plain" or "application/yaml". This is useful for projects that are part of a larger organization or ecosystem, where much of the security insights data is shared across multiple projects.
- **Type**: [URL]

---



# `license` _(2.0.0)_

## Required vs Optional Fields

Required if `license` is present:

- `url`
- `expression`

---

## `license.expression`

- **Description**: The SPDX license expression for the license.
- **Type**: `string`

---

## `license.url`

- **Description**: A web address where the license can be found.
- **Type**: [URL]

---



# `link` _(2.0.0)_

## Required vs Optional Fields

Required if `link` is present:

- `uri`
- `comment`

---

## `link.comment`

- **Description**: Instructions or information about the link.
- **Type**: `string`

---

## `link.uri`

- **Description**: A link to a resource, not restricted to http/s.
- **Type**: `string`

---



# `project` _(2.0.0)_

Project describes the overall project, including basic info, documentation links, repositories, vulnerability reporting, and security details.

## Required vs Optional Fields

Required if `project` is present:

- `name`
- `administrators`
- `repositories`
- `vulnerability-reporting`

Optional:

- `funding`
- `homepage`
- `steward`
- `documentation`
- `roadmap`

---

## `project.administrators`

- **Description**: A list of 1 or more individuals who have administrative access to the project's resources.
- **Type**: `array`

---

## `project.funding (optional)`

- **Description**: A URL to information about sponsorships, donations, or other funding topics.
- **Type**: [URL]

---

## `project.homepage (optional)`

- **Description**: A path to the project’s landing page. This may be a project website, a version control system repository, or a project/organization page in the VCS.
- **Type**: [URL]

---

## `project.steward (optional)`

- **Description**: This field is to communicate the relationship between the project and "a legal person, other than a manufacturer, that has the purpose or objective of systematically providing support on a sustained basis for the development of specific products with digital elements, qualifying as free and open-source software and intended for commercial activities, and that ensures the viability of those products" This definition is drawn from the [European Union Cyber Resilience Act, Article 3](https://eur-lex.europa.eu/eli/reg/2024/2847/oj/eng#art_3).
- **Type**: [Link]

---

## `project.documentation (optional)`

- **Description**: the project's documentation resources
- **Type**: [ProjectDocumentation]

---

## `project.name`

- **Description**: The name of the project.
- **Type**: `string`

---

## `project.repositories`

- **Description**: A list of 1 or more repositories that are part of this project, including the repository this file is published in.
- **Type**: `array`

---

## `project.roadmap (optional)`

- **Description**: A URL pointing to a roadmap or schedule for planned features and releases.
- **Type**: [URL]

---

## `project.vulnerability-reporting`

- **Description**: An object describing how security vulnerabilities can be reported and how they are handled by the project.
- **Type**: [VulnerabilityReporting]

---



# `projectdocumentation` _(2.0.0)_

ProjectDocumentation contains links to various documents related to the project, including detailed guides, code of conduct, quickstart guides, release processes, support policies, and signature verification.

## Required vs Optional Fields


Optional:

- `quickstart-guide`
- `release-process`
- `signature-verification`
- `support-policy`
- `code-of-conduct`
- `detailed-guide`

---

## `projectdocumentation.detailed-guide (optional)`

- **Description**: URL to more extensive or advanced documentation.
- **Type**: [URL]

---

## `projectdocumentation.quickstart-guide (optional)`

- **Description**: URL to a concise guide to basic functionality for new users.
- **Type**: [URL]

---

## `projectdocumentation.release-process (optional)`

- **Description**: URL describing how releases are planned, prepared, and published.
- **Type**: [URL]

---

## `projectdocumentation.signature-verification (optional)`

- **Description**: URL to documentation explaining how to verify digital signatures on assets.
- **Type**: [URL]

---

## `projectdocumentation.support-policy (optional)`

- **Description**: URL to documentation describing how releases are supported. See [Recommendations for publishing End-of-life dates and support timelines](https://endoflife.date/recommendations) for best practices.
- **Type**: [URL]

---

## `projectdocumentation.code-of-conduct (optional)`

- **Description**: URL to the document outlining contributor and user conduct guidelines.
- **Type**: [URL]

---



# `projectrepository` _(2.0.0)_

The ProjectRepository object describes a repository that is part of a project, including its name, comment, and URL.

## Required vs Optional Fields

Required if `projectrepository` is present:

- `name`
- `comment`
- `url`

---

## `projectrepository.name`

- **Description**: The name or short label of the repository.
- **Type**: `string`

---

## `projectrepository.url`

- **Description**: The URL where the repository is hosted.
- **Type**: [URL]

---

## `projectrepository.comment`

- **Description**: Explanation of the repository purpose or contents and its relation to the rest of the project.
- **Type**: `string`

---



# `releasedetails` _(2.0.0)_

ReleaseDetails describes the release process for the repository, including automated pipelines, distribution points, changelogs, licenses, and attestations.

## Required vs Optional Fields

Required if `releasedetails` is present:

- `automated-pipeline`
- `distribution-points`

Optional:

- `attestations`
- `changelog`
- `license`

---

## `releasedetails.attestations (optional)`

- **Description**: List of attestations for the repository’s releases.
- **Type**: `array`

---

## `releasedetails.automated-pipeline`

- **Description**: Indicates if the repository uses an automated release pipeline.
- **Type**: `boolean`

---

## `releasedetails.changelog (optional)`

- **Description**: A URL to the repository’s release changelog. The URL value should include placeholders such as `{version}` if relevant.
- **Type**: [URL]

---

## `releasedetails.distribution-points`

- **Description**: A list of 1 or more links describing where the repository’s releases are distributed. This may be the VCS releases page, a package manager, or other distribution points.
- **Type**: `array`

---

## `releasedetails.license (optional)`

- **Description**: Describes the license details specifically for releases. This should be used when the release license differs from the repository license.
- **Type**: [License]

---



# `repository` _(2.0.0)_

The Repository object specifies repository-related configurations, including status, policies, team members, documentation, license, releases, and security posture.

## Required vs Optional Fields

Required if `repository` is present:

- `status`
- `url`
- `accepts-change-request`
- `accepts-automated-change-request`
- `core-team`
- `license`
- `security`

Optional:

- `bug-fixes-only`
- `documentation`
- `no-third-party-packages`
- `release`

---

## `repository.bug-fixes-only (optional)`

- **Description**: Specifies whether the repository only accepts bug-fixes and not feature work.
- **Type**: `boolean`

---

## `repository.documentation (optional)`

- **Description**: Documentation links for the repository, including links to contributing guides, dependency management policies, governance documents, and review policies.
- **Type**: [RepositoryDocumentation]

---

## `repository.no-third-party-packages (optional)`

- **Description**: Indicates whether the repository universally avoids package dependencies from outside of the project.
- **Type**: `boolean`

---

## `repository.release (optional)`

- **Description**: Release describes the release process for the repository.
- **Type**: [ReleaseDetails]

---

## `repository.security`

- **Description**: An object describing security-related artifacts, champions, and tooling for the repository.
- **Type**: [SecurityPosture]

---

## `repository.accepts-automated-change-request`

- **Description**: Indicates whether the repository accepts automated or machine-generated change requests.
- **Type**: `boolean`

---

## `repository.accepts-change-request`

- **Description**: Indicates whether the repository currently accepts any change requests.
- **Type**: `boolean`

---

## `repository.status`

- **Description**: Indicates the repository’s current [Repo Status](https://repostatus.org).
- **Type**: `string`

---

## `repository.url`

- **Description**: The main URL for this repository.
- **Type**: [URL]

---

## `repository.core-team`

- **Description**: A list of 1 or more core team members for this repository, such as maintainers or approvers.
- **Type**: `array`

---

## `repository.license`

- **Description**: The license information for this repository.
- **Type**: [License]

---



# `repositorydocumentation` _(2.0.0)_

RepositoryDocumentation contains links to various documents related to the repository, including contributing guides, dependency management policies, governance documents, and review policies.

## Required vs Optional Fields


Optional:

- `contributing-guide`
- `dependency-management-policy`
- `governance`
- `review-policy`
- `security-policy`

---

## `repositorydocumentation.contributing-guide (optional)`

- **Description**: URL to a document outlining the process for contributing to the repository.
- **Type**: [URL]

---

## `repositorydocumentation.dependency-management-policy (optional)`

- **Description**: URL to a document outlining the process for managing dependencies in the repository.
- **Type**: [URL]

---

## `repositorydocumentation.governance (optional)`

- **Description**: URL to any governance documents regarding roles, responsibilities, processes, and decision-making.
- **Type**: [URL]

---

## `repositorydocumentation.review-policy (optional)`

- **Description**: URL to a document outlining the process for reviewing changes to the repository.
- **Type**: [URL]

---

## `repositorydocumentation.security-policy (optional)`

- **Description**: URL with information about the repository's security, including the policy for reporting security vulnerabilities.
- **Type**: [URL]

---



# `schemaversion` _(2.0.0)_

SchemaVersion is a version string in the format X.Y.Z



# `securityinsights` _(2.0.0)_

SecurityInsights defines a schema that projects can use to report information about their security in a machine-processable way. The data tracked within this specification is intended to fill the gaps between simplified solutions such as SECURITY.md and comprehensive automated solutions such as SBOMs. In that gap lay elements that must be self-reported by projects to allow end-users to make informed security decisions.

## Required vs Optional Fields

Required if `securityinsights` is present:

- `header`

Optional:

- `project`
- `repository`

---

## `securityinsights.header`

- **Description**: header captures high level metadata about the schema.
- **Type**: [Header]

---

## `securityinsights.project (optional)`

- **Description**: project describes the overall project, including basic info, documentation links, repositories, vulnerability reporting, and security details. This field is not required if `header.project-si-source` is supplied.
- **Type**: [Project]

---

## `securityinsights.repository (optional)`

- **Description**: repository describes repository-related configurations, including status, policies, team members, documentation, license, releases, and security posture. This field is not required if `header.project-si-source` is supplied. This field is required if the file is intended for use as a parent security insights file with project information to be inherited by multiple repositories via their respective `header.project-si-source`.
- **Type**: [Repository]

---



# `securityposture` _(2.0.0)_

SecurityPosture describes the security posture of the repository, including assessments, champions, and tools.

## Required vs Optional Fields

Required if `securityposture` is present:

- `assessments`

Optional:

- `tools`
- `champions`

---

## `securityposture.tools (optional)`

- **Description**: A list of objects describing security-related tools used in the repository.
- **Type**: `array`

---

## `securityposture.assessments`

- **Description**: An object describing security assessments for the repository.
- **Type**: `object`

---

## `securityposture.champions (optional)`

- **Description**: A list of core team members who advocate for continuous improvement of security practices. These individuals may take responsibility for security reviews, training, interfacing with stakeholders on security topics, or other similar activities.
- **Type**: `array`

---



# `securitytool` _(2.0.0)_

SecurityTool describes a security-related tool used in the repository, including its name, type, version, rulesets, integration details, and results.

## Required vs Optional Fields

Required if `securitytool` is present:

- `name`
- `type`
- `rulesets`
- `integration`
- `results`

Optional:

- `version`
- `comment`

---

## `securitytool.results`

- **Type**: [SecurityToolResults]

---

## `securitytool.rulesets`

- **Description**: The set of rules or configurations applied by the tool. If customization is not enabled, the only value here should be "default".
- **Type**: `string`

---

## `securitytool.type`

- **Description**: The general category or type of the tool.
- **Type**: `string`

---

## `securitytool.version (optional)`

- **Description**: The version of the tool that is used.
- **Type**: `string`

---

## `securitytool.comment (optional)`

- **Description**: Additional notes about the tool’s usage or configuration.
- **Type**: `string`

---

## `securitytool.integration`

- **Description**: An object describing how the tool is integrated with the project.
- **Type**: [SecurityToolIntegration]

---

## `securitytool.name`

- **Description**: The name of the tool.
- **Type**: `string`

---



# `securitytoolintegration` _(2.0.0)_

SecurityToolIntegration describes how a security tool is integrated into the repository, including whether it is used in scheduled processes, continuous integration, or during the release process.

## Required vs Optional Fields

Required if `securitytoolintegration` is present:

- `adhoc`
- `ci`
- `release`

---

## `securitytoolintegration.adhoc`

- **Description**: Indicates whether the tool is used in a scheduled process or supports an on-demand.
- **Type**: `boolean`

---

## `securitytoolintegration.ci`

- **Description**: Indicates whether the tool is used in the continuous integration process.
- **Type**: `boolean`

---

## `securitytoolintegration.release`

- **Description**: Indicates whether the tool is run before or during the release process.
- **Type**: `boolean`

---



# `securitytoolresults` _(2.0.0)_

SecurityToolResults describes the results of security scans, including those run on-demand, in continuous integration, and during the release process.

## Required vs Optional Fields


Optional:

- `adhoc`
- `ci`
- `release`

---

## `securitytoolresults.release (optional)`

- **Description**: Results of security scans run in the build and release process.
- **Type**: [Attestation]

---

## `securitytoolresults.adhoc (optional)`

- **Description**: Results of scheduled or on-demand security scans.
- **Type**: [Attestation]

---

## `securitytoolresults.ci (optional)`

- **Description**: Results of security scans run in the continuous integration process.
- **Type**: [Attestation]

---



# `url` _(2.0.0)_

URL is a TLS URL



# `vulnerabilityreporting` _(2.0.0)_

VulnerabilityReporting describes how security vulnerabilities can be reported and how they are handled by the project.

## Required vs Optional Fields

Required if `vulnerabilityreporting` is present:

- `reports-accepted`
- `bug-bounty-available`

Optional:

- `pgp-key`
- `comment`
- `contact`
- `out-of-scope`
- `bug-bounty-program`
- `in-scope`
- `security-policy`

---

## `vulnerabilityreporting.bug-bounty-program (optional)`

- **Description**: Path to a page providing details about any bug bounty program.
- **Type**: [URL]

---

## `vulnerabilityreporting.in-scope (optional)`

- **Description**: A list of issues or components that are covered by the vulnerability reporting process.
- **Type**: `array`

---

## `vulnerabilityreporting.reports-accepted`

- **Description**: Indicates whether this project currently accepts vulnerability reports.
- **Type**: `boolean`

---

## `vulnerabilityreporting.security-policy (optional)`

- **Description**: Path to a page containing guidelines for security-related disclosures.
- **Type**: [URL]

---

## `vulnerabilityreporting.bug-bounty-available`

- **Description**: Specifies whether a bug bounty program is offered.
- **Type**: `boolean`

---

## `vulnerabilityreporting.comment (optional)`

- **Description**: Additional comments or instructions about vulnerability reporting.
- **Type**: `string`

---

## `vulnerabilityreporting.contact (optional)`

- **Description**: Point of contact for reporting vulnerabilities. This may be a single person or a mailgroup.
- **Type**: [Contact]

---

## `vulnerabilityreporting.out-of-scope (optional)`

- **Description**: A list of issues or components not covered by the vulnerability reporting process.
- **Type**: `array`

---

## `vulnerabilityreporting.pgp-key (optional)`

- **Description**: The PGP public key for secure communication.
- **Type**: `string`

---



# Aliases _(2.0.0)_

The following aliases are used throughout the schema for consistency.

## `date`

Date is a date in the format YYYY-MM-DD

- **Type**: `string`
- **Pattern**: `^\d{4}-\d{2}-\d{2}$`
- **Format**: `date`

---

