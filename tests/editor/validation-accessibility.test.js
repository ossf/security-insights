'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const ValidationAccessibility = require(
  '../../docs/editor/js/validation-accessibility.js'
);

const DIRECT_SELECTOR = ':scope > input, :scope > textarea, :scope > select';
const ARRAY_SELECTOR = ':scope > .array-field-header button';
const MESSAGE_SELECTOR = ':scope > [data-validation-error]';

class FakeElement {
  constructor({ path = '', matches = {}, attributes = {} } = {}) {
    this.dataset = path ? { path } : {};
    this.matches = matches;
    this.attributes = new Map(Object.entries(attributes));
    this.classes = new Set();
    this.classList = {
      add: value => this.classes.add(value),
      remove: value => this.classes.delete(value)
    };
  }

  querySelector(selector) {
    return this.matches[selector] || null;
  }

  hasAttribute(name) {
    return this.attributes.has(name);
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  set tabIndex(value) {
    this.attributes.set('tabindex', String(value));
  }
}

test('groups every validation message by its exact path in stable order', () => {
  assert.deepEqual(ValidationAccessibility.groupErrors(), []);
  assert.deepEqual(
    ValidationAccessibility.groupErrors([
      { path: 'project.name', message: 'is required' },
      { path: 'header.url', message: 'must be a URL' },
      { path: 'project.name', message: 'is too short' },
      { message: 'document is invalid' }
    ]),
    [
      { path: 'project.name', messages: ['is required', 'is too short'] },
      { path: 'header.url', messages: ['must be a URL'] },
      { path: '', messages: ['document is invalid'] }
    ]
  );
});

test('only returns a validation message owned directly by the field', () => {
  const message = new FakeElement();
  const field = new FakeElement({ matches: { [MESSAGE_SELECTOR]: message } });
  assert.equal(ValidationAccessibility.getOwnedMessage(field), message);
  assert.equal(ValidationAccessibility.getOwnedMessage(new FakeElement()), null);
  assert.equal(ValidationAccessibility.getOwnedMessage(null), null);
  assert.equal(ValidationAccessibility.getOwnedMessage({}), null);
});

test('direct value controls receive invalid state and preserve descriptions', () => {
  const input = new FakeElement({ attributes: { 'aria-describedby': 'existing' } });
  const field = new FakeElement({ matches: { [DIRECT_SELECTOR]: input } });

  assert.deepEqual(
    ValidationAccessibility.prepareTarget(field),
    { element: input, supportsInvalid: true }
  );
  assert.equal(ValidationAccessibility.markTarget(field, 'error-1'), input);
  assert.equal(input.getAttribute('aria-invalid'), 'true');
  assert.equal(input.getAttribute('aria-describedby'), 'existing error-1');

  ValidationAccessibility.markTarget(field, 'error-1');
  assert.equal(input.getAttribute('aria-describedby'), 'existing error-1');
  ValidationAccessibility.clearTarget(field, 'error-1');
  assert.equal(input.getAttribute('aria-invalid'), null);
  assert.equal(input.getAttribute('aria-describedby'), 'existing');
});

test('direct controls restore pre-existing invalid semantics', () => {
  const input = new FakeElement({ attributes: { 'aria-invalid': 'grammar' } });
  const field = new FakeElement({ matches: { [DIRECT_SELECTOR]: input } });

  ValidationAccessibility.markTarget(field, 'error-1');
  assert.equal(input.getAttribute('aria-invalid'), 'true');

  ValidationAccessibility.clearTarget(field, 'error-1');
  assert.equal(input.getAttribute('aria-invalid'), 'grammar');
  assert.equal(input.dataset.validationOwnsInvalid, undefined);
});

test('array actions are described but never represented as invalid values', () => {
  const button = new FakeElement();
  const field = new FakeElement({ matches: { [ARRAY_SELECTOR]: button } });

  assert.equal(ValidationAccessibility.markTarget(field, 'array-error'), button);
  assert.equal(button.getAttribute('aria-invalid'), null);
  assert.equal(button.getAttribute('aria-describedby'), 'array-error');
  ValidationAccessibility.clearTarget(field, 'array-error');
  assert.equal(button.getAttribute('aria-describedby'), null);

  assert.doesNotThrow(() => ValidationAccessibility.clearTarget(field, 'missing-error'));
});

test('structural errors create and fully remove an accessible validation group', () => {
  const field = new FakeElement({ path: 'project.repositories[0].core-team' });

  assert.equal(ValidationAccessibility.markTarget(field, 'group-error'), field);
  assert.equal(field.getAttribute('role'), 'group');
  assert.equal(
    field.getAttribute('aria-label'),
    'project repositories core team validation group'
  );
  assert.equal(field.getAttribute('tabindex'), '-1');
  assert.equal(field.getAttribute('aria-invalid'), null);
  assert.equal(field.getAttribute('aria-describedby'), 'group-error');
  assert.equal(field.classes.has('validation-group-error'), true);

  ValidationAccessibility.clearTarget(field, 'group-error');
  assert.equal(field.getAttribute('role'), null);
  assert.equal(field.getAttribute('aria-label'), null);
  assert.equal(field.getAttribute('tabindex'), null);
  assert.equal(field.getAttribute('aria-invalid'), null);
  assert.equal(field.getAttribute('aria-describedby'), null);
  assert.equal(field.classes.has('validation-group-error'), false);
  assert.deepEqual(field.dataset, { path: 'project.repositories[0].core-team' });
});

test('structural errors preserve author-provided group semantics', () => {
  const field = new FakeElement({
    attributes: {
      role: 'group',
      'aria-labelledby': 'group-heading',
      tabindex: '0',
      'aria-describedby': 'group-help'
    }
  });

  ValidationAccessibility.markTarget(field, 'group-error');
  assert.equal(field.getAttribute('aria-label'), null);
  ValidationAccessibility.clearTarget(field, 'group-error');
  assert.equal(field.getAttribute('role'), 'group');
  assert.equal(field.getAttribute('aria-labelledby'), 'group-heading');
  assert.equal(field.getAttribute('tabindex'), '0');
  assert.equal(field.getAttribute('aria-describedby'), 'group-help');
});

test('structural errors preserve an author-provided accessible label', () => {
  const field = new FakeElement({ attributes: { 'aria-label': 'Repository entries' } });
  ValidationAccessibility.markTarget(field, 'group-error');
  assert.equal(field.getAttribute('role'), 'group');
  assert.equal(field.getAttribute('aria-label'), 'Repository entries');
  ValidationAccessibility.clearTarget(field, 'group-error');
  assert.equal(field.getAttribute('role'), null);
  assert.equal(field.getAttribute('aria-label'), 'Repository entries');
});

test('structural fallback names an empty path as the document group', () => {
  const field = new FakeElement();
  ValidationAccessibility.prepareTarget(field);
  assert.equal(field.getAttribute('aria-label'), 'document validation group');

  const punctuationOnlyPath = new FakeElement({ path: '...' });
  ValidationAccessibility.prepareTarget(punctuationOnlyPath);
  assert.equal(
    punctuationOnlyPath.getAttribute('aria-label'),
    'document validation group'
  );
});

test('invalid targets are handled safely', () => {
  assert.equal(ValidationAccessibility.prepareTarget(null), null);
  assert.equal(ValidationAccessibility.prepareTarget({}), null);
  assert.equal(ValidationAccessibility.markTarget(null, 'error'), null);
  assert.doesNotThrow(() => ValidationAccessibility.clearTarget(null, 'error'));
});

test('scroll behavior respects the reduced-motion preference', () => {
  assert.equal(ValidationAccessibility.getScrollBehavior(true), 'auto');
  assert.equal(ValidationAccessibility.getScrollBehavior(false), 'smooth');
});
