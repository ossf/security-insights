# Aliases _(v2.0.0)_

The following aliases are used throughout the schema for consistency.

## `assessment`

### `assessment.name`

- **Type**: `string`
- **Description**: The name or identifier of the assessment artifact.

### `assessment.evidence`

- **Type**: [URL]
- **Matches Pattern**: `^https?://[^\\s]+$`
- **Description**: The URL where the assessment report or artifact is located.

### `assessment.date`

- **Type**: [Date]
- **Description**: The date the assessment was published.

### `assessment.comment`

- **Type**: `string`
- **Description**: Notes or commentary about the findings or purpose of the assessment.

---

## `attestation`

A list of objects describing various release attestations or artifacts.

### `attestation.name`

- **Type**: `string`
- **Description**: The name or identifier of the attestation.

### `attestation.location`

- **Type**: [URL]
- **Description**: A web location where the attestation can be found.

### `attestation.predicate-uri`

- **Type**: `string`
- **Description**: A URI to a resource describing the attestation’s predicate or specification.

### `attestation.comment`

- **Type**: `string`
- **Description**: Additional context or instructions for using the attestation.

---

## `contact`

- `contact.name`
  - **Type**: `string`
  - **Description**: The contact person's name.
- `contact.primary`
  - **Type**: `bool`
  - **Description**: Indicates whether this admin is the first point of contact for inquiries. Only one entry should be marked as primary.
- `contact.affiliation` (optional)
  - **Type**: `string`
  - **Description**: The entity with which the contact is affiliated, such as a school or employer.
- `contact.email` (optional)
  - **Type**: [Email]
  - **Description**: A preferred email address to reach the contact.
- `contact.social` (optional)
  - **Type**: `string`
  - **Description**: A social media handle or profile for the contact.

---

## `license`

- `license.url`
  - **Type**: [URL]
  - **Description**: A web address where the license can be found.
- `license.expression`
  - **Type**: `string`
  - **Description**: The SPDX license expression for the license.

---

## `link`

- `link.uri`
  - **Type**: `string`
  - **Description**: A link to a resource, not restricted to http/s.
- `link.comment`
  - **Type**: `string`
  - **Description**: Instructions or information about the link.

---

## Validation Types

### `date`

- **Type**: `string`
- **Description**: A date in ISO 8601 format (`YYYY-MM-DD`).

### `email`

- **Type**: `string`
- **Matches Pattern**: `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$`

### `url`

- **Type**: `string`
- **Matches Pattern**: `^https?://[^\\s]+$`

### `schemaversion`

- **Type**: `string`
- **Matches Pattern**: `^[1-9]+\\.[0-9]+\\.[0-9]+$`

---

[URL]: #url
[Email]: #email
[Date]: #date
