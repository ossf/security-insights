/**
 * Security Insights Editor - Main Application
 *
 * Coordinates all modules:
 * - CUE Parser / Schema Fallback for schema loading
 * - FormBuilder for dynamic form generation
 * - Wizard for guided mode
 * - YamlExport for YAML generation and validation
 *
 * Features:
 * - Drag-and-drop file loading
 * - URL-based file loading
 * - Multi-repository support with parent file inheritance
 * - 5-second validation interval
 * - Mode switching (Form Editor / Wizard)
 */

const App = (function () {
  'use strict';

  // State
  let schema = null;
  let formData = {};
  let currentMode = 'form'; // 'form' or 'wizard'
  let validationInterval = null;
  let lastValidation = null;

  // Default schema URL
  const DEFAULT_SCHEMA_URL = 'https://raw.githubusercontent.com/ossf/security-insights/main/spec/schema.cue';

  // DOM Elements
  let elements = {};

  // Single maintainer info (for auto-populating)
  let singleMaintainerInfo = null;

  /**
   * Initialize the application
   */
  async function init() {
    // Cache DOM elements
    elements = {
      configPanel: document.getElementById('config-panel'),
      schemaUrl: document.getElementById('schema-url'),
      reloadSchemaBtn: document.getElementById('reload-schema-btn'),
      modeForm: document.getElementById('mode-form'),
      modeWizard: document.getElementById('mode-wizard'),
      inputSection: document.getElementById('input-section'),
      dropZone: document.getElementById('drop-zone'),
      fileInput: document.getElementById('file-input'),
      browseBtn: document.getElementById('browse-btn'),
      fileUrl: document.getElementById('file-url'),
      loadUrlBtn: document.getElementById('load-url-btn'),
      startFreshBtn: document.getElementById('start-fresh-btn'),
      yamlPaste: document.getElementById('yaml-paste'),
      loadPasteBtn: document.getElementById('load-paste-btn'),
      singleMaintainerCheckbox: document.getElementById('single-maintainer-checkbox'),
      singleMaintainerFields: document.getElementById('single-maintainer-fields'),
      maintainerName: document.getElementById('maintainer-name'),
      maintainerEmail: document.getElementById('maintainer-email'),
      maintainerAffiliation: document.getElementById('maintainer-affiliation'),
      parentSection: document.getElementById('parent-section'),
      parentUrl: document.getElementById('parent-url'),
      parentFileInput: document.getElementById('parent-file-input'),
      parentBrowseBtn: document.getElementById('parent-browse-btn'),
      skipParentBtn: document.getElementById('skip-parent-btn'),
      validationStatus: document.getElementById('validation-status'),
      statusIcon: document.getElementById('status-icon'),
      statusText: document.getElementById('status-text'),
      lastValidated: document.getElementById('last-validated'),
      editorMain: document.getElementById('editor-main'),
      formEditor: document.getElementById('form-editor'),
      formSections: document.getElementById('form-sections'),
      wizardEditor: document.getElementById('wizard-editor'),
      wizardProgress: document.getElementById('wizard-progress'),
      wizardContent: document.getElementById('wizard-content'),
      wizardPrev: document.getElementById('wizard-prev'),
      wizardNext: document.getElementById('wizard-next'),
      previewPanel: document.getElementById('preview-panel'),
      minimalOutput: document.getElementById('minimal-output'),
      copyYamlBtn: document.getElementById('copy-yaml-btn'),
      downloadYamlBtn: document.getElementById('download-yaml-btn'),
      yamlOutput: document.getElementById('yaml-output'),
      errorPanel: document.getElementById('error-panel'),
      errorList: document.getElementById('error-list')
    };

    // Bind event handlers
    bindEventHandlers();

    // Load schema
    await loadSchema();

    // Start validation interval
    startValidationInterval();

    // Initial UI state
    updateModeUI();
    updatePreview();
  }

  /**
   * Bind all event handlers
   */
  function bindEventHandlers() {
    // Schema reload
    elements.reloadSchemaBtn.addEventListener('click', loadSchema);

    // Mode switching
    elements.modeForm.addEventListener('click', () => setMode('form'));
    elements.modeWizard.addEventListener('click', () => setMode('wizard'));

    // File input
    elements.browseBtn.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop
    elements.dropZone.addEventListener('dragover', handleDragOver);
    elements.dropZone.addEventListener('dragleave', handleDragLeave);
    elements.dropZone.addEventListener('drop', handleDrop);

    // URL loading
    elements.loadUrlBtn.addEventListener('click', handleUrlLoad);
    elements.fileUrl.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleUrlLoad();
    });

    // Start fresh
    elements.startFreshBtn.addEventListener('click', startFresh);

    // Paste YAML loading
    elements.loadPasteBtn.addEventListener('click', handlePasteLoad);

    // Single maintainer checkbox
    elements.singleMaintainerCheckbox.addEventListener('change', handleSingleMaintainerToggle);

    // Parent file handling
    elements.parentBrowseBtn.addEventListener('click', () => elements.parentFileInput.click());
    elements.parentFileInput.addEventListener('change', handleParentFileSelect);
    elements.skipParentBtn.addEventListener('click', skipParentFile);

    // Wizard navigation
    elements.wizardPrev.addEventListener('click', wizardPrev);
    elements.wizardNext.addEventListener('click', wizardNext);

    // YAML export options
    elements.minimalOutput.addEventListener('change', () => {
      YamlExport.setMinimalMode(elements.minimalOutput.checked);
      updatePreview();
    });
    elements.copyYamlBtn.addEventListener('click', copyYaml);
    elements.downloadYamlBtn.addEventListener('click', downloadYaml);
  }

  /**
   * Load schema from URL or fallback
   */
  async function loadSchema() {
    const url = elements.schemaUrl.value || DEFAULT_SCHEMA_URL;
    setStatus('loading', 'Loading schema...');

    try {
      schema = await CueParser.fetchAndParse(url);
      console.log('Schema loaded from URL:', url);
    } catch (error) {
      console.warn('Failed to fetch schema, using fallback:', error);
      schema = SchemaFallback;
    }

    // Initialize modules with schema
    FormBuilder.init(schema, handleFormChange);
    Wizard.init(schema, handleWizardChange);
    YamlExport.init(schema);

    // Rebuild form if we have data
    if (Object.keys(formData).length > 0) {
      buildForm();
    }

    setStatus('ready', 'Schema loaded');
  }

  /**
   * Set editor mode
   */
  function setMode(mode) {
    currentMode = mode;
    updateModeUI();
  }

  /**
   * Update UI based on current mode
   */
  function updateModeUI() {
    // Update mode buttons
    elements.modeForm.classList.toggle('active', currentMode === 'form');
    elements.modeWizard.classList.toggle('active', currentMode === 'wizard');

    // Show/hide editors
    elements.formEditor.classList.toggle('hidden', currentMode !== 'form');
    elements.wizardEditor.classList.toggle('hidden', currentMode !== 'wizard');

    // Rebuild current mode
    if (currentMode === 'form') {
      buildForm();
    } else {
      buildWizard();
    }
  }

  /**
   * Build the form editor
   */
  function buildForm() {
    if (!schema) return;
    FormBuilder.setFormData(formData);
    FormBuilder.buildForm(elements.formSections);
  }

  /**
   * Build the wizard
   */
  function buildWizard() {
    if (!schema) return;
    Wizard.setFormData(formData);
    Wizard.buildProgress(elements.wizardProgress);
    Wizard.buildContent(elements.wizardContent);
    updateWizardNav();
  }

  /**
   * Update wizard navigation buttons
   */
  function updateWizardNav() {
    elements.wizardPrev.disabled = !Wizard.canGoPrev();

    const isLastStep = Wizard.getCurrentStep() === Wizard.getTotalSteps() - 1;
    elements.wizardNext.textContent = isLastStep ? 'Finish' : 'Next';
  }

  /**
   * Handle form data changes
   */
  function handleFormChange(data) {
    formData = data;
    FormBuilder.setFormData(formData);
    Wizard.setFormData(formData);
    YamlExport.setFormData(formData);
    updatePreview();
  }

  /**
   * Handle wizard changes
   */
  function handleWizardChange(data, action) {
    formData = data;
    FormBuilder.setFormData(formData);
    Wizard.setFormData(formData);
    YamlExport.setFormData(formData);

    if (action === 'navigate') {
      Wizard.buildProgress(elements.wizardProgress);
      Wizard.buildContent(elements.wizardContent);
      updateWizardNav();
    }

    updatePreview();
  }

  /**
   * Wizard previous step
   */
  function wizardPrev() {
    if (Wizard.prevStep()) {
      Wizard.buildProgress(elements.wizardProgress);
      Wizard.buildContent(elements.wizardContent);
      updateWizardNav();
    }
  }

  /**
   * Wizard next step
   */
  function wizardNext() {
    const isLastStep = Wizard.getCurrentStep() === Wizard.getTotalSteps() - 1;

    if (isLastStep) {
      // On finish, switch to form mode for final editing
      setMode('form');
      showToast('Wizard completed! You can now make final edits and download your file.', 'success');
    } else if (Wizard.nextStep()) {
      Wizard.buildProgress(elements.wizardProgress);
      Wizard.buildContent(elements.wizardContent);
      updateWizardNav();
    }
  }

  /**
   * Handle drag over
   */
  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.dropZone.classList.add('dragover');
  }

  /**
   * Handle drag leave
   */
  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.dropZone.classList.remove('dragover');
  }

  /**
   * Handle file drop
   */
  async function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.dropZone.classList.remove('dragover');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await loadFile(files[0]);
    }
  }

  /**
   * Handle file select from input
   */
  async function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
      await loadFile(files[0]);
    }
  }

  /**
   * Load a file
   */
  async function loadFile(file) {
    try {
      setStatus('loading', 'Loading file...');
      const content = await readFileContent(file);
      const data = jsyaml.load(content);

      // Check for project-si-source (parent file)
      if (data.header && data.header['project-si-source']) {
        await handleParentSiSource(data);
      } else {
        formData = data;
        onDataLoaded();
      }
    } catch (error) {
      console.error('Error loading file:', error);
      setStatus('error', `Error: ${error.message}`);
      showToast(`Failed to load file: ${error.message}`, 'error');
    }
  }

  /**
   * Read file content as text
   */
  function readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Convert GitHub blob/tree URLs to raw content URLs
   * e.g., https://github.com/owner/repo/blob/branch/path/file.yml
   * becomes https://raw.githubusercontent.com/owner/repo/branch/path/file.yml
   */
  function convertToRawGitHubUrl(url) {
    // Match GitHub blob URLs: github.com/owner/repo/blob/ref/path
    const blobMatch = url.match(/^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/(.+)$/);
    if (blobMatch) {
      const [, owner, repo, rest] = blobMatch;
      return `https://raw.githubusercontent.com/${owner}/${repo}/${rest}`;
    }

    // Match GitHub tree URLs (for directories, though we can't fetch those)
    const treeMatch = url.match(/^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/tree\/(.+)$/);
    if (treeMatch) {
      const [, owner, repo, rest] = treeMatch;
      return `https://raw.githubusercontent.com/${owner}/${repo}/${rest}`;
    }

    // Return original URL if not a GitHub blob/tree URL
    return url;
  }

  /**
   * Handle URL load button
   */
  async function handleUrlLoad() {
    let url = elements.fileUrl.value.trim();
    if (!url) {
      showToast('Please enter a URL', 'error');
      return;
    }

    // Convert GitHub blob URLs to raw content URLs
    url = convertToRawGitHubUrl(url);

    try {
      setStatus('loading', 'Loading from URL...');
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const content = await response.text();
      const data = jsyaml.load(content);

      // Check for project-si-source
      if (data.header && data.header['project-si-source']) {
        await handleParentSiSource(data);
      } else {
        formData = data;
        onDataLoaded();
      }
    } catch (error) {
      console.error('Error loading URL:', error);
      setStatus('error', `Error: ${error.message}`);
      showToast(`Failed to load URL: ${error.message}`, 'error');
    }
  }

  /**
   * Handle parent SI source
   */
  async function handleParentSiSource(childData) {
    let parentUrl = childData.header['project-si-source'];

    // Convert GitHub blob URLs to raw content URLs
    parentUrl = convertToRawGitHubUrl(parentUrl);

    try {
      // Try to fetch parent
      const response = await fetch(parentUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const content = await response.text();
      const parentData = jsyaml.load(content);

      // Merge parent data with child
      formData = mergeParentChild(parentData, childData);
      onDataLoaded();
    } catch (error) {
      console.warn('Failed to fetch parent SI file:', error);

      // Show parent file upload section
      elements.parentUrl.textContent = parentUrl;
      elements.parentSection.classList.remove('hidden');

      // Store child data for later merging
      window._pendingChildData = childData;
    }
  }

  /**
   * Handle parent file select
   */
  async function handleParentFileSelect(e) {
    const files = e.target.files;
    if (files.length === 0) return;

    try {
      const content = await readFileContent(files[0]);
      const parentData = jsyaml.load(content);

      // Merge with pending child data
      const childData = window._pendingChildData || {};
      formData = mergeParentChild(parentData, childData);

      elements.parentSection.classList.add('hidden');
      delete window._pendingChildData;

      onDataLoaded();
    } catch (error) {
      console.error('Error loading parent file:', error);
      showToast(`Failed to load parent file: ${error.message}`, 'error');
    }
  }

  /**
   * Skip parent file and use child data as-is
   */
  function skipParentFile() {
    const childData = window._pendingChildData || {};
    formData = childData;

    elements.parentSection.classList.add('hidden');
    delete window._pendingChildData;

    onDataLoaded();
    showToast('Proceeding without parent file. Some project data may be missing.', 'warning');
  }

  /**
   * Handle loading from pasted YAML content
   */
  function handlePasteLoad() {
    const content = elements.yamlPaste.value.trim();
    if (!content) {
      showToast('Please paste YAML content first', 'error');
      return;
    }

    try {
      setStatus('loading', 'Parsing YAML...');
      const data = jsyaml.load(content);

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid YAML: expected an object');
      }

      // Check for project-si-source (parent file)
      if (data.header && data.header['project-si-source']) {
        handleParentSiSource(data);
      } else {
        formData = data;
        onDataLoaded();
      }

      showToast('YAML loaded successfully!', 'success');
    } catch (error) {
      console.error('Error parsing pasted YAML:', error);
      setStatus('error', `Error: ${error.message}`);
      showToast(`Failed to parse YAML: ${error.message}`, 'error');
    }
  }

  /**
   * Handle single maintainer checkbox toggle
   */
  function handleSingleMaintainerToggle() {
    if (elements.singleMaintainerCheckbox.checked) {
      elements.singleMaintainerFields.classList.remove('hidden');
    } else {
      elements.singleMaintainerFields.classList.add('hidden');
      singleMaintainerInfo = null;
    }
  }

  /**
   * Get single maintainer info from the form
   */
  function getSingleMaintainerInfo() {
    if (!elements.singleMaintainerCheckbox.checked) {
      return null;
    }

    const name = elements.maintainerName.value.trim();
    const email = elements.maintainerEmail.value.trim();
    const affiliation = elements.maintainerAffiliation.value.trim();

    if (!name && !email) {
      return null;
    }

    return { name, email, affiliation: affiliation || undefined };
  }

  /**
   * Merge parent and child data
   */
  function mergeParentChild(parent, child) {
    const merged = { ...parent };

    // Child header overrides parent
    merged.header = { ...parent.header, ...child.header };

    // Child project data merges with parent
    if (child.project) {
      merged.project = { ...parent.project, ...child.project };
    }

    // Child repository overrides parent
    if (child.repository) {
      merged.repository = child.repository;
    }

    return merged;
  }

  /**
   * Start fresh with empty form
   */
  function startFresh() {
    // Initialize with today's date and schema version
    const today = new Date().toISOString().split('T')[0];

    // Get single maintainer info if provided
    singleMaintainerInfo = getSingleMaintainerInfo();

    formData = {
      header: {
        'schema-version': '2.2.0',
        'last-updated': today,
        'last-reviewed': today,
        url: ''
      }
    };

    // Pre-populate with single maintainer info if provided
    if (singleMaintainerInfo) {
      const maintainerContact = {};
      if (singleMaintainerInfo.name) maintainerContact.name = singleMaintainerInfo.name;
      if (singleMaintainerInfo.email) maintainerContact.email = singleMaintainerInfo.email;
      if (singleMaintainerInfo.affiliation) maintainerContact.affiliation = singleMaintainerInfo.affiliation;

      // Pre-populate project administrators
      formData.project = {
        administrators: [maintainerContact]
      };

      // Pre-populate repository core-team and security contacts
      formData.repository = {
        'core-team': [maintainerContact],
        security: {
          contacts: [{
            type: 'email',
            value: singleMaintainerInfo.email || ''
          }]
        }
      };

      // Also pre-populate vulnerability reporting contact
      formData.project['vulnerability-reporting'] = {
        'accepts-vulnerability-reports': true,
        'bug-bounty-available': false,
        'in-scope': [],
        'out-scope': [],
        comment: '',
        'security-policy': '',
        contacts: [{
          type: 'email',
          value: singleMaintainerInfo.email || ''
        }]
      };
    }

    onDataLoaded();
    showToast('Started fresh. Fill in the form to create your Security Insights file.', 'success');
  }

  /**
   * Called after data is loaded
   */
  function onDataLoaded() {
    FormBuilder.setFormData(formData);
    Wizard.setFormData(formData);
    YamlExport.setFormData(formData);

    // Hide input section, show editor
    elements.inputSection.classList.add('hidden');
    elements.editorMain.classList.remove('hidden');

    // Build current mode
    if (currentMode === 'form') {
      buildForm();
    } else {
      buildWizard();
    }

    updatePreview();
    runValidation();
    setStatus('valid', 'File loaded');
  }

  /**
   * Update YAML preview
   */
  function updatePreview() {
    YamlExport.setFormData(formData);
    YamlExport.updatePreview(elements.yamlOutput);
  }

  /**
   * Start validation interval (every 5 seconds)
   */
  function startValidationInterval() {
    if (validationInterval) {
      clearInterval(validationInterval);
    }
    validationInterval = setInterval(runValidation, 5000);
  }

  /**
   * Run validation
   */
  function runValidation() {
    if (!schema || Object.keys(formData).length === 0) {
      return;
    }

    YamlExport.setFormData(formData);
    const errors = YamlExport.validate();
    lastValidation = new Date();

    // Update status
    if (errors.length === 0) {
      setStatus('valid', 'Valid');
      elements.errorPanel.classList.add('hidden');
    } else {
      setStatus('invalid', `${errors.length} error(s)`);
      showErrors(errors);
    }

    // Update last validated time
    elements.lastValidated.textContent = `Last validated: ${lastValidation.toLocaleTimeString()}`;

    // Mark fields with errors
    markFieldErrors(errors);
  }

  /**
   * Show validation errors
   */
  function showErrors(errors) {
    elements.errorList.innerHTML = '';
    errors.forEach(error => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${error.path || 'Root'}:</strong> ${error.message}`;
      li.addEventListener('click', () => scrollToField(error.path));
      li.style.cursor = 'pointer';
      elements.errorList.appendChild(li);
    });
    elements.errorPanel.classList.remove('hidden');
  }

  /**
   * Mark fields with errors in the form
   */
  function markFieldErrors(errors) {
    // Clear previous errors
    document.querySelectorAll('.form-field.has-error').forEach(el => {
      el.classList.remove('has-error');
      const errorMsg = el.querySelector('.field-error');
      if (errorMsg) errorMsg.remove();
    });

    // Mark new errors
    errors.forEach(error => {
      const fieldEl = document.querySelector(`[data-path="${error.path}"]`);
      if (fieldEl) {
        fieldEl.classList.add('has-error');

        // Add error message if not present
        if (!fieldEl.querySelector('.field-error')) {
          const errorMsg = document.createElement('div');
          errorMsg.className = 'field-error';
          errorMsg.textContent = error.message;
          fieldEl.appendChild(errorMsg);
        }
      }
    });
  }

  /**
   * Scroll to a field by path
   */
  function scrollToField(path) {
    const fieldEl = document.querySelector(`[data-path="${path}"]`);
    if (fieldEl) {
      fieldEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      fieldEl.classList.add('highlight');
      setTimeout(() => fieldEl.classList.remove('highlight'), 2000);
    }
  }

  /**
   * Set validation status
   */
  function setStatus(type, message) {
    elements.statusIcon.className = 'status-icon';

    switch (type) {
      case 'valid':
        elements.statusIcon.classList.add('valid');
        elements.statusIcon.textContent = '●';
        break;
      case 'invalid':
        elements.statusIcon.classList.add('invalid');
        elements.statusIcon.textContent = '●';
        break;
      case 'loading':
        elements.statusIcon.classList.add('warning');
        elements.statusIcon.textContent = '○';
        break;
      case 'error':
        elements.statusIcon.classList.add('invalid');
        elements.statusIcon.textContent = '✕';
        break;
      default:
        elements.statusIcon.textContent = '●';
    }

    elements.statusText.textContent = message;
  }

  /**
   * Copy YAML to clipboard
   */
  async function copyYaml() {
    const success = await YamlExport.copyToClipboard();
    if (success) {
      showToast('YAML copied to clipboard!', 'success');
    } else {
      showToast('Failed to copy to clipboard', 'error');
    }
  }

  /**
   * Download YAML file
   */
  function downloadYaml() {
    YamlExport.download();
    showToast('File downloaded!', 'success');
  }

  /**
   * Show toast notification
   */
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API (for debugging)
  return {
    getFormData: () => formData,
    getSchema: () => schema,
    runValidation
  };
})();
