#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

function extractPrompt(document) {
  let inSection = false;
  let headingCount = 0;
  let fence = null;
  let inComment = false;
  let copying = false;
  let prompt = null;

  // Ignore examples and HTML comments rather than accepting a hidden prompt.
  for (const line of document.replace(/\r\n/g, '\n').split('\n')) {
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if (fence) {
      if (marker && marker[1][0] === fence[0]
          && marker[1].length >= fence.length && marker[2].trim() === '') {
        if (copying && line !== '```') {
          throw new Error('The copyable prompt must close with exactly ```.');
        }
        fence = null;
        copying = false;
      } else if (copying) {
        prompt.push(line);
      }
      continue;
    }
    const wasInComment = inComment;
    for (const delimiter of line.matchAll(/<!--|-->/g)) {
      if (delimiter[0] === '<!--') inComment = true;
      else inComment = false;
    }
    if (wasInComment || line.includes('<!--')) continue;
    if (/^##(?: |$)/.test(line)) {
      inSection = line === '## Copy-paste prompt';
      if (inSection) headingCount += 1;
      continue;
    }
    if (marker) {
      fence = marker[1];
      copying = inSection;
      if (copying) {
        if (line !== '```text' || prompt !== null) {
          throw new Error('Expected exactly one fenced text block in Copy-paste prompt.');
        }
        prompt = [];
      }
    } else if (inSection && line.trim() !== '') {
      throw new Error('Copy-paste prompt must contain only its fenced text block.');
    }
  }
  if (fence || inComment || headingCount !== 1 || prompt === null) {
    throw new Error('Missing, duplicate, or unclosed Copy-paste prompt section/block.');
  }
  return prompt.join('\n');
}

function declaration(prompt, name, format) {
  const lines = prompt.split('\n').filter(line =>
    new RegExp(`^\\W*${name}\\b`, 'i').test(line)
  );
  const match = lines.length === 1
    ? new RegExp(`^${name}: (${format})$`).exec(lines[0])
    : null;
  if (!match) {
    throw new Error(`Expected one well-formed ${name}: declaration inside the prompt.`);
  }
  return match[1];
}

function checkPrompt({ document, version, schema }) {
  const prompt = extractPrompt(document);
  const specVersion = declaration(prompt, 'SPEC_VERSION', 'v?[1-9]\\d*\\.\\d+\\.\\d+');
  declaration(
    prompt,
    'SCHEMA_URL',
    'https://raw\\.githubusercontent\\.com/ossf/security-insights/[0-9a-f]{40}/spec/schema\\.cue'
  );
  const checksum = declaration(prompt, 'SCHEMA_SHA256', '[0-9a-f]{64}');

  if (specVersion !== version.replace(/(?:\r?\n)+$/, '')) {
    throw new Error('SPEC_VERSION must exactly match VERSION, including any leading v.');
  }
  if (checksum !== createHash('sha256').update(schema).digest('hex')) {
    throw new Error('SCHEMA_SHA256 does not match the bytes of spec/schema.cue.');
  }
  if ((prompt.match(/\bv?\d+\.\d+\.\d+\b/g) || []).length !== 1) {
    throw new Error('Declare the version only once; reuse SPEC_VERSION in the instructions.');
  }
  for (const instruction of [
    'Create a standalone OpenSSF Security Insights DRAFT targeting SPEC_VERSION.',
    'For header.schema-version, use SPEC_VERSION with its leading "v" removed, if present.',
    'Emit that value as a quoted string, not the literal name SPEC_VERSION.',
    'header: schema-version derived from SPEC_VERSION as above;'
  ]) {
    if (!prompt.split('\n').includes(instruction)) {
      throw new Error('The draft target and header must use the SPEC_VERSION derivation instructions.');
    }
  }
}

if (require.main === module) {
  const root = path.resolve(__dirname, '..');
  try {
    checkPrompt({
      document: fs.readFileSync(path.join(root, 'docs', 'LLM_PROMPT.md'), 'utf8'),
      version: fs.readFileSync(path.join(root, 'VERSION'), 'utf8'),
      schema: fs.readFileSync(path.join(root, 'spec', 'schema.cue'))
    });
    console.log('LLM prompt specification pins are current.');
  } catch (error) {
    console.error(`LLM prompt drift check failed: ${error.message}`);
    console.error(
      'Review docs/LLM_PROMPT.md field shapes and instructions against VERSION and '
      + 'spec/schema.cue. After review, update SPEC_VERSION, the immutable SCHEMA_URL '
      + 'and SCHEMA_SHA256; verify the URL bytes, then rerun make test-llm-prompt. '
      + 'Do not blindly bump metadata.'
    );
    process.exitCode = 1;
  }
}

module.exports = { checkPrompt };
