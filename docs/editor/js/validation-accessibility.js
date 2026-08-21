/**
 * Accessible validation helpers shared by the form and wizard renderers.
 */
const ValidationAccessibility = (function () {
  'use strict';

  const DIRECT_CONTROL_SELECTOR =
    ':scope > input, :scope > textarea, :scope > select';
  const ARRAY_ACTION_SELECTOR = ':scope > .array-field-header button';
  const OWNED_MESSAGE_SELECTOR = ':scope > [data-validation-error]';

  function groupErrors(errors = []) {
    const groups = new Map();
    for (const error of errors) {
      const path = error.path || '';
      if (!groups.has(path)) {
        groups.set(path, []);
      }
      groups.get(path).push(error.message);
    }
    return Array.from(groups, ([path, messages]) => ({ path, messages }));
  }

  function getOwnedMessage(field) {
    return field && typeof field.querySelector === 'function'
      ? field.querySelector(OWNED_MESSAGE_SELECTOR)
      : null;
  }

  function toGroupLabel(path) {
    const words = String(path || 'document')
      .replace(/\[\d+\]/g, ' ')
      .replace(/[._-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return `${words || 'document'} validation group`;
  }

  function prepareTarget(field) {
    if (!field || typeof field.querySelector !== 'function') {
      return null;
    }

    const directControl = field.querySelector(DIRECT_CONTROL_SELECTOR);
    if (directControl) {
      return { element: directControl, supportsInvalid: true };
    }

    const arrayAction = field.querySelector(ARRAY_ACTION_SELECTOR);
    if (arrayAction) {
      return { element: arrayAction, supportsInvalid: false };
    }

    if (!field.hasAttribute('role')) {
      field.setAttribute('role', 'group');
      field.dataset.validationInjectedRole = 'true';
    }
    if (!field.hasAttribute('aria-label') && !field.hasAttribute('aria-labelledby')) {
      field.setAttribute('aria-label', toGroupLabel(field.dataset.path));
      field.dataset.validationInjectedLabel = 'true';
    }
    if (!field.hasAttribute('tabindex')) {
      field.tabIndex = -1;
      field.dataset.validationInjectedFocus = 'true';
    }
    return { element: field, supportsInvalid: false };
  }

  function addDescribedBy(element, id) {
    const ids = new Set((element.getAttribute('aria-describedby') || '').split(/\s+/));
    ids.delete('');
    ids.add(id);
    element.setAttribute('aria-describedby', Array.from(ids).join(' '));
  }

  function removeDescribedBy(element, id) {
    const ids = (element.getAttribute('aria-describedby') || '')
      .split(/\s+/)
      .filter(value => value && value !== id);
    if (ids.length > 0) {
      element.setAttribute('aria-describedby', ids.join(' '));
    } else {
      element.removeAttribute('aria-describedby');
    }
  }

  function markTarget(field, messageId) {
    const target = prepareTarget(field);
    if (!target) {
      return null;
    }
    if (target.supportsInvalid) {
      if (!target.element.dataset.validationOwnsInvalid) {
        target.element.dataset.validationOwnsInvalid = 'true';
        target.element.dataset.validationHadInvalid = String(
          target.element.hasAttribute('aria-invalid')
        );
        if (target.element.hasAttribute('aria-invalid')) {
          target.element.dataset.validationOriginalInvalid =
            target.element.getAttribute('aria-invalid');
        }
      }
      target.element.setAttribute('aria-invalid', 'true');
    } else if (target.element === field) {
      field.classList.add('validation-group-error');
    }
    addDescribedBy(target.element, messageId);
    return target.element;
  }

  function clearTarget(field, messageId) {
    const target = prepareTarget(field);
    if (!target) {
      return;
    }
    if (target.element.dataset.validationOwnsInvalid === 'true') {
      if (target.element.dataset.validationHadInvalid === 'true') {
        target.element.setAttribute(
          'aria-invalid',
          target.element.dataset.validationOriginalInvalid
        );
      } else {
        target.element.removeAttribute('aria-invalid');
      }
      delete target.element.dataset.validationOwnsInvalid;
      delete target.element.dataset.validationHadInvalid;
      delete target.element.dataset.validationOriginalInvalid;
    }
    removeDescribedBy(target.element, messageId);

    if (target.element === field) {
      field.classList.remove('validation-group-error');
      if (field.dataset.validationInjectedRole === 'true') {
        field.removeAttribute('role');
        delete field.dataset.validationInjectedRole;
      }
      if (field.dataset.validationInjectedLabel === 'true') {
        field.removeAttribute('aria-label');
        delete field.dataset.validationInjectedLabel;
      }
      if (field.dataset.validationInjectedFocus === 'true') {
        field.removeAttribute('tabindex');
        delete field.dataset.validationInjectedFocus;
      }
    }
  }

  function getScrollBehavior(prefersReducedMotion) {
    return prefersReducedMotion ? 'auto' : 'smooth';
  }

  return {
    groupErrors,
    getOwnedMessage,
    prepareTarget,
    markTarget,
    clearTarget,
    getScrollBehavior
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ValidationAccessibility;
}
