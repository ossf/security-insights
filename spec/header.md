# `header` _(v2.0.0)_

The `header` object captures high-level metadata about the schema.

---

## `header.last-reviewed`

- **Type**: [Date]
- **Description**: The date when the document or data was last reviewed.

---

## `header.last-updated`

- **Type**: [Date]
- **Description**: The date when this document or data was last updated.

---

## `header.schema-version`

- **Type**: [SchemaVersion]
- **Description**: Represents the version of this schema.

---

## `header.url`

- **Type**: [URL]
- **Description**: The primary reference URL for this schema’s origin or repository.

---

## `header.comment` (optional)

- **Type**: `string`
- **Description**: Additional information about the schema.

---

## `header.project-si-source` (optional)

- **Type**: [URL]
- **Description**: A URL to the security insights file that contains project information for this file to inherit. The URL provided here should respond to an unauthenticated GET request and return a valid security insights file using a content-type of "text/plain" or "application/yaml". This is useful for projects that are part of a larger organization or ecosystem, where much of the security insights data is shared across multiple projects.

---

[URL]: ./aliases.md#url
[Date]: ./aliases.md#date
[SchemaVersion]: ./aliases.md#schemaversion
