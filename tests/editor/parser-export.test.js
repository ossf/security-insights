'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const yaml = require('js-yaml');
const CueParser = require('../../docs/editor/js/cue-parser.js');
const EditorUtils = require('../../docs/editor/js/editor-utils.js');
const YamlExport = require('../../docs/editor/js/yaml-export.js');

const root = path.resolve(__dirname, '..', '..');
const schemaSource = fs.readFileSync(path.join(root, 'spec', 'schema.cue'), 'utf8');
const schema = CueParser.parse(schemaSource, { version: 'v2.2.0' });
const exampleNames = [
  'example-full.yml',
  'example-minimum.yml',
  'example-multi-repository-project.yml',
  'example-multi-repository-project-reuse.yml'
];

function readExample(name) {
  return EditorUtils.parseYamlDocument(
    fs.readFileSync(path.join(root, 'examples', name), 'utf8'),
    yaml
  );
}

function clone(value) {
  return EditorUtils.cloneData(value);
}

function errorsFor(data, minimal = false) {
  YamlExport.init(schema);
  YamlExport.setFormData(data);
  YamlExport.setMinimalMode(minimal);
  return YamlExport.validate();
}

test('parser defaults to unknown version and accepts explicit metadata', () => {
  assert.equal(CueParser.parse(schemaSource).version, null);
  assert.equal(CueParser.parse(schemaSource, { version: 'v7.1.2' }).version, '7.1.2');
  assert.match(
    schema.getType('#SecurityInsights').fields.project.description,
    /Required for single-repository files/
  );
});

