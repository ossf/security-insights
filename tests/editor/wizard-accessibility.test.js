'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Wizard = require('../../docs/editor/js/wizard.js');
const FormBuilder = require('../../docs/editor/js/form-builder.js');
const SchemaFallback = require('../../docs/editor/js/schema-fallback.js');

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  add(...values) {
    values.forEach(value => this.values.add(value));
  }

  contains(value) {
    return this.values.has(value);
  }
}

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.attributes = new Map();
    this.classList = new FakeClassList();
    this.listeners = new Map();
    this.disabled = false;
    this.type = '';
    this.textContent = '';
  }

  set className(value) {
    this.classList = new FakeClassList();
    value.split(/\s+/).filter(Boolean).forEach(name => this.classList.add(name));
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  get firstElementChild() {
    return this.children[0] || null;
  }

  replaceChildren(...children) {
    this.children = [...children];
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) || null;
  }

  addEventListener(type, callback) {
    this.listeners.set(type, callback);
  }

  click() {
    if (!this.disabled) {
      this.listeners.get('click')?.();
    }
  }
}

test('schema regexes are translated for the HTML UnicodeSets pattern mode', () => {
  assert.equal(
    FormBuilder.toHtmlPattern('^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
    '^[A-Za-z0-9._%+\\-]+@[A-Za-z0-9.\\-]+\\.[A-Za-z]{2,}$'
  );
  assert.equal(FormBuilder.toHtmlPattern('^[1-9]+$'), '^[1-9]+$');
  assert.equal(FormBuilder.toHtmlPattern('['), null);
});

test('every bundled schema pattern is compatible with native HTML validation', () => {
  const patterns = [];
  const visit = value => {
    if (!value || typeof value !== 'object') {
      return;
    }
    if (typeof value.pattern === 'string') {
      patterns.push(value.pattern);
    }
    Object.values(value).forEach(visit);
  };
  visit(SchemaFallback.types);

  assert.ok(patterns.length > 0);
  for (const pattern of patterns) {
    assert.notEqual(
      FormBuilder.toHtmlPattern(pattern),
      null,
      `HTML pattern is incompatible: ${pattern}`
    );
  }
});

test('wizard progress uses native buttons and exposes the current step', () => {
  const previousDocument = global.document;
  global.document = {
    createElement: tagName => new FakeElement(tagName)
  };

  try {
    const actions = [];
    Wizard.init({}, (_data, action) => actions.push(action));
    Wizard.goToStep(2);
    const container = new FakeElement('div');

    Wizard.buildProgress(container);

    const list = container.firstElementChild;
    const progressSteps = list.children.map(item => item.firstElementChild);
    assert.equal(list.tagName, 'OL');
    assert.equal(progressSteps.length, Wizard.getTotalSteps());
    assert.deepEqual(
      progressSteps.map(step => step.tagName),
      ['BUTTON', 'BUTTON', 'SPAN', 'SPAN', 'SPAN', 'SPAN']
    );
    assert.equal(progressSteps[2].getAttribute('aria-current'), null);
    assert.equal(list.children[2].getAttribute('aria-current'), 'step');
    assert.deepEqual(
      progressSteps.map(step => step.children[0].textContent),
      Wizard.steps.map((step, index) => {
        if (index === 2) {
          return `Step ${index + 1}: ${step.title}`;
        }
        const status = index < 2 ? 'completed' : 'upcoming';
        return `Step ${index + 1}: ${step.title}, ${status}`;
      })
    );
    assert.equal(Wizard.getStepIndexForPath('header.url'), 0);
    assert.equal(Wizard.getStepIndexForPath('project.name'), 1);
    assert.equal(Wizard.getStepIndexForPath('repository.security.tools[0]'), 4);
    assert.equal(Wizard.getStepIndexForPath('unknown.path'), -1);

    progressSteps[0].click();
    assert.equal(Wizard.getCurrentStep(), 0);
    assert.deepEqual(actions, ['navigate']);

    progressSteps[3].click();
    assert.equal(Wizard.getCurrentStep(), 0);
    assert.deepEqual(actions, ['navigate']);
  } finally {
    global.document = previousDocument;
  }
});
