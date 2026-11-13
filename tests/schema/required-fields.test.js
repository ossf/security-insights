'use strict';

// A required field whose type has only optional fields still fails when omitted.
// Needs the `cue` CLI on PATH, like `make lintyml`.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const yaml = require('js-yaml');

const root = path.resolve(__dirname, '..', '..');
const example = yaml.load(fs.readFileSync(path.join(root, 'examples', 'example-full.yml'), 'utf8'));

function vet(document) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'si-required-'));
  try {
    const file = path.join(dir, 'candidate.yml');
    fs.writeFileSync(file, yaml.dump(document));
    return spawnSync('cue', ['vet', '-d', '#SecurityInsights', './spec', file], {
      cwd: root,
      encoding: 'utf8'
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function withToolResults(results) {
  const document = structuredClone(example);
  const tool = document.repository.security.tools[0];
  if (results === undefined) {
    delete tool.results;
  } else {
    tool.results = results;
  }
  return document;
}

test('the unmodified example validates', () => {
  const result = vet(example);
  assert.equal(result.error, undefined, 'cue must be on PATH');
  assert.equal(result.status, 0, result.stderr);
});

test('repository.security.tools[].results: omitting it is rejected', () => {
  const result = vet(withToolResults(undefined));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /results: field is required but not present/);
});

test('repository.security.tools[].results: an empty object is accepted', () => {
  const result = vet(withToolResults({}));
  assert.equal(result.status, 0, result.stderr);
});
