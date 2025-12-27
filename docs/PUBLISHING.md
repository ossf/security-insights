---
layout: default
title: Publishing the CUE Module
nav-title: Publishing
---

# Publishing the Security Insights CUE Module

This document describes how to publish the Security Insights CUE module to the CUE registry for distribution to other projects.

## Overview

The Security Insights schema is published as a CUE module to `registry.cue.works/github.com/ossf/security-insights`. This allows other projects to import and use the schema using:

```cue
import "github.com/ossf/security-insights"
```

## Prerequisites

1. **CUE CLI**: Ensure you have CUE installed (v0.15.1 or later)
   ```bash
   cue version
   ```

2. **Registry Authentication**: You need to be authenticated to publish to the CUE registry
   - For `registry.cue.works`, authentication is typically handled via GitHub OAuth
   - Ensure you have write access to the `ossf/security-insights-spec` repository

3. **Git Tags**: The module version is determined from git tags. Ensure you have:
   - Created a git tag for the version you want to publish (e.g., `v2.2.0`)
   - Pushed the tag to the remote repository

## Publishing Process

### Step 1: Prepare for Release

1. **Update Version**: Ensure the `VERSION` file contains the correct version number:
   ```bash
   cat VERSION
   # Should show: 2.2.0 (or your target version)
   ```

2. **Create Git Tag**: Create and push a git tag matching the version:
   ```bash
   git tag v2.2.0
   git push origin v2.2.0
   ```

3. **Verify Module**: Ensure the module is properly configured:
   ```bash
   make mod-tidy
   cue mod resolve github.com/ossf/security-insights
   ```

### Step 2: Publish the Module

**Option A: Using Makefile (Recommended)**

```bash
make mod-publish
```

This will:
- Read the version from the `VERSION` file
- Prompt for confirmation
- Publish the module to the registry

**Option B: Using CUE CLI Directly**

```bash
VERSION=$(cat VERSION | sed 's/^/v/')
cue mod publish --version $VERSION
```

### Step 3: Verify Publication

After publishing, verify the module is available:

```bash
# Resolve the module path
cue mod resolve github.com/ossf/security-insights@v2.2.0

# Test importing in a separate project
cd /tmp
cue mod init test-project
cue mod get github.com/ossf/security-insights@v2.2.0
```

## Versioning

The module follows semantic versioning (SemVer):

- **Major versions** (e.g., `v2.0.0`): Breaking changes to the schema
- **Minor versions** (e.g., `v2.1.0`): New features, backward compatible
- **Patch versions** (e.g., `v2.1.1`): Bug fixes, backward compatible

The version must match the git tag format: `vMAJOR.MINOR.PATCH`

## Registry Information

The module is published to:
- **Registry**: `registry.cue.works`
- **Module Path**: `github.com/ossf/security-insights`
- **Full Registry Path**: `registry.cue.works/github.com/ossf/security-insights`

## Troubleshooting

### Authentication Issues

If you encounter authentication errors:

1. Check that you're logged in to the CUE registry:
   ```bash
   cue login
   ```

2. Verify your GitHub account has access to the repository

### Version Conflicts

If a version already exists:

- The registry will reject the publish if the version already exists
- You must increment the version number and create a new tag
- Never republish the same version

### Module Not Found After Publishing

If the module isn't immediately available:

- Wait a few minutes for the registry to sync
- Clear your local module cache: `rm -rf cue.mod/pkg`
- Run `cue mod tidy` to refresh dependencies

## Release Checklist

Before publishing a new version:

- [ ] Update `VERSION` file with the new version number
- [ ] Update `CHANGELOG.md` (if applicable)
- [ ] Run `make lintcue` to ensure schema is valid
- [ ] Run `make lintyml` to validate example files
- [ ] Create and push git tag: `git tag vX.Y.Z && git push origin vX.Y.Z`
- [ ] Run `make mod-publish` to publish the module
- [ ] Verify the module is accessible: `cue mod resolve github.com/ossf/security-insights@vX.Y.Z`
- [ ] Update documentation if needed
- [ ] Create a GitHub release with release notes

## Alternative: Publishing to OCIR

If you need to publish to an OCI (Open Container Initiative) registry instead:

```bash
cue mod publish --registry oci://ghcr.io/ossf/security-insights --version v2.2.0
```

Note: OCIR publishing requires:
- Authentication to the OCI registry
- Proper registry configuration
- OCI-compatible registry endpoint

## Additional Resources

- [CUE Module Documentation](https://cuelang.org/docs/concepts/modules/)
- [CUE Registry](https://registry.cue.works/)
- [CUE Publishing Guide](https://cuelang.org/docs/concepts/modules/#publishing-modules)

