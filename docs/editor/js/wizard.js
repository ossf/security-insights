/**
 * Step-by-step guided editor built on the shared FormBuilder field renderer.
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
      fields: [
        'project.name',
        'project.homepage',
        'project.roadmap',
        'project.funding',
        'project.administrators',
        'project.repositories'
      ]
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
      fields: [
        'repository.url',
        'repository.status',
        'repository.accepts-change-request',
        'repository.accepts-automated-change-request',
        'repository.core-team',
        'repository.license'
      ]
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

  function init(schemaAST, onChange, options = {}) {
    schema = schemaAST;
    onChangeCallback = onChange;
    if (options.resetStep !== false) {
      currentStep = 0;
    }
  }

  function setFormData(data) {
    formData = data || {};
  }

  function getFormData() {
    return formData;
  }

  function getCurrentStep() {
    return currentStep;
  }

  function getTotalSteps() {
    return steps.length;
  }

  function goToStep(stepIndex) {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      currentStep = stepIndex;
      return true;
    }
    return false;
  }

  function nextStep() {
    if (currentStep < steps.length - 1) {
      currentStep += 1;
      return true;
    }
    return false;
  }

  function prevStep() {
    if (currentStep > 0) {
      currentStep -= 1;
      return true;
    }
    return false;
  }

  function canGoNext() {
    return currentStep < steps.length - 1;
  }

  function canGoPrev() {
    return currentStep > 0;
  }

  function getStepIndexForPath(path) {
    if (typeof path !== 'string' || path.length === 0) {
      return -1;
    }
    return steps.findIndex(step => step.fields.some(fieldPath => {
      return path === fieldPath
        || path.startsWith(`${fieldPath}.`)
        || path.startsWith(`${fieldPath}[`)
        || fieldPath.startsWith(`${path}.`)
        || fieldPath.startsWith(`${path}[`);
    }));
  }

  function buildProgress(container) {
    container.replaceChildren();

    const list = document.createElement('ol');
    list.className = 'wizard-progress-list';

    steps.forEach((step, index) => {
      const item = document.createElement('li');
      item.className = 'wizard-progress-item';
      const stepElement = document.createElement(index < currentStep ? 'button' : 'span');
      if (index < currentStep) {
        stepElement.type = 'button';
      }
      stepElement.className = 'wizard-step';
      const status = index < currentStep ? 'completed' : 'upcoming';
      if (index === currentStep) {
        stepElement.classList.add('active');
        item.setAttribute('aria-current', 'step');
      } else if (index < currentStep) {
        stepElement.classList.add('completed');
      }

      const number = document.createElement('div');
      number.className = 'wizard-step-number';
      number.setAttribute('aria-hidden', 'true');
      number.textContent = index < currentStep ? '✓' : String(index + 1);

      const label = document.createElement('div');
      label.className = 'wizard-step-label';
      label.setAttribute('aria-hidden', 'true');
      label.textContent = step.title;

      const accessibleText = document.createElement('span');
      accessibleText.className = 'visually-hidden';
      accessibleText.textContent = index === currentStep
        ? `Step ${index + 1}: ${step.title}`
        : `Step ${index + 1}: ${step.title}, ${status}`;

      stepElement.appendChild(accessibleText);
      stepElement.appendChild(number);
      stepElement.appendChild(label);
      if (index < currentStep) {
        stepElement.addEventListener('click', () => {
          goToStep(index);
          if (onChangeCallback) {
            onChangeCallback(formData, 'navigate');
          }
        });
      }

      item.appendChild(stepElement);
      list.appendChild(item);
    });

    container.appendChild(list);
  }

  function buildContent(container) {
    const step = steps[currentStep];
    if (!step) {
      return;
    }

    container.replaceChildren();

    const header = document.createElement('div');
    header.className = 'wizard-step-header';

    const heading = document.createElement('h3');
    heading.className = 'wizard-step-heading';
    heading.tabIndex = -1;
    heading.textContent = step.title;
    const description = document.createElement('p');
    description.className = 'help-text';
    description.textContent = step.description;

    header.appendChild(heading);
    header.appendChild(description);
    container.appendChild(header);

    if (step.fields.some(path => FormBuilder.isReadOnly(path))) {
      const inheritedNote = document.createElement('p');
      inheritedNote.className = 'help-text inherited-note';
      inheritedNote.textContent =
        'Project information is inherited from the parent Security Insights file and is read-only.';
      container.appendChild(inheritedNote);
    }

    if (step.id === 'review') {
      buildReviewStep(container);
      return;
    }

    const fieldsContainer = document.createElement('div');
    fieldsContainer.className = 'wizard-fields';
    step.fields.forEach(fieldPath => {
      const fieldElement = buildWizardField(fieldPath);
      if (fieldElement) {
        fieldsContainer.appendChild(fieldElement);
      }
    });
    container.appendChild(fieldsContainer);
  }

  function buildWizardField(path) {
    const parts = path.split('.');
    let typeDef = schema.getType('#SecurityInsights');
    let field = null;

    for (const part of parts) {
      if (typeDef && typeDef.kind === 'reference') {
        typeDef = schema.resolveType(typeDef);
      }
      if (!typeDef || typeDef.kind !== 'struct' || !typeDef.fields) {
        return null;
      }

      field = typeDef.fields[part];
      if (!field) {
        return null;
      }
      typeDef = field.kind === 'reference' ? schema.resolveType(field) : field;
    }

    const fieldName = parts[parts.length - 1];
    if (typeDef && typeDef.kind === 'struct') {
      const container = document.createElement('div');
      container.className = 'wizard-field';
      container.dataset.path = path;

      const fieldHeader = document.createElement('div');
      fieldHeader.className = 'wizard-field-header';
      const heading = document.createElement('h4');
      heading.id = `wizard-group-${path.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
      container.setAttribute('role', 'group');
      container.setAttribute('aria-labelledby', heading.id);
      heading.textContent = FormBuilder.toLabel(fieldName);
      fieldHeader.appendChild(heading);
      if (field.description) {
        const description = document.createElement('p');
        description.className = 'field-description';
        description.textContent = field.description;
        fieldHeader.appendChild(description);
      }
      container.appendChild(fieldHeader);

      const fields = document.createElement('div');
      fields.className = 'wizard-struct-fields';
      for (const [subFieldName, subField] of Object.entries(typeDef.fields)) {
        fields.appendChild(
          FormBuilder.buildField(subFieldName, subField, `${path}.${subFieldName}`)
        );
      }
      container.appendChild(fields);
      return container;
    }

    return FormBuilder.buildField(fieldName, field, path);
  }

  function buildReviewStep(container) {
    const summary = document.createElement('div');
    summary.className = 'wizard-review';

    const sections = [
      { title: 'Header', data: formData.header },
      { title: 'Project', data: formData.project },
      { title: 'Repository', data: formData.repository }
    ];

    sections.forEach(section => {
      if (!section.data || Object.keys(section.data).length === 0) {
        return;
      }

      const sectionElement = document.createElement('div');
      sectionElement.className = 'review-section';

      const heading = document.createElement('h4');
      heading.textContent = section.title;
      const data = document.createElement('pre');
      data.textContent = JSON.stringify(section.data, null, 2);

      sectionElement.appendChild(heading);
      sectionElement.appendChild(data);
      summary.appendChild(sectionElement);
    });

    if (summary.children.length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.textContent = 'No data entered yet. Go back to fill in the form.';
      summary.appendChild(emptyMessage);
    }

    container.appendChild(summary);
  }

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
    getStepIndexForPath,
    buildProgress,
    buildContent,
    steps
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Wizard;
}
