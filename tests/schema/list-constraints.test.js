'use strict';

// Every element of a "list of 1 or more" field is validated, not only the first.
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

// Each field: where it lives in example-full.yml, and an element that is a
// well-formed object of the wrong shape (a typed value that does not match).
const fields = [
  {
    name: 'project.administrators',
    at: ['project', 'administrators'],
    invalid: { name: 'Eve', primary: true, email: 'not-an-email' }
  },
  {
    name: 'project.repositories',
    at: ['project', 'repositories'],
    invalid: { name: 'Bad', comment: 'x', url: 'not a url' }
  },
  {
    name: 'repository.release.distribution-points',
    at: ['repository', 'release', 'distribution-points'],
    invalid: { uri: 'https://example.com/x' }
  },
  {
    name: 'repository.core-team',
    at: ['repository', 'core-team'],
    invalid: { name: 'Eve', primary: true, email: 'not-an-email' }
  }
];

function withList(at, list) {
  const document = structuredClone(example);
  const parent = at.slice(0, -1).reduce((node, key) => node[key], document);
  parent[at[at.length - 1]] = list;
  return document;
}

function vet(document) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'si-list-'));
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

function lookup(at) {
  return at.reduce((node, key) => node[key], example);
}

test('the unmodified example validates, so the cases below differ only in the list', () => {
  const result = vet(example);
  assert.equal(result.error, undefined, 'cue must be on PATH');
  assert.equal(result.status, 0, result.stderr);
});

for (const { name, at, invalid } of fields) {
  const first = lookup(at)[0];

  test(`${name}: an empty list is rejected`, () => {
    assert.notEqual(vet(withList(at, [])).status, 0);
  });

  test(`${name}: a single valid element is accepted`, () => {
    const result = vet(withList(at, [first]));
    assert.equal(result.status, 0, result.stderr);
  });

  test(`${name}: several valid elements are accepted`, () => {
    const result = vet(withList(at, [first, structuredClone(first), structuredClone(first)]));
    assert.equal(result.status, 0, result.stderr);
  });

  test(`${name}: a second element of the wrong type is rejected`, () => {
    assert.notEqual(vet(withList(at, [first, 123])).status, 0);
  });

  test(`${name}: a second element with an invalid value is rejected`, () => {
    assert.notEqual(vet(withList(at, [first, invalid])).status, 0);
  });

  test(`${name}: an invalid element after several valid ones is rejected`, () => {
    assert.notEqual(vet(withList(at, [first, structuredClone(first), invalid])).status, 0);
  });

  test(`${name}: an invalid first element is rejected`, () => {
    assert.notEqual(vet(withList(at, [invalid, first])).status, 0);
  });
}
