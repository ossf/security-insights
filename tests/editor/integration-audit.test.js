'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const assert = require('node:assert/strict');
const yaml = require('js-yaml');
const CueParser = require('../../docs/editor/js/cue-parser.js');
const EditorUtils = require('../../docs/editor/js/editor-utils.js');
const YamlExport = require('../../docs/editor/js/yaml-export.js');
const SchemaFallback = require('../../docs/editor/js/schema-fallback.js');

const root = path.resolve(__dirname, '..', '..');

test('generated fallback schema is current', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/generate-schema-fallback.js', '--check'],
    { cwd: root, encoding: 'utf8' }
  );
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);

  const source = fs.readFileSync(path.join(root, 'spec/schema.cue'), 'utf8');
  const version = fs.readFileSync(path.join(root, 'VERSION'), 'utf8').trim();
  const parsed = CueParser.parse(source, { version });
  assert.equal(SchemaFallback.version, version.replace(/^v/, ''));
  assert.deepEqual(SchemaFallback.types, parsed.types);
});

test('editor source avoids user-data innerHTML and wires secure script loading', () => {
  const app = fs.readFileSync(path.join(root, 'docs/editor/js/app.js'), 'utf8');
  const form = fs.readFileSync(
    path.join(root, 'docs/editor/js/form-builder.js'),
    'utf8'
  );
  const wizard = fs.readFileSync(
    path.join(root, 'docs/editor/js/wizard.js'),
    'utf8'
  );
  const page = fs.readFileSync(path.join(root, 'docs/editor/index.html'), 'utf8');

  assert.doesNotMatch(`${app}\n${form}\n${wizard}`, /\.innerHTML\s*=/);
  assert.doesNotMatch(app, /jsyaml\.load/);
  assert.match(app, /EditorUtils\.parseYamlDocument/);
  assert.match(
    page,
    /integrity="sha384-S9ICdlb\+JXmKnf3zbM1G\+PBNWbhB7ARTUpJyvroFrHHHR8JsKt4oO\+kPyfzbT\+TM"/
  );
  assert.match(page, /crossorigin="anonymous"/);
  assert.match(page, /class="editor-main hidden"/);
  assert.ok(
    page.indexOf('/editor/js/editor-utils.js')
      < page.indexOf('/editor/js/cue-parser.js')
  );
});

const cueAvailable = spawnSync('cue', ['version'], {
  cwd: root,
  encoding: 'utf8'
}).status === 0;

test(
  'generated example exports pass cue vet when CUE is available',
  { skip: !cueAvailable },
  () => {
    const scratch = fs.mkdtempSync(path.join(root, '.editor-test-'));
    try {
      const schemaSource = fs.readFileSync(
        path.join(root, 'spec/schema.cue'),
        'utf8'
      );
      const schema = CueParser.parse(schemaSource, { version: '2.2.0' });
      YamlExport.init(schema);

      for (const name of fs.readdirSync(path.join(root, 'examples'))) {
        if (!name.endsWith('.yml') && !name.endsWith('.yaml')) {
          continue;
        }
        const data = EditorUtils.parseYamlDocument(
          fs.readFileSync(path.join(root, 'examples', name), 'utf8'),
          yaml
        );
        YamlExport.setFormData(data);
        YamlExport.setMinimalMode(false);
        const outputPath = path.join(scratch, name);
        fs.writeFileSync(outputPath, YamlExport.generateYaml());
        const result = spawnSync(
          'cue',
          ['vet', '-d', '#SecurityInsights', './spec', outputPath],
          { cwd: root, encoding: 'utf8' }
        );
        assert.equal(
          result.status,
          0,
          `${name}\n${result.stdout}\n${result.stderr}`
        );
      }
    } finally {
      fs.rmSync(scratch, { recursive: true, force: true });
    }
  }
);
