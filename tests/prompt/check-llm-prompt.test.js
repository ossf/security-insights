'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const assert = require('node:assert/strict');
const { checkPrompt } = require('../../scripts/check-llm-prompt.js');

const root = path.resolve(__dirname, '..', '..');
const document = fs.readFileSync(path.join(root, 'docs/LLM_PROMPT.md'), 'utf8');
const version = fs.readFileSync(path.join(root, 'VERSION'), 'utf8');
const schema = fs.readFileSync(path.join(root, 'spec/schema.cue'));
const inputs = { document, version, schema };
const block = /```text\n([\s\S]*?)\n```/.exec(document)[0];
const metadata = block.split('\n').slice(1, 4).join('\n');

test('current copyable prompt matches VERSION and the local schema', () => {
  assert.doesNotThrow(() => checkPrompt(inputs));
});

test('normal newlines are accepted, but the leading v is not trimmed', () => {
  for (const ending of ['', '\n', '\r\n', '\n\n']) {
    assert.doesNotThrow(() => checkPrompt({
      ...inputs,
      document: document.replace(/\n/g, '\r\n'),
      version: version.trim() + ending
    }));
  }
  const otherPrefix = version.startsWith('v')
    ? version.trim().slice(1)
    : `v${version.trim()}`;
  assert.throws(() => checkPrompt({ ...inputs, version: otherPrefix }), /exactly match VERSION/);
  assert.throws(() => checkPrompt({
    ...inputs,
    document: document.replace(`SPEC_VERSION: ${version.trim()}`, `SPEC_VERSION: ${otherPrefix}`)
  }), /exactly match VERSION/);
});

for (const [name, change, error] of [
  ['version bump', { version: 'v99.0.0\n' }, /exactly match VERSION/],
  ['version substring', { version: `${version.trim()}-dev\n` }, /exactly match VERSION/],
  ['version whitespace', { version: `${version.trim()} \n` }, /exactly match VERSION/],
  ['schema-byte change', { schema: Buffer.concat([schema, Buffer.from('\n')]) }, /does not match the bytes/],
  ['schema line-ending change', { schema: Buffer.from(schema.toString().replace(/\n/g, '\r\n')) }, /does not match the bytes/],
  ['missing prompt', { document: '# No prompt\n' }, /Missing, duplicate, or unclosed/],
  ['missing heading', { document: document.replace('## Copy-paste prompt', '## Removed') }, /Missing, duplicate, or unclosed/],
  ['duplicate heading', { document: `${document}\n## Copy-paste prompt\n${block}\n` }, /exactly one|Missing, duplicate/],
  ['duplicate block', { document: document.replace(block, `${block}\n${block}`) }, /exactly one/],
  ['wrong fence type', { document: document.replace('```text', '```yaml') }, /exactly one/],
  ['missing closing fence', { document: document.replace(`${block}\n`, `${block.slice(0, -3)}\n`) }, /exactly one|unclosed|only its fenced/],
  ['malformed closing fence', { document: document.replace(block, `${block}\``) }, /close with exactly/],
  ['empty prompt', { document: document.replace(block, '```text\n```') }, /SPEC_VERSION/],
  ['prose instead of block', { document: document.replace(block, metadata) }, /only its fenced/],
  ['repeated version literal', { document: document.replace('DRAFT targeting SPEC_VERSION.', `DRAFT targeting ${version.trim()}.`) }, /Declare the version only once/],
  ['missing draft target reference', { document: document.replace('DRAFT targeting SPEC_VERSION.', 'DRAFT.') }, /derivation instructions/],
  ['missing header derivation', { document: document.replace('with its leading "v" removed, if present.', 'unchanged.') }, /derivation instructions/],
  ['literal header token', { document: document.replace('Emit that value as a quoted string, not the literal name SPEC_VERSION.', 'Emit SPEC_VERSION literally.') }, /derivation instructions/],
  ['missing header shape reference', { document: document.replace('header: schema-version derived from SPEC_VERSION as above;', 'header: schema-version;') }, /derivation instructions/]
]) {
  test(`rejects ${name}`, () => {
    assert.throws(() => checkPrompt({ ...inputs, ...change }), error);
  });
}

for (const name of ['SPEC_VERSION', 'SCHEMA_URL', 'SCHEMA_SHA256']) {
  const line = new RegExp(`^${name}: .+$`, 'm').exec(document)[0];
  for (const [kind, replacement] of [
    ['missing', ''],
    ['duplicate', `${line}\n${line}`],
    ['indented duplicate', `${line}\n  ${line}`],
    ['malformed duplicate', `${line}\n${line.replace(': ', '=')}`],
    ['quoted-key duplicate', `${line}\n${line.replace(name, `"${name}"`)}`],
    ['lowercase-key duplicate', `${line}\n${line.replace(name, name.toLowerCase())}`],
    ['wrong separator', line.replace(': ', '=')],
    ['empty value', `${name}: `],
    ['trailing comment', `${line} # comment`],
    ['trailing whitespace', `${line} `],
    ['quoted value', `${name}: "${line.slice(name.length + 2)}"`]
  ]) {
    test(`rejects ${kind} ${name} declaration`, () => {
      assert.throws(() => checkPrompt({
        ...inputs,
        document: document.replace(line, replacement)
      }), new RegExp(`well-formed ${name}`));
    });
  }
}

