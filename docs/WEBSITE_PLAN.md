# Security Insights Specification Website Plan

## Overview
Create a Jekyll-based documentation website for the Security Insights Specification, similar in structure to the gemara and security-baseline sites. The site will have two pages:
1. **Homepage** (`index.md`) - Front matter about Security Insights
2. **Schema Documentation** (`schema.md`) - The generated specification documentation

Both pages will share the same header and footer.

## Directory Structure

```
docs/
├── _config.yml                 # Jekyll configuration
├── _layouts/
│   └── default.html           # Default page layout with header/footer
├── _includes/
│   ├── header.html            # Site header with navigation
│   └── footer.html            # Site footer
├── assets/
│   ├── css/
│   │   └── style.scss         # Custom styles (if needed)
│   ├── fonts/                 # Font files (Cairo, IBMPlexSans)
│   ├── favicon.ico            # Site favicon
│   ├── logo.svg               # OpenSSF logo
│   └── security-insights-logo.png  # Security Insights logo (already exists)
├── index.md                   # Homepage
├── schema.md                  # Generated schema documentation (symlink or copy)
├── Gemfile                    # Jekyll dependencies
├── Gemfile.lock               # Locked dependencies
└── CNAME                      # GitHub Pages custom domain (if applicable)
```

## Page Structure

### 1. Homepage (`index.md`)
**Content:**
- Title: "Security Insights Specification"
- Description of what Security Insights is
- Key features and benefits
- Quick start guide
- Links to:
  - Schema documentation
  - Examples
  - GitHub repository
  - Governance/maintenance info

**Front matter:**
```yaml
---
layout: default
title: Home
nav-title: About
---
```

### 2. Schema Documentation (`schema.md`)
**Content:**
- The generated `spec/schema.md` content
- Should be automatically updated when schema is regenerated

**Front matter:**
```yaml
---
layout: default
title: Schema Documentation
nav-title: Schema
---
```

## Configuration Details

### `_config.yml`
- Site title: "Security Insights Specification"
- Description: Brief description of the spec
- URL: "https://security-insights.openssf.org" (or appropriate domain)
- Theme: minima (Jekyll default theme)
- Navigation: Two pages (Home, Schema)
- Social links: OpenSSF GitHub, X/Twitter, BlueSky, LinkedIn
- Author info: Security Insights maintainers

### `_layouts/default.html`
- Standard Jekyll layout
- Includes header and footer
- Wraps content in appropriate containers
- Uses minima theme structure

### `_includes/header.html`
- OpenSSF logo linking to openssf.org
- Site title linking to homepage
- Navigation menu with:
  - Home
  - Schema
- Responsive mobile menu

### `_includes/footer.html`
- Author/contact information
- Site description
- Social media links
- Copyright notice
- Link to GitHub repository

## Assets Needed

1. **Fonts**: Copy from gemara or security-baseline:
   - Cairo font family
   - IBMPlexSans font family

2. **Logos**:
   - OpenSSF logo (`logo.svg`) - from gemara/security-baseline
   - Security Insights logo (`security-insights-logo.png`) - already exists in docs/

3. **Favicon**: Create or copy from another site

4. **CSS**: Minimal custom styles if needed, otherwise use minima theme defaults

## Implementation Steps

1. **Create directory structure**
   - Create `docs/_layouts/`, `docs/_includes/`, `docs/assets/` directories

2. **Set up Jekyll configuration**
   - Create `_config.yml` with site metadata
   - Create `Gemfile` with Jekyll dependencies

3. **Create layout and includes**
   - Create `default.html` layout
   - Create `header.html` with navigation
   - Create `footer.html` with footer content

4. **Create homepage**
   - Write `index.md` with front matter and content

5. **Set up schema page**
   - Create `schema.md` that either:
     - Symlinks to `../spec/schema.md`, OR
     - Is automatically copied/updated during build
   - Add appropriate front matter

6. **Copy assets**
   - Copy fonts from gemara or security-baseline
   - Copy OpenSSF logo
   - Set up favicon

7. **Update Makefile** (optional)
   - Add target to copy `spec/schema.md` to `docs/schema.md` during build
   - Or use symlink approach

8. **Test locally**
   - Run `bundle install`
   - Run `bundle exec jekyll serve`
   - Verify both pages render correctly

## Navigation Structure

The site will have a simple two-page navigation:
- **About** (Homepage) - `/`
- **Schema** (Schema Documentation) - `/schema/`

## Styling Approach

- Use Jekyll's minima theme as base
- Minimal custom CSS if needed for:
  - Logo sizing/positioning
  - Homepage component cards (if used)
  - Schema documentation formatting

## Content for Homepage

Based on README.md, the homepage should include:
- What Security Insights is
- Purpose and goals
- Quick start for project maintainers
- Link to schema documentation
- Links to examples
- Information about releases and maintenance
- Links to GitHub, governance docs, etc.

## Schema Page Integration

The schema page should display the generated `spec/schema.md` content. Options:
1. **Symlink**: Create `docs/schema.md` as symlink to `../spec/schema.md`
2. **Copy**: Add Makefile target to copy during build
3. **Include**: Use Jekyll include to pull in content

Recommendation: Use symlink for simplicity, or copy during `make gendocs` to ensure it's always up to date.

## Next Steps

1. Review and approve this plan
2. Create the directory structure
3. Set up Jekyll configuration files
4. Create layout and include templates
5. Write homepage content
6. Set up schema page
7. Copy necessary assets
8. Test locally
9. Deploy to GitHub Pages

