/**
 * Wizard Mode - Step-by-step guided form for creating Security Insights files
 *
 * Provides a guided flow through the schema:
 * 1. Header - Basic metadata
 * 2. Project - Project information
 * 3. Vulnerability Reporting - How to report vulnerabilities
 * 4. Repository - Repository details
 * 5. Security Posture - Security assessments and tools
 * 6. Review - Final review and export
 */

const Wizard = (function () {
  'use strict';

  let schema = null;
  let formData = {};
  let currentStep = 0;
  let onChangeCallback = null;

  const steps = [
    {
      id: 'header',
      title: 'Header',
      description: 'Basic metadata about this Security Insights file',
      fields: ['header']
    },
    {
      id: 'project',
      title: 'Project',
      description: 'Information about your project',
      fields: ['project.name', 'project.homepage', 'project.roadmap', 'project.funding', 'project.administrators', 'project.repositories']
    },
    {
      id: 'vulnerability',
      title: 'Vulnerability Reporting',
      description: 'How security vulnerabilities can be reported',
      fields: ['project.vulnerability-reporting']
    },
    {
      id: 'repository',
      title: 'Repository',
      description: 'Repository-specific settings and policies',
      fields: ['repository.url', 'repository.status', 'repository.accepts-change-request', 'repository.accepts-automated-change-request', 'repository.core-team', 'repository.license']
    },
    {
      id: 'security',
      title: 'Security Posture',
      description: 'Security assessments, champions, and tooling',
      fields: ['repository.security']
    },
    {
      id: 'review',
      title: 'Review',
      description: 'Review your Security Insights file before exporting',
      fields: []
    }
  ];

  /**
   * Initialize wizard with schema
   */
  function init(schemaAST, onChange) {
    schema = schemaAST;
    onChangeCallback = onChange;
    currentStep = 0;
  }

  /**
   * Set form data
   */
  function setFormData(data) {
    formData = data || {};
  }

  /**
   * Get form data
   */
  function getFormData() {
    return formData;
  }

  /**
   * Get current step index
   */
  function getCurrentStep() {
    return currentStep;
  }

  /**
   * Get total steps
   */
  function getTotalSteps() {
    return steps.length;
  }

  /**
   * Navigate to a specific step
   */
  function goToStep(stepIndex) {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      currentStep = stepIndex;
      return true;
    }
    return false;
  }

  /**
   * Go to next step
   */
  function nextStep() {
    if (currentStep < steps.length - 1) {
      currentStep++;
      return true;
    }
    return false;
  }

  /**
   * Go to previous step
   */
  function prevStep() {
    if (currentStep > 0) {
      currentStep--;
      return true;
    }
    return false;
  }

  /**
   * Check if we can go to next step
   */
  function canGoNext() {
    return currentStep < steps.length - 1;
  }

  /**
   * Check if we can go to previous step
   */
  function canGoPrev() {
    return currentStep > 0;
  }

  /**
   * Build the wizard progress indicator
   */
  function buildProgress(container) {
    container.innerHTML = '';

    steps.forEach((step, index) => {
      const stepEl = document.createElement('div');
      stepEl.className = 'wizard-step';
      if (index === currentStep) {
        stepEl.classList.add('active');
      } else if (index < currentStep) {
        stepEl.classList.add('completed');
      }

      stepEl.innerHTML = `
        <div class="wizard-step-number">${index < currentStep ? '✓' : index + 1}</div>
        <div class="wizard-step-label">${step.title}</div>
      `;

      stepEl.addEventListener('click', () => {
        if (index <= currentStep) {
          goToStep(index);
          if (onChangeCallback) {
            onChangeCallback(formData, 'navigate');
          }
        }
      });

      container.appendChild(stepEl);
    });
  }

  /**
   * Build the wizard content for current step
   */
  function buildContent(container) {
    const step = steps[currentStep];
    if (!step) return;

    container.innerHTML = '';

    // Step header
    const header = document.createElement('div');
    header.className = 'wizard-step-header';
    header.innerHTML = `
      <h3>${step.title}</h3>
      <p class="help-text">${step.description}</p>
    `;
    container.appendChild(header);

    // Special handling for review step
    if (step.id === 'review') {
      buildReviewStep(container);
      return;
    }

    // Build fields for this step
    const fieldsContainer = document.createElement('div');
    fieldsContainer.className = 'wizard-fields';

    step.fields.forEach(fieldPath => {
      const fieldEl = buildWizardField(fieldPath);
      if (fieldEl) {
        fieldsContainer.appendChild(fieldEl);
      }
    });

    container.appendChild(fieldsContainer);
  }

  /**
   * Build a wizard field from path
   */
  function buildWizardField(path) {
    const parts = path.split('.');
    let typeDef = schema.getType('#SecurityInsights');
    let field = null;
    let fieldName = parts[parts.length - 1];

    // Navigate to the field
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      if (typeDef && typeDef.kind === 'struct' && typeDef.fields) {
        field = typeDef.fields[part];
        if (field) {
          if (field.kind === 'reference') {
            typeDef = schema.resolveType(field);
          } else if (field.kind === 'struct') {
            typeDef = field;
          }
        }
      } else if (typeDef && typeDef.kind === 'reference') {
        typeDef = schema.resolveType(typeDef);
        i--; // Re-process this part with resolved type
      }
    }

    if (!field) return null;

    const container = document.createElement('div');
    container.className = 'wizard-field';
    container.dataset.path = path;

    // Use FormBuilder-like logic to build the field
    const resolvedType = field.kind === 'reference' ? schema.resolveType(field) : field;

    if (resolvedType && resolvedType.kind === 'struct') {
      // Full section for struct types
      container.innerHTML = `
        <div class="wizard-field-header">
          <h4>${FormBuilder.toLabel(fieldName)}</h4>
          ${field.description ? `<p class="field-description">${field.description}</p>` : ''}
        </div>
      `;

      const fieldsDiv = document.createElement('div');
      fieldsDiv.className = 'wizard-struct-fields';

      for (const [subFieldName, subField] of Object.entries(resolvedType.fields)) {
        const subFieldEl = buildSimpleField(subFieldName, subField, `${path}.${subFieldName}`);
        fieldsDiv.appendChild(subFieldEl);
      }

      container.appendChild(fieldsDiv);
    } else {
      // Simple field
      return buildSimpleField(fieldName, field, path);
    }

    return container;
  }

  /**
   * Build a simple form field
   */
  function buildSimpleField(fieldName, field, path) {
    const container = document.createElement('div');
    container.className = 'form-field';
    container.dataset.path = path;

    let resolvedType = field;
    if (field.kind === 'reference') {
      resolvedType = schema.resolveType(field);
    }

    const id = `wizard-${path.replace(/\./g, '-')}`;
    const required = !field.optional;
    const currentValue = getNestedValue(formData, path);

    // Handle different types
    if (resolvedType && resolvedType.kind === 'enum') {
      // Enum dropdown
      const values = resolvedType.values || [];
      container.innerHTML = `
        <label for="${id}">
          ${FormBuilder.toLabel(fieldName)}
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
    } else if (resolvedType && resolvedType.type === 'bool') {
      // Boolean checkbox
      container.className = 'form-field form-field-checkbox';
      container.innerHTML = `
        <input type="checkbox" id="${id}" ${currentValue ? 'checked' : ''}>
        <label for="${id}">
          ${FormBuilder.toLabel(fieldName)}
          ${required ? '<span class="required-indicator">*</span>' : ''}
        </label>
        ${field.description ? `<p class="field-description">${field.description}</p>` : ''}
      `;

      const checkbox = container.querySelector('input');
      checkbox.addEventListener('change', () => {
        setNestedValue(formData, path, checkbox.checked);
        triggerChange();
      });
    } else if (resolvedType && resolvedType.kind === 'array') {
      // Array field
      return buildArrayField(fieldName, field, resolvedType, path);
    } else if (resolvedType && resolvedType.kind === 'struct') {
      // Nested struct
      container.className = 'form-field nested-object';
      container.innerHTML = `
        <label>
          ${FormBuilder.toLabel(fieldName)}
          ${required ? '<span class="required-indicator">*</span>' : ''}
        </label>
        ${field.description ? `<p class="field-description">${field.description}</p>` : ''}
      `;

      const nestedDiv = document.createElement('div');
      nestedDiv.className = 'nested-fields';

      for (const [subFieldName, subField] of Object.entries(resolvedType.fields)) {
        const subFieldEl = buildSimpleField(subFieldName, subField, `${path}.${subFieldName}`);
        nestedDiv.appendChild(subFieldEl);
      }

      container.appendChild(nestedDiv);
    } else {
      // Text input
      const pattern = schema.getPattern(field) || (resolvedType && resolvedType.pattern);
      let inputType = 'text';
      let placeholder = '';
      const isReadOnly = fieldName === 'schema-version';
      const defaultValue = isReadOnly ? '2.2.0' : '';

      if (resolvedType && resolvedType.type === 'date') {
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
          ${FormBuilder.toLabel(fieldName)}
          ${required ? '<span class="required-indicator">*</span>' : ''}
        </label>
        ${field.description ? `<p class="field-description">${field.description}</p>` : ''}
        <input type="${inputType}" id="${id}"
               value="${displayValue}"
               placeholder="${placeholder}"
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
   * Build an array field for wizard
   */
  function buildArrayField(fieldName, field, resolvedType, path) {
    const container = document.createElement('div');
    container.className = 'form-field array-field';
    container.dataset.path = path;

    const required = !field.optional;
    const minItems = resolvedType.minItems || 0;
    const itemType = resolvedType.itemType;
    let currentValue = getNestedValue(formData, path);

    // Only initialize array if it doesn't exist
    if (!Array.isArray(currentValue)) {
      currentValue = [];
    }

    // Ensure minimum items (only if array is smaller than minimum)
    while (currentValue.length < minItems) {
      currentValue.push(FormBuilder.getDefaultForType(itemType));
    }
    setNestedValue(formData, path, currentValue);

    container.innerHTML = `
      <div class="array-field-header">
        <h4>
          ${FormBuilder.toLabel(fieldName)}
          ${required ? '<span class="required-indicator">*</span>' : ''}
        </h4>
        <button type="button" class="btn btn-small add-item-btn">+ Add</button>
      </div>
      ${field.description ? `<p class="field-description">${field.description}</p>` : ''}
      <div class="array-items"></div>
    `;

    const itemsContainer = container.querySelector('.array-items');
    const addBtn = container.querySelector('.add-item-btn');

    function renderItems() {
      itemsContainer.innerHTML = '';
      const items = getNestedValue(formData, path) || [];

      items.forEach((item, index) => {
        const itemEl = buildArrayItem(itemType, `${path}[${index}]`, index, items.length, minItems, path);
        itemsContainer.appendChild(itemEl);
      });
    }

    addBtn.addEventListener('click', () => {
      const items = getNestedValue(formData, path) || [];
      items.push(FormBuilder.getDefaultForType(itemType));
      setNestedValue(formData, path, items);
      renderItems();
      triggerChange();
    });

    container.renderItems = renderItems;
    renderItems();

    return container;
  }

  /**
   * Build a single array item
   */
  function buildArrayItem(itemType, path, index, totalItems, minItems, arrayPath) {
    const container = document.createElement('div');
    container.className = 'array-item';
    container.dataset.path = path;

    const content = document.createElement('div');
    content.className = 'array-item-content';

    let resolvedItemType = itemType;
    if (itemType.kind === 'reference') {
      resolvedItemType = schema.resolveType(itemType);
    }

    if (resolvedItemType && resolvedItemType.kind === 'struct') {
      for (const [fieldName, field] of Object.entries(resolvedItemType.fields)) {
        const fieldEl = buildSimpleField(fieldName, field, `${path}.${fieldName}`);
        content.appendChild(fieldEl);
      }
    } else {
      const fieldEl = buildSimpleField(`item`, { optional: false, ...itemType }, path);
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
      const items = getNestedValue(formData, arrayPath) || [];
      items.splice(index, 1);
      setNestedValue(formData, arrayPath, items);

      const arrayContainer = document.querySelector(`[data-path="${arrayPath}"]`);
      if (arrayContainer && arrayContainer.renderItems) {
        arrayContainer.renderItems();
      }
      triggerChange();
    });

    controls.appendChild(removeBtn);
    container.appendChild(content);
    container.appendChild(controls);

    return container;
  }

  /**
   * Build the review step
   */
  function buildReviewStep(container) {
    const summary = document.createElement('div');
    summary.className = 'wizard-review';

    // Create summary sections
    const sections = [
      { title: 'Header', data: formData.header },
      { title: 'Project', data: formData.project },
      { title: 'Repository', data: formData.repository }
    ];

    sections.forEach(section => {
      if (section.data && Object.keys(section.data).length > 0) {
        const sectionEl = document.createElement('div');
        sectionEl.className = 'review-section';
        sectionEl.innerHTML = `
          <h4>${section.title}</h4>
          <pre>${JSON.stringify(section.data, null, 2)}</pre>
        `;
        summary.appendChild(sectionEl);
      }
    });

    if (summary.children.length === 0) {
      summary.innerHTML = '<p>No data entered yet. Go back to fill in the form.</p>';
    }

    container.appendChild(summary);
  }

  /**
   * Helper: Get nested value
   */
  function getNestedValue(obj, path) {
    // Handle array notation like "project.repositories[0].name"
    const normalizedPath = path.replace(/\[(\d+)\]/g, '.$1');
    return normalizedPath.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Helper: Set nested value
   */
  function setNestedValue(obj, path, value) {
    const normalizedPath = path.replace(/\[(\d+)\]/g, '.$1');
    const keys = normalizedPath.split('.');
    const lastKey = keys.pop();
    const parent = keys.reduce((current, key) => {
      if (current[key] === undefined) {
        // Determine if next key is array index
        const nextKey = keys[keys.indexOf(key) + 1] || lastKey;
        current[key] = /^\d+$/.test(nextKey) ? [] : {};
      }
      return current[key];
    }, obj);
    parent[lastKey] = value;
  }

  /**
   * Helper: Delete nested value
   */
  function deleteNestedValue(obj, path) {
    const normalizedPath = path.replace(/\[(\d+)\]/g, '.$1');
    const keys = normalizedPath.split('.');
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
      onChangeCallback(formData, 'change');
    }
  }

  // Public API
  return {
    init,
    setFormData,
    getFormData,
    getCurrentStep,
    getTotalSteps,
    goToStep,
    nextStep,
    prevStep,
    canGoNext,
    canGoPrev,
    buildProgress,
    buildContent,
    steps
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Wizard;
}