test('fetchAndParse carries optional version metadata without a default', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    text: async () => schemaSource
  });
  try {
    assert.equal((await CueParser.fetchAndParse('https://example.com/schema')).version, null);
    assert.equal(
      (
        await CueParser.fetchAndParse(
          'https://example.com/schema',
          { version: 'v4.5.6' }
        )
      ).version,
      '4.5.6'
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test('parser distinguishes fixed and variadic array cardinality', () => {
  const parsed = CueParser.parse(`
#Item: string
#Fixed: [#Item]
#OneOrMore: [#Item, ...]
#ZeroOrMore: [...#Item]
`);
  assert.deepEqual(
    {
      min: parsed.getType('#Fixed').minItems,
      max: parsed.getType('#Fixed').maxItems
    },
    { min: 1, max: 1 }
  );
  assert.equal(parsed.getType('#OneOrMore').minItems, 1);
  assert.equal(parsed.getType('#OneOrMore').maxItems, undefined);
  assert.equal(parsed.getType('#ZeroOrMore').minItems, 0);

  const rulesets = schema.getType('#SecurityTool').fields.rulesets;
  assert.equal(rulesets.options[0].kind, 'array-literal');
  assert.equal(rulesets.options[0].maxItems, 1);
  assert.equal(rulesets.options[1].minItems, 0);
});

test('all examples round-trip semantically and validate in normal mode', () => {
  for (const name of exampleNames) {
    const original = readExample(name);
    YamlExport.init(schema);
    YamlExport.setFormData(original);
    YamlExport.setMinimalMode(false);
    const generated = YamlExport.generateYaml();
    const reparsed = EditorUtils.parseYamlDocument(generated, yaml);
    assert.deepEqual(reparsed, original, name);
    assert.deepEqual(YamlExport.validate(), [], name);
  }
});

test('minimal output retains full-document roots and required descendants', () => {
  const full = readExample('example-full.yml');
  YamlExport.init(schema);
  const minimal = YamlExport.getExportData(full, true);

  assert.ok(minimal.header);
  assert.ok(minimal.project);
  assert.ok(minimal.repository);
  assert.equal('comment' in minimal.header, false);
  assert.equal('homepage' in minimal.project, false);
  assert.ok(minimal.project.administrators);
  assert.ok(minimal.repository.security.assessments.self);
  assert.deepEqual(errorsFor(full, true), []);
});

test('minimal child output retains project source and repository but no project', () => {
  const child = readExample('example-multi-repository-project-reuse.yml');
  YamlExport.init(schema);
  const minimal = YamlExport.getExportData(child, true);

  assert.equal(
    minimal.header['project-si-source'],
    child.header['project-si-source']
  );
  assert.ok(minimal.repository);
  assert.equal('project' in minimal, false);
  assert.deepEqual(errorsFor(child, true), []);
});

test('document-level project and repository conditions are enforced', () => {
  const full = readExample('example-minimum.yml');
  const parentOnly = clone(full);
  delete parentOnly.repository;
  assert.deepEqual(errorsFor(parentOnly), []);

  const sourceAndProject = clone(full);
  sourceAndProject.header['project-si-source'] = 'https://example.com/parent.yml';
  assert.ok(errorsFor(sourceAndProject).some(error =>
    error.path === 'project' && /must be omitted/.test(error.message)
  ));

  const childWithoutRepository = clone(full);
  childWithoutRepository.header['project-si-source'] =
    'https://example.com/parent.yml';
  delete childWithoutRepository.project;
  delete childWithoutRepository.repository;
  assert.ok(errorsFor(childWithoutRepository).some(error =>
    error.path === 'repository' && /is required/.test(error.message)
  ));

  const neither = clone(full);
  delete neither.project;
  delete neither.repository;
  assert.ok(errorsFor(neither).some(error =>
    error.path === 'project' && /is required/.test(error.message)
  ));
});

test('unknown fields survive normal output and are recursively rejected', () => {
  const data = readExample('example-full.yml');
  data.repository.security.tools[0].integration.unexpected = '';
  YamlExport.init(schema);
  const cleaned = YamlExport.getExportData(data, false);

  assert.equal(
    cleaned.repository.security.tools[0].integration.unexpected,
    ''
  );
  assert.ok(errorsFor(data).some(error =>
    error.path ===
      'repository.security.tools[0].integration.unexpected'
    && /Unknown field/.test(error.message)
  ));
});

test('dates, strings, patterns, and invalid schema regexes are validated', () => {
  const data = readExample('example-minimum.yml');
  data.header['last-updated'] = new Date('2025-03-01T00:00:00Z');
  data.header.url = 42;
  const errors = errorsFor(data);
  assert.ok(errors.some(error =>
    error.path === 'header.last-updated' && /date string/.test(error.message)
  ));
  assert.ok(errors.some(error =>
    error.path === 'header.url' && /string/.test(error.message)
  ));

  const invalidPatternSchema = CueParser.createSchema({
    '#SecurityInsights': {
      kind: 'struct',
      fields: {
        value: {
          optional: false,
          kind: 'primitive',
          type: 'string',
          pattern: '['
        }
      }
    }
  });
  YamlExport.init(invalidPatternSchema);
  YamlExport.setFormData({ value: 'x' });
  assert.ok(YamlExport.validate().some(error =>
    /Schema validation error: invalid pattern/.test(error.message)
  ));
});

test('ruleset disjunction validates each allowed array shape', () => {
  const data = readExample('example-full.yml');
  const rulesets = data.repository.security.tools[0].rulesets;

  rulesets.splice(0, rulesets.length, 'default');
  assert.deepEqual(errorsFor(data), []);

  rulesets.splice(0, rulesets.length, 'custom', 'strict');
  assert.deepEqual(errorsFor(data), []);

  rulesets.splice(0);
  assert.deepEqual(errorsFor(data), []);

  rulesets.push(12);
  assert.ok(errorsFor(data).some(error =>
    error.path === 'repository.security.tools[0].rulesets'
  ));
});

test('required empty containers survive cleaning when allowed by the schema', () => {
  const data = readExample('example-full.yml');
  const tool = data.repository.security.tools[0];
  tool.rulesets = [];
  tool.results = {};

  YamlExport.init(schema);
  const cleaned = YamlExport.getExportData(data, false);

  assert.deepEqual(cleaned.repository.security.tools[0].rulesets, []);
  assert.deepEqual(cleaned.repository.security.tools[0].results, {});
  assert.deepEqual(errorsFor(data), []);
});

test('quick-start scaffolding has no unknown fields and reports fillable gaps', () => {
  const data = EditorUtils.createFreshDocument(
    schema.version,
    '2026-08-10',
    {
      name: 'Maintainer',
      email: 'maintainer@example.com',
      affiliation: ''
    }
  );
  const errors = errorsFor(data);
  assert.equal(errors.some(error => /Unknown field/.test(error.message)), false);
  assert.ok(errors.some(error => error.path === 'project.name'));
  assert.ok(errors.some(error => error.path === 'project.repositories'));
  assert.ok(errors.some(error => error.path === 'repository.url'));
});

test('generated comments preserve document versions without fabricating defaults', () => {
  const data = readExample('example-minimum.yml');
  data.header['schema-version'] = '9.8.7';
  YamlExport.init(schema);
  assert.match(YamlExport.generateYaml(data), /# Schema version: 9\.8\.7/);

  const unknownVersionSchema = CueParser.parse(schemaSource);
  const withoutVersion = clone(data);
  delete withoutVersion.header['schema-version'];
  YamlExport.init(unknownVersionSchema);
  assert.doesNotMatch(YamlExport.generateYaml(withoutVersion), /# Schema version:/);
});
