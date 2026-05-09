---
layout: default
title: Get Started
nav-title: Get Started
---

# Get Started

A `security-insights.yml` file lets your project self-report its security practices, contacts, and policies in a structured format. Tools that evaluate or display project security can then read the file directly instead of scraping prose from `SECURITY.md` or guessing from repository signals.

This page walks through producing a valid file. Pick the path that matches the shape of your project.

## Choose your project shape

**One repository.** Your project is a single repository. Publish one `security-insights.yml` containing both `project:` and `repository:` sections. This is the simplest setup and fits most projects.

**Multiple repositories.** Your project spans more than one repository — for example, separate repositories for an API server, a CLI, and a website. Publish a *parent* file in one chosen repository (containing the `project:` section) and a *child* file in each of the others (containing only `repository:` and a pointer to the parent). Children inherit project-level information from the parent so you don't repeat it in each repo.

When in doubt, start with the single-repository path. You can move to a parent/child layout later without invalidating existing files.

<div class="tabs">
  <input type="radio" id="tab-single" name="repo-tabs" checked>
  <input type="radio" id="tab-multi" name="repo-tabs">
  <div class="tab-bar" role="tablist">
    <label for="tab-single" role="tab">Single repository</label>
    <label for="tab-multi" role="tab">Multiple repositories</label>
  </div>
  <div class="tab-panel" id="panel-single" role="tabpanel" markdown="1">

## Single-repository path

1. Copy [`example-minimum.yml`][min] into your repository as `security-insights.yml`. Recommended locations, in priority order:
    - `security-insights.yml` at the repository root, or
    - `.github/security-insights.yml` (or `.gitlab/...`, etc.) for source-forge integrations.

2. Replace the placeholder values with your project's actual data. Every field in the minimum example is meaningful; some sub-fields like `email` and `social` on contacts are optional and can be dropped if they don't apply.

3. Update `header.last-updated` and `header.last-reviewed` to today's date (`YYYY-MM-DD`).

4. [Validate the file](#validate-your-file).

For a complete listing of optional fields — release attestations, security tools, third-party assessments, and more — see [`example-full.yml`][full] and the [schema reference](schema.md).

  </div>
  <div class="tab-panel" id="panel-multi" role="tabpanel" markdown="1">

## Multi-repository path

### The parent file

The parent file lives in one chosen repository and holds the `project:` section. Start from [`example-multi-repository-project.yml`][parent].

> **Important:** the parent file must be reachable over HTTPS as **raw content**, not as a rendered HTML page. Consumers fetch the URL with a plain GET and expect a `text/plain` or `application/yaml` response. On GitHub, that means a `https://raw.githubusercontent.com/...` URL — a regular `https://github.com/.../blob/...` URL returns HTML and will fail.

### The child files

Each other repository in the project gets a child file that:

- sets `header.project-si-source` to the **raw URL of the parent file**,
- omits the `project:` section entirely (inherited from the parent),
- contains its own `repository:` section.

Start from [`example-multi-repository-project-reuse.yml`][child].

### Where to put what

| Belongs in the parent file | Belongs in each child file |
|---|---|
| Project name, administrators, homepage, funding | Repository URL and status |
| Project documentation links (quickstart, code of conduct, etc.) | Repository license |
| Vulnerability reporting policy and contact | Repository core team |
| The list of all repositories in the project | Repository release process and security tooling |

  </div>
</div>

## Validate your file

Install [CUE](https://cuelang.org/docs/introduction/installation/), download the schema, and run `cue vet`:

```bash
curl -O https://raw.githubusercontent.com/ossf/security-insights/main/spec/schema.cue
cue vet -d '#SecurityInsights' schema.cue security-insights.yml
```

A successful run prints nothing. Errors point at the offending field with a path and a reason.

If you maintain the file in a Git repository, consider running this in CI so a future change can't break it silently.

## Keep it current

A `security-insights.yml` describes your project at a point in time. As maintainers, contacts, tooling, or policies change, update the file and bump `header.last-updated`. A quick review every 1–6 months is enough for most projects.

## Next steps

- [Schema reference](schema.md) — every field, its type, whether it's required, and what it means.
- [FAQ](FAQ.md) — common questions, trust expectations, edge cases.
- [GitHub Issues](https://github.com/ossf/security-insights/issues) and [#security_insights on Slack](https://openssf.slack.com/messages/security_insights/) — for discussion and feedback.

[min]: https://github.com/ossf/security-insights/blob/main/examples/example-minimum.yml
[full]: https://github.com/ossf/security-insights/blob/main/examples/example-full.yml
[parent]: https://github.com/ossf/security-insights/blob/main/examples/example-multi-repository-project.yml
[child]: https://github.com/ossf/security-insights/blob/main/examples/example-multi-repository-project-reuse.yml
