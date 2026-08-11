/**
 * Dynamic form field renderer shared by the full form and wizard modes.
 */
const FormBuilder = (function () {
  'use strict';

  const Utils = typeof EditorUtils !== 'undefined'
    ? EditorUtils
    : require('./editor-utils.js');

  let schema = null;
  let formData = {};
  let onChangeCallback = null;
  let readOnlyPaths = [];

  function init(schemaAST, onChange) {
    schema = schemaAST;
    onChangeCallback = onChange;
  }

  function setFormData(data) {
    formData = data || {};
  }

  function getFormData() {
    return formData;
  }

  function setReadOnlyPaths(paths) {
    readOnlyPaths = Array.isArray(paths) ? [...paths] : [];
  }

  function isReadOnly(path) {
    return readOnlyPaths.some(prefix => Utils.isPathWithin(path, prefix));
  }

  function generateId(prefix) {
    const safePrefix = String(prefix).replace(/[^a-zA-Z0-9_-]/g, '-');
    return `${safePrefix}-${Math.random().toString(36).slice(2, 11)}`;
  }

  function toLabel(fieldName) {
    return fieldName
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, letter => letter.toUpperCase());
  }

  function createTextElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) {
      element.className = className;
    }
    element.textContent = text;
    return element;
  }

  function appendRequiredIndicator(label) {
    const indicator = createTextElement('span', 'required-indicator', '*');
    label.appendChild(indicator);
  }

  function appendDescription(container, description, className = 'field-description') {
    if (description) {
      container.appendChild(createTextElement('p', className, description));
    }
  }

  function resolveType(typeDef) {
    return typeDef && typeDef.kind === 'reference'
      ? schema.resolveType(typeDef)
      : typeDef;
  }

  function triggerChange() {
    if (onChangeCallback) {
      onChangeCallback(formData);
    }
  }

  function buildForm(container) {
    container.replaceChildren();

    if (!schema) {
      container.appendChild(createTextElement('p', 'error', 'Schema not loaded'));
      return;
    }

    const rootType = schema.getType('#SecurityInsights');
    if (!rootType || rootType.kind !== 'struct') {
      container.appendChild(
        createTextElement('p', 'error', 'Invalid schema: SecurityInsights type not found')
      );
      return;
    }

    for (const [fieldName, field] of Object.entries(rootType.fields)) {
      container.appendChild(buildSection(fieldName, field, fieldName));
    }
  }

  function buildSection(fieldName, field, path) {
    const section = document.createElement('div');
    section.className = 'form-section';
    section.dataset.path = path;

    const header = document.createElement('div');
    header.className = 'form-section-header';

    const heading = document.createElement('h3');
    heading.appendChild(createTextElement('span', 'toggle-icon', '▼'));
    heading.appendChild(document.createTextNode(` ${toLabel(fieldName)} `));
    if (!field.optional) {
      heading.appendChild(createTextElement('span', 'form-section-required', '*'));
    }
    header.appendChild(heading);
    header.addEventListener('click', () => section.classList.toggle('collapsed'));

    const content = document.createElement('div');
    content.className = 'form-section-content';
    appendDescription(content, field.description);

    if (isReadOnly(path)) {
      content.appendChild(
        createTextElement(
          'p',
          'field-description inherited-note',
          'Inherited from the parent Security Insights file. Load that file directly to edit these values.'
        )
      );
    }

    const resolvedType = resolveType(field);
    if (resolvedType && resolvedType.kind === 'struct') {
      for (const [subFieldName, subField] of Object.entries(resolvedType.fields)) {
        content.appendChild(buildField(subFieldName, subField, `${path}.${subFieldName}`));
      }
    } else {
      content.appendChild(buildField(fieldName, field, path));
    }

    section.appendChild(header);
    section.appendChild(content);
    return section;
  }

  function buildField(fieldName, field, path) {
    const resolvedType = resolveType(field);

    if (resolvedType) {
      switch (resolvedType.kind) {
        case 'primitive':
          return buildPrimitiveField(fieldName, field, resolvedType, path);
        case 'enum':
          return buildEnumField(fieldName, field, resolvedType, path);
        case 'array':
          return buildArrayField(fieldName, field, resolvedType, path);
        case 'struct':
          return buildNestedStructField(fieldName, field, resolvedType, path);
        case 'disjunction':
          return buildDisjunctionField(fieldName, field, resolvedType, path);
        case 'reference': {
          const deepResolved = resolveType(resolvedType);
          if (deepResolved) {
            return buildField(fieldName, { ...field, ...deepResolved }, path);
          }
          break;
        }
      }
    }

    return buildPrimitiveField(
      fieldName,
      field,
      { kind: 'primitive', type: 'string' },
      path
    );
  }

  function buildFieldLabel(fieldName, id, required) {
    const label = document.createElement('label');
    if (id) {
      label.htmlFor = id;
    }
    label.appendChild(document.createTextNode(`${toLabel(fieldName)} `));
    if (required) {
      appendRequiredIndicator(label);
    }
    return label;
  }

  function buildPrimitiveField(fieldName, field, resolvedType, path) {
    const container = document.createElement('div');
    container.className = resolvedType.type === 'bool'
      ? 'form-field form-field-checkbox'
      : 'form-field';
    container.dataset.path = path;

    const id = generateId(fieldName);
    const required = !field.optional;
    const currentValue = Utils.getNestedValue(formData, path);
    const fieldReadOnly = isReadOnly(path);

    if (resolvedType.type === 'bool') {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = id;
      checkbox.checked = currentValue === true;
      checkbox.disabled = fieldReadOnly;
      checkbox.addEventListener('change', () => {
        Utils.setNestedValue(formData, path, checkbox.checked);
        triggerChange();
      });

      container.appendChild(checkbox);
      container.appendChild(buildFieldLabel(fieldName, id, required));
      appendDescription(container, field.description);
      return container;
    }

    const pattern = schema.getPattern(field) || resolvedType.pattern;
    let inputType = 'text';
    let placeholder = '';

    if (resolvedType.type === 'date') {
      inputType = 'date';
    } else if (pattern && pattern.includes('@')) {
      inputType = 'email';
      placeholder = 'email@example.com';
    } else if (pattern && pattern.includes('https?')) {
      inputType = 'url';
      placeholder = 'https://example.com';
    }

    container.appendChild(buildFieldLabel(fieldName, id, required));
    appendDescription(container, field.description);

    const input = document.createElement('input');
    input.type = inputType;
    input.id = id;
    input.value = currentValue === undefined || currentValue === null
      ? ''
      : String(currentValue);
    input.placeholder = placeholder;
    input.required = required;
    input.disabled = fieldReadOnly;
    if (pattern) {
      input.pattern = pattern;
    }

    input.addEventListener('input', () => {
      if (input.value) {
        Utils.setNestedValue(formData, path, input.value);
      } else {
        Utils.deleteNestedValue(formData, path);
      }
      triggerChange();
    });

    container.appendChild(input);
    return container;
  }

  function buildEnumField(fieldName, field, resolvedType, path) {
    const container = document.createElement('div');
    container.className = 'form-field';
    container.dataset.path = path;

    const id = generateId(fieldName);
    const required = !field.optional;
    const currentValue = Utils.getNestedValue(formData, path);

    container.appendChild(buildFieldLabel(fieldName, id, required));
    appendDescription(container, field.description);

    const select = document.createElement('select');
    select.id = id;
    select.required = required;
    select.disabled = isReadOnly(path);

    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = '-- Select --';
    select.appendChild(emptyOption);

    for (const value of resolvedType.values || []) {
      const option = document.createElement('option');
      option.value = String(value);
      option.textContent = String(value);
      option.selected = currentValue === value;
      select.appendChild(option);
    }

    select.addEventListener('change', () => {
      if (select.value) {
        Utils.setNestedValue(formData, path, select.value);
      } else {
        Utils.deleteNestedValue(formData, path);
      }
      triggerChange();
    });

    container.appendChild(select);
    return container;
  }

  function buildArrayField(fieldName, field, resolvedType, path) {
    const container = document.createElement('div');
    container.className = 'form-field array-field';
    container.dataset.path = path;

    const required = !field.optional;
    const minItems = resolvedType.minItems || 0;
    const maxItems = resolvedType.maxItems;
    const itemType = resolvedType.itemType;

    const header = document.createElement('div');
    header.className = 'array-field-header';
    const heading = document.createElement('h4');
    heading.appendChild(document.createTextNode(`${toLabel(fieldName)} `));
    if (required) {
      appendRequiredIndicator(heading);
    }
    if (minItems > 0) {
      heading.appendChild(createTextElement('span', 'min-items', `(min: ${minItems})`));
    }

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = 'btn btn-small add-item-btn';
    addButton.textContent = '+ Add';

    header.appendChild(heading);
    header.appendChild(addButton);
    container.appendChild(header);
    appendDescription(container, field.description);

    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'array-items';
    container.appendChild(itemsContainer);

    function renderItems() {
      itemsContainer.replaceChildren();
      const value = Utils.getNestedValue(formData, path);
      const items = Array.isArray(value) ? value : [];
      const invalidArray = value !== undefined && !Array.isArray(value);

      if (invalidArray) {
        itemsContainer.appendChild(
          createTextElement(
            'p',
            'field-error',
            'Loaded value is not an array. Use "Replace with list" to correct it.'
          )
        );
      }

      items.forEach((item, index) => {
        itemsContainer.appendChild(
          buildArrayItem(
            itemType,
            `${path}[${index}]`,
            index,
            items.length,
            minItems,
            path,
            renderItems
          )
        );
      });

      addButton.textContent = invalidArray ? 'Replace with list' : '+ Add';
      addButton.disabled = isReadOnly(path)
        || (Number.isInteger(maxItems) && items.length >= maxItems);
    }

    addButton.addEventListener('click', () => {
      const currentValue = Utils.getNestedValue(formData, path);
      const items = Array.isArray(currentValue) ? currentValue : [];
      if (Number.isInteger(maxItems) && items.length >= maxItems) {
        return;
      }

      items.push(getDefaultForType(itemType));
      Utils.setNestedValue(formData, path, items);
      renderItems();
      triggerChange();
    });

    container.renderItems = renderItems;
    renderItems();
    return container;
  }

  function buildArrayItem(
    itemType,
    path,
    index,
    totalItems,
    minItems,
    arrayPath,
    renderItems
  ) {
    const container = document.createElement('div');
    container.className = 'array-item';
    container.dataset.path = path;

    const content = document.createElement('div');
    content.className = 'array-item-content';
    const resolvedItemType = resolveType(itemType);

    if (resolvedItemType && resolvedItemType.kind === 'struct') {
      for (const [fieldName, field] of Object.entries(resolvedItemType.fields)) {
        content.appendChild(buildField(fieldName, field, `${path}.${fieldName}`));
      }
    } else {
      content.appendChild(
        buildField(`item-${index + 1}`, { optional: false, ...itemType }, path)
      );
    }

    const controls = document.createElement('div');
    controls.className = 'array-item-controls';

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'btn btn-small btn-danger';
    removeButton.textContent = '×';
    removeButton.disabled = isReadOnly(path) || totalItems <= minItems;
    removeButton.title = totalItems <= minItems
      ? `Minimum ${minItems} items required`
      : 'Remove';
    removeButton.addEventListener('click', () => {
      const items = Utils.getNestedValue(formData, arrayPath);
      if (!Array.isArray(items)) {
        return;
      }

      items.splice(index, 1);
      renderItems();
      triggerChange();
    });

    controls.appendChild(removeButton);
    container.appendChild(content);
    container.appendChild(controls);
    return container;
  }

  function buildNestedStructField(fieldName, field, resolvedType, path) {
    const container = document.createElement('div');
    container.className = 'form-field nested-object';
    container.dataset.path = path;

    container.appendChild(buildFieldLabel(fieldName, null, !field.optional));
    appendDescription(container, field.description);

    const fieldsContainer = document.createElement('div');
    fieldsContainer.className = 'nested-fields';
    for (const [subFieldName, subField] of Object.entries(resolvedType.fields)) {
      fieldsContainer.appendChild(
        buildField(subFieldName, subField, `${path}.${subFieldName}`)
      );
    }

    container.appendChild(fieldsContainer);
    return container;
  }

  function buildDisjunctionField(fieldName, field, resolvedType, path) {
    const enumValues = schema.getEnumValues(resolvedType);
    if (enumValues) {
      return buildEnumField(
        fieldName,
        field,
        { kind: 'enum', values: enumValues },
        path
      );
    }

    const container = document.createElement('div');
    container.className = 'form-field';
    container.dataset.path = path;

    const id = generateId(fieldName);
    const required = !field.optional;
    const currentValue = Utils.getNestedValue(formData, path);

    container.appendChild(buildFieldLabel(fieldName, id, required));
    appendDescription(container, field.description);

    const input = document.createElement('input');
    input.type = 'text';
    input.id = id;
    input.value = Array.isArray(currentValue)
      ? currentValue.join(', ')
      : (currentValue || '');
    input.placeholder = 'Enter values separated by commas, or "default"';
    input.required = required;
    input.disabled = isReadOnly(path);
    input.addEventListener('input', () => {
      const value = input.value.trim();
      if (value === 'default') {
        Utils.setNestedValue(formData, path, ['default']);
      } else if (value) {
        Utils.setNestedValue(
          formData,
          path,
          value.split(',').map(item => item.trim()).filter(Boolean)
        );
      } else {
        Utils.deleteNestedValue(formData, path);
      }
      triggerChange();
    });

    container.appendChild(input);
    container.appendChild(
      createTextElement(
        'p',
        'field-description',
        'Use "default" or enter custom values separated by commas'
      )
    );
    return container;
  }

  function getDefaultForType(typeValue) {
    const resolved = resolveType(typeValue);
    if (!resolved) {
      return '';
    }

    switch (resolved.kind) {
      case 'primitive':
        return resolved.type === 'bool' ? false : '';
      case 'struct': {
        const value = {};
        for (const [fieldName, field] of Object.entries(resolved.fields)) {
          if (!field.optional) {
            value[fieldName] = getDefaultForType(field);
          }
        }
        return value;
      }
      case 'array':
      case 'array-literal':
      case 'disjunction':
        return [];
      case 'enum':
      default:
        return '';
    }
  }

  function clearForm() {
    formData = {};
    triggerChange();
  }

  return {
    init,
    setFormData,
    getFormData,
    setReadOnlyPaths,
    isReadOnly,
    buildForm,
    buildField,
    clearForm,
    getDefaultForType,
    toLabel
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormBuilder;
}
