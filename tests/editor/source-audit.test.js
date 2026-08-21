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

test('editor exposes keyboard navigation and validation semantics', () => {
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
  const styles = fs.readFileSync(
    path.join(root, 'docs/editor/css/editor.css'),
    'utf8'
  );

  assert.match(page, /class="mode-selector" role="tablist"/);
  assert.match(page, /<details aria-label="Editor configuration">/);
  assert.match(page, /id="mode-form"[^>]*role="tab"[^>]*aria-selected="true"/);
  assert.match(page, /id="status-text" role="status" aria-live="polite"/);
  assert.match(page, /id="wizard-progress" aria-label="Wizard progress"/);
  assert.match(
    page,
    /id="yaml-output" tabindex="0"[\s\S]*aria-label="Generated YAML preview"/
  );
  assert.match(
    page,
    /id="error-panel" role="region"[\s\S]*aria-labelledby="validation-errors-heading"/
  );
  assert.match(app, /event\.key === 'ArrowRight'/);
  assert.match(app, /setAttribute\('aria-selected'/);
  assert.match(app, /ValidationAccessibility\.markTarget\(field, message\.id\)/);
  assert.match(app, /ValidationAccessibility\.getOwnedMessage\(element\)/);
  assert.match(app, /ValidationAccessibility\.getScrollBehavior\(prefersReducedMotion\)/);
  assert.match(app, /toast\.setAttribute\('role', type === 'error' \? 'alert' : 'status'\)/);
  assert.match(app, /target\.element\.focus\(\{ preventScroll: true \}\)/);
  assert.match(app, /Wizard\.getStepIndexForPath\(path\)/);
  assert.match(form, /toggle\.setAttribute\('aria-controls', contentId\)/);
  assert.match(form, /toggle\.type = 'button'/);
  assert.doesNotMatch(form, /setAttribute\('role', 'button'\)/);
  assert.match(form, /container\.setAttribute\('aria-labelledby', heading\.id\)/);
  assert.match(wizard, /className = 'wizard-progress-list'/);
  assert.match(wizard, /setAttribute\('aria-current', 'step'\)/);
  assert.match(styles, /:focus-visible/);
  assert.match(
    styles,
    /\.wizard-progress-item:last-child \.wizard-step::after/
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
