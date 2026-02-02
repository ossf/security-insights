/**
 * Form Builder - Generates dynamic forms from CUE schema AST
 *
 * Traverses the schema AST to create HTML forms with:
 * - Text/email/date/url inputs with regex validation
 * - Select dropdowns for enum types
 * - Checkbox inputs for boolean fields
 * - Dynamic arrays with add/remove functionality
 * - Collapsible sections for nested objects
 * - Required field indicators
 */

const FormBuilder = (function () {
  'use strict';

  let schema = null;
  let formData = {};
  let onChangeCallback = null;

  /**
   * Initialize the form builder with a schema
   */
  function init(schemaAST, onChange) {
    schema = schemaAST;
    onChangeCallback = onChange;
  }

  /**
   * Set form data (e.g., when loading from YAML)
   */
  function setFormData(data) {
    formData = data || {};
  }

  /**
   * Get current form data
   */
  function getFormData() {
    return formData;
  }

  /**
   * Generate a unique ID for form elements
   */
  function generateId(prefix) {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Convert field name to human-readable label
   */
  function toLabel(fieldName) {
    return fieldName
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Get nested value from object using path
   */
  function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Set nested value in object using path
   */
  function setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const parent = keys.reduce((current, key) => {
      if (current[key] === undefined) {
        current[key] = {};
      }
      return current[key];
    }, obj);
    parent[lastKey] = value;
  }

  /**
   * Delete nested value from object using path
   */
  function deleteNestedValue(obj, path) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const parent = keys.reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
    if (parent && lastKey in parent) {
      delete parent[lastKey];
    }
  }

  /**
   * Trigger change callback
   */
  function triggerChange() {
    if (onChangeCallback) {
      onChangeCallback(formData);
    }
  }

  /**
   * Build the main form for SecurityInsights
   */
  function buildForm(container) {
    if (!schema) {
      container.innerHTML = '<p class="error">Schema not loaded</p>';
      return;
    }

    const rootType = schema.getType('#SecurityInsights');
    if (!rootType || rootType.kind !== 'struct') {
      container.innerHTML = '<p class="error">Invalid schema: SecurityInsights type not found</p>';
      return;
    }

    container.innerHTML = '';

    // Build sections for each top-level field
    for (const [fieldName, field] of Object.entries(rootType.fields)) {
      const section = buildSection(fieldName, field, fieldName);
      container.appendChild(section);
    }
  }

  /**
   * Build a collapsible section for a struct field
   */
  function buildSection(fieldName, field, path) {
    const section = document.createElement('div');
    section.className = 'form-section';
    section.dataset.path = path;

    const header = document.createElement('div');
    header.className = 'form-section-header';
    header.innerHTML = `
      <h3>
        <span class="toggle-icon">▼</span>
        ${toLabel(fieldName)}
        ${!field.optional ? '<span class="form-section-required">*</span>' : ''}
      </h3>
    `;
    header.addEventListener('click', () => {
      section.classList.toggle('collapsed');
    });

    const content = document.createElement('div');
    content.className = 'form-section-content';

    // Add description if available
    if (field.description) {
      const desc = document.createElement('p');
      desc.className = 'field-description';
      desc.textContent = field.description;
      content.appendChild(desc);
    }

    // Resolve the type and build fields
    let resolvedType = field;
    if (field.kind === 'reference') {
      resolvedType = schema.resolveType(field);
    }

    if (resolvedType && resolvedType.kind === 'struct') {
      for (const [subFieldName, subField] of Object.entries(resolvedType.fields)) {
        const fieldEl = buildField(subFieldName, subField, `${path}.${subFieldName}`);
        content.appendChild(fieldEl);
      }
    } else {
      // Non-struct type at top level
      const fieldEl = buildField(fieldName, field, path);
      content.appendChild(fieldEl);
    }

    section.appendChild(header);
    section.appendChild(content);

    return section;
  }

  /**
   * Build a form field based on its type
   */
  function buildField(fieldName, field, path) {
    let resolvedType = field;
    if (field.kind === 'reference') {
      resolvedType = schema.resolveType(field);
    }

    const container = document.createElement('div');
    container.className = 'form-field';
    container.dataset.path = path;

    // Handle different field types
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
        case 'reference':
          // Double-reference - resolve again
          const deepResolved = schema.resolveType(resolvedType);
          if (deepResolved) {
            return buildField(fieldName, { ...field, ...deepResolved }, path);
          }
          break;
      }
    }

    // Fallback to text input
    return buildPrimitiveField(fieldName, field, { kind: 'primitive', type: 'string' }, path);
  }

  /**
   * Build a primitive field (string, bool, date)
   */
  function buildPrimitiveField(fieldName, field, resolvedType, path) {
    const container = document.createElement('div');
    container.className = 'form-field';
    container.dataset.path = path;

    const id = generateId(fieldName);
    const required = !field.optional;
    const pattern = schema.getPattern(field) || resolvedType.pattern;
    const currentValue = getNestedValue(formData, path);

    if (resolvedType.type === 'bool') {
      // Checkbox for boolean
      container.className = 'form-field form-field-checkbox';
      container.innerHTML = `
        <input type="checkbox" id="${id}" ${currentValue ? 'checked' : ''}>
        <label for="${id}">
          ${toLabel(fieldName)}
          ${required ? '<span class="required-indicator">*</span>' : ''}
        </label>
      `;

      const checkbox = container.querySelector('input');
      checkbox.addEventListener('change', () => {
        setNestedValue(formData, path, checkbox.checked);
        triggerChange();
      });
    } else {
      // Text input for strings and dates
      let inputType = 'text';
      let placeholder = '';
      const isReadOnly = fieldName === 'schema-version';
      const defaultValue = isReadOnly ? '2.2.0' : '';

      if (resolvedType.type === 'date') {
        inputType = 'date';
      } else if (pattern && pattern.includes('@')) {
        inputType = 'email';
        placeholder = 'email@example.com';
      } else if (pattern && pattern.includes('https?')) {
        inputType = 'url';
        placeholder = 'https://example.com';
      }

      // For read-only fields like schema-version, ensure the value is set
      const displayValue = isReadOnly ? defaultValue : (currentValue || '');
      if (isReadOnly && !currentValue) {
        setNestedValue(formData, path, defaultValue);
      }

      container.innerHTML = `
        <label for="${id}">
          ${toLabel(fieldName)}
          ${required ? '<span class="required-indicator">*</span>' : ''}
        </label>
        ${field.description ? `<p class="field-description">${field.description}</p>` : ''}
        <input type="${inputType}" id="${id}"
               value="${displayValue}"
               placeholder="${placeholder}"
               ${pattern ? `pattern="${pattern}"` : ''}
               ${required ? 'required' : ''}
               ${isReadOnly ? 'readonly' : ''}>
        ${isReadOnly ? '<p class="field-description read-only-note">This field is automatically set and cannot be changed.</p>' : ''}
      `;

      const input = container.querySelector('input');
      if (!isReadOnly) {
        input.addEventListener('input', () => {
          if (input.value) {
            setNestedValue(formData, path, input.value);
          } else {
            deleteNestedValue(formData, path);
          }
          triggerChange();
        });
      }
    }

    return container;
  }

  /**
   * Build an enum field (select dropdown)
   */
  function buildEnumField(fieldName, field, resolvedType, path) {
    const container = document.createElement('div');
    container.className = 'form-field';
    container.dataset.path = path;

    const id = generateId(fieldName);
    const required = !field.optional;
    const currentValue = getNestedValue(formData, path);
    const values = resolvedType.values || [];

    container.innerHTML = `
      <label for="${id}">
        ${toLabel(fieldName)}
        ${required ? '<span class="required-indicator">*</span>' : ''}
      </label>
      ${field.description ? `<p class="field-description">${field.description}</p>` : ''}
      <select id="${id}" ${required ? 'required' : ''}>
        <option value="">-- Select --</option>
        ${values.map(v => `<option value="${v}" ${currentValue === v ? 'selected' : ''}>${v}</option>`).join('')}
      </select>
    `;

    const select = container.querySelector('select');
    select.addEventListener('change', () => {
      if (select.value) {
        setNestedValue(formData, path, select.value);
      } else {
        deleteNestedValue(formData, path);
      }
      triggerChange();
    });

    return container;
  }

  /**
   * Build an array field with add/remove functionality
   */
  function buildArrayField(fieldName, field, resolvedType, path) {
    const container = document.createElement('div');
    container.className = 'form-field array-field';
    container.dataset.path = path;

    const id = generateId(fieldName);
    const required = !field.optional;
    const minItems = resolvedType.minItems || 0;
    const itemType = resolvedType.itemType;
    let currentValue = getNestedValue(formData, path);

    // Only initialize array if it doesn't exist
    if (!Array.isArray(currentValue)) {
      currentValue = [];
    }

    // Ensure we have at least minItems (only if array is smaller than minimum)
    while (currentValue.length < minItems) {
      currentValue.push(getDefaultForType(itemType));
    }
    setNestedValue(formData, path, currentValue);

    container.innerHTML = `
      <div class="array-field-header">
        <h4>
          ${toLabel(fieldName)}
          ${required ? '<span class="required-indicator">*</span>' : ''}
          ${minItems > 0 ? `<span class="min-items">(min: ${minItems})</span>` : ''}
        </h4>
        <button type="button" class="btn btn-small add-item-btn">+ Add</button>
      </div>
      ${field.description ? `<p class="field-description">${field.description}</p>` : ''}
      <div class="array-items" id="${id}"></div>
    `;

    const itemsContainer = container.querySelector('.array-items');
    const addBtn = container.querySelector('.add-item-btn');

    // Render existing items
    function renderItems() {
      itemsContainer.innerHTML = '';
      const items = getNestedValue(formData, path) || [];

      items.forEach((item, index) => {
        const itemEl = buildArrayItem(itemType, `${path}[${index}]`, index, items.length, minItems);
        itemsContainer.appendChild(itemEl);
      });
    }

    addBtn.addEventListener('click', () => {
      const items = getNestedValue(formData, path) || [];
      items.push(getDefaultForType(itemType));
      setNestedValue(formData, path, items);
      renderItems();
      triggerChange();
    });

    // Store render function for later use
    container.renderItems = renderItems;
    renderItems();

    return container;
  }

  /**
   * Build a single array item
   */
  function buildArrayItem(itemType, path, index, totalItems, minItems) {
    const container = document.createElement('div');
    container.className = 'array-item';
    container.dataset.path = path;

    const content = document.createElement('div');
    content.className = 'array-item-content';

    // Resolve item type
    let resolvedItemType = itemType;
    if (itemType.kind === 'reference') {
      resolvedItemType = schema.resolveType(itemType);
    }

    if (resolvedItemType && resolvedItemType.kind === 'struct') {
      // Build fields for struct items
      for (const [fieldName, field] of Object.entries(resolvedItemType.fields)) {
        const fieldEl = buildField(fieldName, field, `${path}.${fieldName}`);
        content.appendChild(fieldEl);
      }
    } else {
      // Simple type - single input
      const fieldEl = buildField(`item-${index}`, { optional: false, ...itemType }, path);
      content.appendChild(fieldEl);
    }

    const controls = document.createElement('div');
    controls.className = 'array-item-controls';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-small btn-danger';
    removeBtn.textContent = '×';
    removeBtn.disabled = totalItems <= minItems;
    removeBtn.title = totalItems <= minItems ? `Minimum ${minItems} items required` : 'Remove';

    removeBtn.addEventListener('click', () => {
      // Get parent path and index
      const match = path.match(/^(.+)\[(\d+)\]$/);
      if (match) {
        const arrayPath = match[1];
        const itemIndex = parseInt(match[2]);
        const items = getNestedValue(formData, arrayPath) || [];
        items.splice(itemIndex, 1);
        setNestedValue(formData, arrayPath, items);

        // Re-render the array
        const arrayContainer = document.querySelector(`[data-path="${arrayPath}"]`);
        if (arrayContainer && arrayContainer.renderItems) {
          arrayContainer.renderItems();
        }
        triggerChange();
      }
    });

    controls.appendChild(removeBtn);
    container.appendChild(content);
    container.appendChild(controls);

    return container;
  }

  /**
   * Build a nested struct field
   */
  function buildNestedStructField(fieldName, field, resolvedType, path) {
    const container = document.createElement('div');
    container.className = 'form-field nested-object';
    container.dataset.path = path;

    const required = !field.optional;

    container.innerHTML = `
      <label>
        ${toLabel(fieldName)}
        ${required ? '<span class="required-indicator">*</span>' : ''}
      </label>
      ${field.description ? `<p class="field-description">${field.description}</p>` : ''}
    `;

    const fieldsContainer = document.createElement('div');
    fieldsContainer.className = 'nested-fields';

    for (const [subFieldName, subField] of Object.entries(resolvedType.fields)) {
      const fieldEl = buildField(subFieldName, subField, `${path}.${subFieldName}`);
      fieldsContainer.appendChild(fieldEl);
    }

    container.appendChild(fieldsContainer);
    return container;
  }

  /**
   * Build a disjunction field (union type)
   */
  function buildDisjunctionField(fieldName, field, resolvedType, path) {
    // Check if it's an enum-like disjunction
    const enumValues = schema.getEnumValues(resolvedType);
    if (enumValues) {
      return buildEnumField(fieldName, field, { kind: 'enum', values: enumValues }, path);
    }

    // For complex disjunctions (like ["default"] | [...string]), use array input
    const container = document.createElement('div');
    container.className = 'form-field';
    container.dataset.path = path;

    const id = generateId(fieldName);
    const required = !field.optional;
    const currentValue = getNestedValue(formData, path);

    container.innerHTML = `
      <label for="${id}">
        ${toLabel(fieldName)}
        ${required ? '<span class="required-indicator">*</span>' : ''}
      </label>
      ${field.description ? `<p class="field-description">${field.description}</p>` : ''}
      <input type="text" id="${id}"
             value="${Array.isArray(currentValue) ? currentValue.join(', ') : (currentValue || '')}"
             placeholder="Enter values separated by commas, or 'default'"
             ${required ? 'required' : ''}>
      <p class="field-description">Use "default" or enter custom values separated by commas</p>
    `;

    const input = container.querySelector('input');
    input.addEventListener('input', () => {
      const value = input.value.trim();
      if (value === 'default') {
        setNestedValue(formData, path, ['default']);
      } else if (value) {
        setNestedValue(formData, path, value.split(',').map(v => v.trim()).filter(v => v));
      } else {
        deleteNestedValue(formData, path);
      }
      triggerChange();
    });

    return container;
  }

  /**
   * Get default value for a type
   */
  function getDefaultForType(typeValue) {
    if (!typeValue) return '';

    let resolved = typeValue;
    if (typeValue.kind === 'reference') {
      resolved = schema.resolveType(typeValue);
    }

    if (!resolved) return '';

    switch (resolved.kind) {
      case 'primitive':
        if (resolved.type === 'bool') return false;
        if (resolved.type === 'date') return '';
        return '';
      case 'struct':
        const obj = {};
        for (const [fieldName, field] of Object.entries(resolved.fields)) {
          if (!field.optional) {
            obj[fieldName] = getDefaultForType(field);
          }
        }
        return obj;
      case 'enum':
        return '';
      case 'array':
        return [];
      default:
        return '';
    }
  }

  /**
   * Update form display from current data
   */
  function updateFormFromData(container) {
    // Update all input values
    container.querySelectorAll('[data-path]').forEach(el => {
      const path = el.dataset.path;
      const value = getNestedValue(formData, path);

      const input = el.querySelector('input, select, textarea');
      if (input) {
        if (input.type === 'checkbox') {
          input.checked = !!value;
        } else if (input.tagName === 'SELECT') {
          input.value = value || '';
        } else {
          input.value = value || '';
        }
      }
    });

    // Re-render array fields
    container.querySelectorAll('.array-field').forEach(el => {
      if (el.renderItems) {
        el.renderItems();
      }
    });
  }

  /**
   * Clear all form data
   */
  function clearForm() {
    formData = {};
    triggerChange();
  }

  // Public API
  return {
    init,
    setFormData,
    getFormData,
    buildForm,
    updateFormFromData,
    clearForm,
    getDefaultForType,
    toLabel
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormBuilder;
}
