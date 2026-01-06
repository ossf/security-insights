# Anti-Examples

This directory contains intentionally malformed Security Insights files that demonstrate common validation errors. These files should **fail** validation and are useful for:

- Testing validation tools
- Understanding common mistakes
- Documentation of what NOT to do

## Files

- **missing-required-fields.yml** - Missing required fields like `schema-version`, `administrators`, etc.
- **invalid-schema-version.yml** - Schema version doesn't match the required pattern (e.g., missing patch version)
- **invalid-url-format.yml** - URLs that don't match the required HTTP/HTTPS pattern
- **invalid-date-format.yml** - Dates not in the required YYYY-MM-DD format
- **invalid-enum-value.yml** - Enum fields with values that aren't in the allowed set
- **invalid-field-type.yml** - Fields with incorrect types (e.g., string instead of bool)
- **invalid-email-format.yml** - Email addresses that don't match the required pattern

## Testing

You can test that these files fail validation using:

```bash
# Test a specific anti-example
cue vet -d '#SecurityInsights' ./schema.cue anti-examples/invalid-url-format.yml

# All anti-examples should fail validation
for file in anti-examples/*.yml; do
  echo "Testing $file (should fail)..."
  cue vet -d '#SecurityInsights' ./schema.cue "$file" && echo "ERROR: $file should have failed!" || echo "✓ $file correctly failed validation"
done
```

