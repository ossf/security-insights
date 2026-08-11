'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const yaml = require('js-yaml');
const EditorUtils = require('../../docs/editor/js/editor-utils.js');

test('bracket paths read, write, and delete without confusing repeated segments', () => {
  const data = {};
  const path = 'repository.security.tools[0].results.results[0].comment';
  EditorUtils.setNestedValue(data, path, 'found');

  assert.equal(EditorUtils.getNestedValue(data, path), 'found');
  assert.deepEqual(EditorUtils.normalizePath(path), [
    'repository',
    'security',
    'tools',
    '0',
    'results',
    'results',
    '0',
    'comment'
  ]);

  EditorUtils.deleteNestedValue(data, 'repository.security.tools[0].results.results[0]');
  assert.deepEqual(data.repository.security.tools[0].results.results, []);
});

test('YAML parsing uses CORE_SCHEMA and requires a top-level mapping', () => {
  const parsed = EditorUtils.parseYamlDocument(
    'header:\n  last-updated: 2025-03-01\n',
    yaml
  );
  assert.equal(parsed.header['last-updated'], '2025-03-01');
  assert.equal(typeof parsed.header['last-updated'], 'string');

  assert.throws(
    () => EditorUtils.parseYamlDocument('plain scalar', yaml),
    /top-level mapping/
  );
  assert.throws(
    () => EditorUtils.parseYamlDocument('- list item', yaml),
    /top-level mapping/
  );
  assert.throws(
    () => EditorUtils.parseYamlDocument('header: [', yaml),
    /unexpected end|flow collection/i
  );
});

test('quick-start data uses only current schema field names', () => {
  const maintainer = {
    name: 'Maintainer',
    email: 'maintainer@example.com',
    affiliation: 'Example'
  };
  const data = EditorUtils.createFreshDocument('v2.2.0', '2026-08-10', maintainer);
  const contact = data.project.administrators[0];

  assert.equal(data.header['schema-version'], '2.2.0');
  assert.equal(contact.primary, true);
  assert.deepEqual(data.repository['core-team'][0], contact);
  assert.equal(data.project['vulnerability-reporting']['reports-accepted'], true);
  assert.equal(data.project['vulnerability-reporting']['bug-bounty-available'], false);
  assert.deepEqual(data.project['vulnerability-reporting']['in-scope'], []);
  assert.deepEqual(data.project['vulnerability-reporting']['out-of-scope'], []);
  assert.deepEqual(data.project['vulnerability-reporting'].contact, contact);
  assert.equal(
    data.repository.security.assessments.self.comment,
    ''
  );
  assert.equal('contacts' in data.repository.security, false);
  assert.equal(
    'accepts-vulnerability-reports' in data.project['vulnerability-reporting'],
    false
  );
  assert.equal('out-scope' in data.project['vulnerability-reporting'], false);
  assert.equal('security-policy' in data.project['vulnerability-reporting'], false);
});

test('child exports omit inherited parent context', () => {
  const child = {
    header: {
      'schema-version': '2.2.0',
      'project-si-source': 'https://example.com/parent.yml'
    },
    repository: { url: 'https://example.com/child' }
  };
  const parent = {
    header: { comment: 'must not inherit' },
    project: { name: 'Inherited project' },
    repository: { url: 'https://example.com/parent' }
  };

  const presentation = EditorUtils.createDisplayData(child, parent);
  assert.equal(presentation.displayData.project.name, 'Inherited project');
  assert.deepEqual(presentation.readOnlyPaths, ['project']);
  assert.deepEqual(
    EditorUtils.createExportData(
      presentation.displayData,
      presentation.readOnlyPaths
    ),
    child
  );
});

test('document schema version wins and unknown schemas do not fabricate one', () => {
  assert.equal(
    EditorUtils.getSchemaVersion(
      { header: { 'schema-version': '9.8.7' } },
      { version: '2.2.0' }
    ),
    '9.8.7'
  );
  assert.equal(EditorUtils.getSchemaVersion({}, { version: 'v3.0.0' }), '3.0.0');
  assert.equal(EditorUtils.getSchemaVersion({}, { version: null }), null);
});
