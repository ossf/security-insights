'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

test('changing a child project source clears inherited project context', () => {
  const app = fs.readFileSync(
    path.resolve(__dirname, '../../docs/editor/js/app.js'),
    'utf8'
  );

  assert.match(
    app,
    /getProjectSource\(data\) !== getProjectSource\(state\.exportData\)/
  );
  assert.match(
    app,
    /data = EditorUtils\.createExportData\(data, state\.readOnlyPaths\);[\s\S]*state\.readOnlyPaths = \[\];[\s\S]*rebuildActiveMode\(\);/
  );
});