for (const [name, badValue] of [
  ['SPEC_VERSION', 'v2.2'],
  ['SPEC_VERSION', 'v2.2.0-dev'],
  ['SCHEMA_URL', 'https://raw.githubusercontent.com/ossf/security-insights/main/spec/schema.cue'],
  ['SCHEMA_URL', 'https://raw.githubusercontent.com/ossf/security-insights/latest/spec/schema.cue'],
  ['SCHEMA_URL', 'https://raw.githubusercontent.com/ossf/security-insights/801ec47/spec/schema.cue'],
  ['SCHEMA_URL', `https://example.com/ossf/security-insights/${'a'.repeat(40)}/spec/schema.cue`],
  ['SCHEMA_URL', `https://raw.githubusercontent.com/other/security-insights/${'a'.repeat(40)}/spec/schema.cue`],
  ['SCHEMA_SHA256', 'a'.repeat(63)],
  ['SCHEMA_SHA256', 'G'.repeat(64)]
]) {
  test(`rejects malformed ${name} value ${badValue}`, () => {
    assert.throws(() => checkPrompt({
      ...inputs,
      document: document.replace(new RegExp(`^${name}: .+$`, 'm'), `${name}: ${badValue}`)
    }), new RegExp(`well-formed ${name}`));
  });
}

test('metadata outside the copyable prompt cannot supply missing declarations', () => {
  const outside = `${metadata}\n\`\`\`text\n${metadata}\n\`\`\`\n`;
  assert.doesNotThrow(() => checkPrompt({ ...inputs, document: outside + document }));
  assert.throws(() => checkPrompt({
    ...inputs,
    document: outside + document.replace(metadata, '')
  }), /well-formed SPEC_VERSION/);
});

test('an example containing a fake prompt heading is not the copyable prompt', () => {
  const example = `\`\`\`\`markdown\n## Copy-paste prompt\n${block}\n\`\`\`\`\n`;
  assert.throws(() => checkPrompt({ ...inputs, document: example }), /Missing, duplicate/);
  assert.doesNotThrow(() => checkPrompt({ ...inputs, document: example + document }));
});

test('HTML comments cannot supply the copyable prompt', () => {
  const commented = `<!--\n${document}\n-->\n`;
  assert.throws(() => checkPrompt({ ...inputs, document: commented }), /Missing, duplicate/);
  assert.throws(() => checkPrompt({ ...inputs, document: `<!--\n${document}` }), /unclosed/);
  assert.doesNotThrow(() => checkPrompt({ ...inputs, document: commented + document }));
});

test('Make entrypoint fails closed with actionable errors and never edits inputs', t => {
  const scratch = fs.mkdtempSync(path.join(root, '.prompt-test-'));
  t.after(() => fs.rmSync(scratch, { recursive: true, force: true }));
  const files = ['Makefile', 'scripts/check-llm-prompt.js', 'docs/LLM_PROMPT.md', 'VERSION', 'spec/schema.cue'];
  for (const file of files) {
    const destination = path.join(scratch, file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(root, file), destination);
  }
  const run = () => spawnSync('make', ['check-llm-prompt'], { cwd: scratch, encoding: 'utf8' });
  const good = run();
  assert.equal(good.status, 0, good.stderr);
  assert.match(good.stdout, /pins are current/);

  for (const [file, content, error] of [
    ['VERSION', 'v99.0.0\n', /exactly match VERSION/],
    ['spec/schema.cue', Buffer.concat([schema, Buffer.from('\n')]), /does not match the bytes/],
    ['docs/LLM_PROMPT.md', '# Missing prompt\n', /Missing, duplicate/],
    ['docs/LLM_PROMPT.md', null, /ENOENT/],
    ['VERSION', null, /ENOENT/],
    ['spec/schema.cue', null, /ENOENT/]
  ]) {
    const target = path.join(scratch, file);
    if (content === null) fs.unlinkSync(target);
    else fs.writeFileSync(target, content);
    const result = run();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, error);
    assert.match(result.stderr, /Review docs\/LLM_PROMPT\.md field shapes and instructions against VERSION/);
    assert.match(result.stderr, /immutable SCHEMA_URL and SCHEMA_SHA256/);
    assert.match(result.stderr, /rerun make test-llm-prompt/);
    assert.match(result.stderr, /Do not blindly bump metadata/);
    assert.doesNotMatch(result.stdout, /pins are current/);
    if (content === null) assert.equal(fs.existsSync(target), false);
    else assert.deepEqual(fs.readFileSync(target), Buffer.from(content));
    fs.copyFileSync(path.join(root, file), target);
  }
});
