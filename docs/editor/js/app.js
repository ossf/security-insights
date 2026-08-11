/**
 * Security Insights Editor application lifecycle.
 */
const App = (function () {
  'use strict';

  const DEFAULT_SCHEMA_URL =
    'https://raw.githubusercontent.com/ossf/security-insights/main/spec/schema.cue';

  let schema = null;
  let currentMode = 'form';
  let validationInterval = null;
  let lastValidation = null;
  let schemaLoadId = 0;
  let elements = {};

  const state = {
    exportData: {},
    displayData: {},
    readOnlyPaths: [],
    dataLoaded: false,
    loadId: 0,
    loadController: null,
    pendingParent: null
  };

  async function init() {
    elements = {
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
      parentFetchBtn: document.getElementById('parent-fetch-btn'),
      parentFileInput: document.getElementById('parent-file-input'),
      parentBrowseBtn: document.getElementById('parent-browse-btn'),
      skipParentBtn: document.getElementById('skip-parent-btn'),
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
      minimalOutput: document.getElementById('minimal-output'),
      copyYamlBtn: document.getElementById('copy-yaml-btn'),
      downloadYamlBtn: document.getElementById('download-yaml-btn'),
      yamlOutput: document.getElementById('yaml-output'),
      errorPanel: document.getElementById('error-panel'),
      errorList: document.getElementById('error-list')
    };

    bindEventHandlers();
    setSchemaControlsEnabled(false);
    updateModeUI(false);
    await loadSchema();
    startValidationInterval();
  }

  function bindEventHandlers() {
    elements.reloadSchemaBtn.addEventListener('click', loadSchema);
    elements.modeForm.addEventListener('click', () => setMode('form'));
    elements.modeWizard.addEventListener('click', () => setMode('wizard'));
    elements.browseBtn.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileSelect);
    elements.dropZone.addEventListener('dragover', handleDragOver);
    elements.dropZone.addEventListener('dragleave', handleDragLeave);
    elements.dropZone.addEventListener('drop', handleDrop);
    elements.loadUrlBtn.addEventListener('click', handleUrlLoad);
    elements.fileUrl.addEventListener('keypress', event => {
      if (event.key === 'Enter') {
        handleUrlLoad();
      }
    });
    elements.startFreshBtn.addEventListener('click', startFresh);
    elements.loadPasteBtn.addEventListener('click', handlePasteLoad);
    elements.singleMaintainerCheckbox.addEventListener(
      'change',
      handleSingleMaintainerToggle
    );
    elements.parentFetchBtn.addEventListener('click', fetchPendingParent);
    elements.parentBrowseBtn.addEventListener(
      'click',
      () => elements.parentFileInput.click()
    );
    elements.parentFileInput.addEventListener('change', handleParentFileSelect);
    elements.skipParentBtn.addEventListener('click', skipParentFile);
    elements.wizardPrev.addEventListener('click', wizardPrev);
    elements.wizardNext.addEventListener('click', wizardNext);
    elements.minimalOutput.addEventListener('change', () => {
      YamlExport.setMinimalMode(elements.minimalOutput.checked);
      updatePreview();
      runValidation();
    });
    elements.copyYamlBtn.addEventListener('click', copyYaml);
    elements.downloadYamlBtn.addEventListener('click', downloadYaml);
  }

  function setSchemaControlsEnabled(enabled) {
    [
      elements.modeForm,
      elements.modeWizard,
      elements.fileInput,
      elements.browseBtn,
      elements.fileUrl,
      elements.loadUrlBtn,
      elements.startFreshBtn,
      elements.yamlPaste,
      elements.loadPasteBtn,
      elements.singleMaintainerCheckbox,
      elements.parentFileInput,
      elements.parentBrowseBtn,
      elements.skipParentBtn,
      elements.minimalOutput,
      elements.copyYamlBtn,
      elements.downloadYamlBtn
    ].forEach(element => {
      if (element) {
        element.disabled = !enabled;
      }
    });
    elements.dropZone.classList.toggle('loading', !enabled);
    updateParentFetchButton(enabled);
  }

  function updateParentFetchButton(schemaReady = !!schema) {
    if (!elements.parentFetchBtn) {
      return;
    }
    const pending = state.pendingParent;
    elements.parentFetchBtn.disabled = !schemaReady
      || !pending
      || !pending.fetchUrl;
  }

  function deriveVersionUrl(schemaUrl) {
    try {
      const url = new URL(schemaUrl);
      if (!url.pathname.endsWith('/spec/schema.cue')) {
        return null;
      }
      url.pathname = url.pathname.replace(/\/spec\/schema\.cue$/, '/VERSION');
      return url.toString();
    } catch (error) {
      return null;
    }
  }

  async function fetchSchemaVersion(schemaUrl) {
    const versionUrl = deriveVersionUrl(schemaUrl);
    if (!versionUrl) {
      return null;
    }
    try {
      const response = await fetch(versionUrl);
      if (!response.ok) {
        return null;
      }
      const version = (await response.text()).trim();
      return /^v?[1-9][0-9]*\.[0-9]+\.[0-9]+$/.test(version)
        ? version.replace(/^v/, '')
        : null;
    } catch (error) {
      return null;
    }
  }

  async function loadSchema() {
    const requestId = ++schemaLoadId;
    const url = elements.schemaUrl.value.trim() || DEFAULT_SCHEMA_URL;
    setSchemaControlsEnabled(false);
    setStatus('loading', 'Loading schema...');

    try {
      const [response, version] = await Promise.all([
        fetch(url),
        fetchSchemaVersion(url)
      ]);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const source = await response.text();
      if (requestId !== schemaLoadId) {
        return;
      }
      schema = CueParser.parse(source, { version });
    } catch (error) {
      if (requestId !== schemaLoadId) {
        return;
      }
      console.warn('Failed to fetch schema, using generated fallback:', error);
      schema = SchemaFallback;
      showToast('Schema fetch failed; using the generated fallback schema.', 'warning');
    }

    FormBuilder.init(schema, handleFormChange);
    FormBuilder.setReadOnlyPaths(state.readOnlyPaths);
    Wizard.init(schema, handleWizardChange, { resetStep: false });
    YamlExport.init(schema);
    setSchemaControlsEnabled(true);

    if (state.dataLoaded) {
      rebuildActiveMode();
      updatePreview();
      runValidation();
    } else {
      setStatus('ready', 'Schema loaded');
    }
  }

  function setMode(mode) {
    if (!schema || (mode !== 'form' && mode !== 'wizard')) {
      return;
    }
    currentMode = mode;
    updateModeUI(state.dataLoaded);
    if (state.dataLoaded) {
      runValidation();
    }
  }

  function updateModeUI(rebuild = true) {
    elements.modeForm.classList.toggle('active', currentMode === 'form');
    elements.modeWizard.classList.toggle('active', currentMode === 'wizard');
    elements.formEditor.classList.toggle('hidden', currentMode !== 'form');
    elements.wizardEditor.classList.toggle('hidden', currentMode !== 'wizard');
    if (rebuild && state.dataLoaded) {
      rebuildActiveMode();
    }
  }

  function rebuildActiveMode() {
    if (currentMode === 'form') {
      buildForm();
    } else {
      buildWizard();
    }
  }

  function buildForm() {
    if (!schema) {
      return;
    }
    FormBuilder.setFormData(state.displayData);
    FormBuilder.setReadOnlyPaths(state.readOnlyPaths);
    FormBuilder.buildForm(elements.formSections);
  }

  function buildWizard() {
    if (!schema) {
      return;
    }
    FormBuilder.setFormData(state.displayData);
    FormBuilder.setReadOnlyPaths(state.readOnlyPaths);
    Wizard.setFormData(state.displayData);
    Wizard.buildProgress(elements.wizardProgress);
    Wizard.buildContent(elements.wizardContent);
    updateWizardNav();
  }

  function updateWizardNav() {
    elements.wizardPrev.disabled = !Wizard.canGoPrev();
    const isLastStep = Wizard.getCurrentStep() === Wizard.getTotalSteps() - 1;
    elements.wizardNext.textContent = isLastStep ? 'Finish' : 'Next';
  }

  function synchronizeEditedData(data) {
    state.displayData = data;
    state.exportData = EditorUtils.createExportData(data, state.readOnlyPaths);
    FormBuilder.setFormData(state.displayData);
    Wizard.setFormData(state.displayData);
    YamlExport.setFormData(state.exportData);
  }

  function handleFormChange(data) {
    synchronizeEditedData(data);
    updatePreview();
  }

  function handleWizardChange(data, action) {
    synchronizeEditedData(data);
    if (action === 'navigate') {
      Wizard.buildProgress(elements.wizardProgress);
      Wizard.buildContent(elements.wizardContent);
      updateWizardNav();
    }
    updatePreview();
  }

  function wizardPrev() {
    if (Wizard.prevStep()) {
      buildWizard();
    }
  }

  function wizardNext() {
    const isLastStep = Wizard.getCurrentStep() === Wizard.getTotalSteps() - 1;
    if (isLastStep) {
      setMode('form');
      showToast(
        'Wizard completed. You can make final edits and download the file.',
        'success'
      );
    } else if (Wizard.nextStep()) {
      buildWizard();
    }
  }

  function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    if (schema) {
      elements.dropZone.classList.add('dragover');
    }
  }

  function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    elements.dropZone.classList.remove('dragover');
  }

  async function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    elements.dropZone.classList.remove('dragover');
    if (!schema) {
      return;
    }
    if (event.dataTransfer.files.length > 0) {
      await loadFile(event.dataTransfer.files[0]);
    }
  }

  async function handleFileSelect(event) {
    try {
      if (event.target.files.length > 0) {
        const file = event.target.files[0];
        event.target.value = '';
        await loadFile(file);
      }
    } finally {
      event.target.value = '';
    }
  }

  function makeStaleLoadError() {
    const error = new Error('A newer document load superseded this request');
    error.name = 'StaleLoadError';
    return error;
  }

  function isStaleLoadError(error) {
    return error && (error.name === 'StaleLoadError' || error.name === 'AbortError');
  }

  function beginDocumentLoad(message) {
    state.loadId += 1;
    if (state.loadController) {
      state.loadController.abort();
    }
    if (state.pendingParent) {
      state.pendingParent.reject(makeStaleLoadError());
      state.pendingParent = null;
    }
    state.loadController = new AbortController();
    elements.parentSection.classList.add('hidden');
    setStatus('loading', message);
    updateParentFetchButton();
    return {
      id: state.loadId,
      signal: state.loadController.signal
    };
  }

  function ensureCurrentLoad(loadId) {
    if (loadId !== state.loadId) {
      throw makeStaleLoadError();
    }
  }

  async function loadFile(file) {
    const load = beginDocumentLoad('Loading file...');
    try {
      const content = await readFileContent(file);
      ensureCurrentLoad(load.id);
      const data = EditorUtils.parseYamlDocument(content);
      await handleLoadedDocument(data, load.id);
      ensureCurrentLoad(load.id);
      showToast('YAML file loaded successfully.', 'success');
    } catch (error) {
      handleLoadError(error, 'Failed to load file');
    }
  }

  function readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = event => resolve(event.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  function convertToRawGitHubUrl(url) {
    const blobMatch = url.match(
      /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/(.+)$/
    );
    if (blobMatch) {
      const [, owner, repo, rest] = blobMatch;
      return `https://raw.githubusercontent.com/${owner}/${repo}/${rest}`;
    }

    const treeMatch = url.match(
      /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/(.+)$/
    );
    if (treeMatch) {
      const [, owner, repo, rest] = treeMatch;
      return `https://raw.githubusercontent.com/${owner}/${repo}/${rest}`;
    }
    return url;
  }

  function normalizeHttpUrl(value) {
    if (typeof value !== 'string') {
      return null;
    }
    try {
      const url = new URL(value);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return null;
      }
      return convertToRawGitHubUrl(url.toString());
    } catch (error) {
      return null;
    }
  }

  async function handleUrlLoad() {
    const enteredUrl = elements.fileUrl.value.trim();
    const url = normalizeHttpUrl(enteredUrl);
    if (!url) {
      showToast('Please enter a valid http(s) URL.', 'error');
      return;
    }

    const load = beginDocumentLoad('Loading from URL...');
    try {
      const response = await fetch(url, { signal: load.signal });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = EditorUtils.parseYamlDocument(await response.text());
      ensureCurrentLoad(load.id);
      await handleLoadedDocument(data, load.id);
      ensureCurrentLoad(load.id);
      showToast('YAML URL loaded successfully.', 'success');
    } catch (error) {
      handleLoadError(error, 'Failed to load URL');
    }
  }

  async function handlePasteLoad() {
    const content = elements.yamlPaste.value.trim();
    if (!content) {
      showToast('Please paste YAML content first.', 'error');
      return;
    }

    const load = beginDocumentLoad('Parsing YAML...');
    try {
      const data = EditorUtils.parseYamlDocument(content);
      await handleLoadedDocument(data, load.id);
      ensureCurrentLoad(load.id);
      showToast('Pasted YAML loaded successfully.', 'success');
    } catch (error) {
      handleLoadError(error, 'Failed to parse YAML');
    }
  }

  function handleLoadError(error, prefix) {
    if (isStaleLoadError(error)) {
      return;
    }
    console.error(prefix, error);
    setStatus('error', `Error: ${error.message}`);
    showToast(`${prefix}: ${error.message}`, 'error');
  }

  function getProjectSource(data) {
    return data
      && EditorUtils.isPlainMapping(data.header)
      && data.header['project-si-source'] !== undefined
      && data.header['project-si-source'] !== null
      && data.header['project-si-source'] !== ''
      ? data.header['project-si-source']
      : null;
  }

  async function handleLoadedDocument(childData, loadId) {
    ensureCurrentLoad(loadId);
    const source = getProjectSource(childData);
    if (source === null) {
      finishDocumentLoad(childData, null, loadId);
      return;
    }
    await requestParentDecision(childData, source, loadId);
  }

  function requestParentDecision(childData, source, loadId) {
    ensureCurrentLoad(loadId);
    const declaredUrl = typeof source === 'string' ? source : String(source);
    const fetchUrl = normalizeHttpUrl(source);
    elements.parentUrl.textContent = declaredUrl;
    elements.parentSection.classList.remove('hidden');
    setStatus(
      'warning',
      fetchUrl
        ? 'Choose how to handle the referenced parent file.'
        : 'The parent URL is invalid. Upload the parent file or skip it.'
    );

    return new Promise((resolve, reject) => {
      state.pendingParent = {
        loadId,
        childData: EditorUtils.cloneData(childData),
        declaredUrl,
        fetchUrl,
        resolve,
        reject
      };
      updateParentFetchButton();
      if (!fetchUrl) {
        showToast(
          'project-si-source must be a valid http(s) URL before it can be fetched.',
          'warning'
        );
      }
    });
  }

  function requirePendingParent() {
    const pending = state.pendingParent;
    if (!pending) {
      const error = new Error('No pending child document is waiting for a parent');
      setStatus('error', error.message);
      showToast(error.message, 'error');
      throw error;
    }
    ensureCurrentLoad(pending.loadId);
    return pending;
  }

  async function fetchPendingParent() {
    let pending;
    try {
      pending = requirePendingParent();
      if (!pending.fetchUrl) {
        throw new Error('The parent URL is not a valid http(s) URL');
      }
      setStatus('loading', 'Fetching parent file with your consent...');
      const response = await fetch(pending.fetchUrl, {
        signal: state.loadController.signal
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const parentData = EditorUtils.parseYamlDocument(await response.text());
      ensureCurrentLoad(pending.loadId);
      completePendingParent(parentData, pending);
    } catch (error) {
      if (isStaleLoadError(error)) {
        return;
      }
      console.error('Failed to fetch parent file:', error);
      setStatus('error', `Parent fetch failed: ${error.message}`);
      showToast(`Failed to fetch parent file: ${error.message}`, 'error');
    }
  }

  async function handleParentFileSelect(event) {
    let pending;
    try {
      if (event.target.files.length === 0) {
        return;
      }
      pending = requirePendingParent();
      setStatus('loading', 'Loading uploaded parent file...');
      const content = await readFileContent(event.target.files[0]);
      const parentData = EditorUtils.parseYamlDocument(content);
      ensureCurrentLoad(pending.loadId);
      completePendingParent(parentData, pending);
    } catch (error) {
      if (!isStaleLoadError(error)) {
        console.error('Failed to load parent file:', error);
        setStatus('error', `Parent upload failed: ${error.message}`);
        showToast(`Failed to load parent file: ${error.message}`, 'error');
      }
    } finally {
      event.target.value = '';
    }
  }

  function skipParentFile() {
    try {
      completePendingParent(null);
      showToast(
        'Continuing without the parent project context. The child export is unchanged.',
        'warning'
      );
    } catch (error) {
      if (!isStaleLoadError(error)) {
        console.error('Failed to skip parent file:', error);
      }
    }
  }

  function completePendingParent(parentData, expectedPending = null) {
    const pending = requirePendingParent();
    if (expectedPending && pending !== expectedPending) {
      throw makeStaleLoadError();
    }
    state.pendingParent = null;
    elements.parentSection.classList.add('hidden');
    updateParentFetchButton();
    finishDocumentLoad(pending.childData, parentData, pending.loadId);
    pending.resolve();
    if (parentData && !EditorUtils.isPlainMapping(parentData.project)) {
      showToast('The parent file does not contain project information.', 'warning');
    }
  }

  function finishDocumentLoad(childData, parentData, loadId) {
    ensureCurrentLoad(loadId);
    const presentation = EditorUtils.createDisplayData(childData, parentData);
    state.exportData = EditorUtils.cloneData(childData);
    state.displayData = presentation.displayData;
    state.readOnlyPaths = presentation.readOnlyPaths;
    state.dataLoaded = true;
    FormBuilder.setReadOnlyPaths(state.readOnlyPaths);
    FormBuilder.setFormData(state.displayData);
    Wizard.setFormData(state.displayData);
    YamlExport.setFormData(state.exportData);
    elements.inputSection.classList.add('hidden');
    elements.editorMain.classList.remove('hidden');
    updateModeUI(true);
    updatePreview();
    runValidation();
  }

  function handleSingleMaintainerToggle() {
    elements.singleMaintainerFields.classList.toggle(
      'hidden',
      !elements.singleMaintainerCheckbox.checked
    );
  }

  function getSingleMaintainerInfo() {
    if (!elements.singleMaintainerCheckbox.checked) {
      return null;
    }
    const name = elements.maintainerName.value.trim();
    const email = elements.maintainerEmail.value.trim();
    const affiliation = elements.maintainerAffiliation.value.trim();
    if (!name && !email && !affiliation) {
      return null;
    }
    return { name, email, affiliation };
  }

  function startFresh() {
    const load = beginDocumentLoad('Starting a new document...');
    const today = new Date().toISOString().split('T')[0];
    const data = EditorUtils.createFreshDocument(
      schema && schema.version,
      today,
      getSingleMaintainerInfo()
    );
    finishDocumentLoad(data, null, load.id);
    if (!schema || !schema.version) {
      showToast(
        'The loaded schema has no version metadata. Enter schema-version before export.',
        'warning'
      );
    } else {
      showToast('Started a new Security Insights document.', 'success');
    }
  }

  function updatePreview() {
    if (!schema || !state.dataLoaded) {
      return;
    }
    YamlExport.setFormData(state.exportData);
    YamlExport.updatePreview(elements.yamlOutput);
  }

  function startValidationInterval() {
    if (validationInterval) {
      clearInterval(validationInterval);
    }
    validationInterval = setInterval(runValidation, 5000);
  }

  function runValidation() {
    if (!schema || !state.dataLoaded) {
      return [];
    }
    YamlExport.setFormData(state.exportData);
    const errors = YamlExport.validate();
    lastValidation = new Date();
    if (errors.length === 0) {
      setStatus('valid', 'Valid');
      elements.errorPanel.classList.add('hidden');
    } else {
      setStatus('invalid', `${errors.length} error(s)`);
      showErrors(errors);
    }
    elements.lastValidated.textContent =
      `Last validated: ${lastValidation.toLocaleTimeString()}`;
    markFieldErrors(errors);
    return errors;
  }

  function showErrors(errors) {
    elements.errorList.replaceChildren();
    errors.forEach(error => {
      const item = document.createElement('li');
      const path = document.createElement('strong');
      path.textContent = `${error.path || 'Root'}:`;
      item.appendChild(path);
      item.appendChild(document.createTextNode(` ${error.message}`));
      item.addEventListener('click', () => scrollToField(error.path));
      item.style.cursor = 'pointer';
      elements.errorList.appendChild(item);
    });
    elements.errorPanel.classList.remove('hidden');
  }

  function markFieldErrors(errors) {
    document.querySelectorAll('[data-path].has-error').forEach(element => {
      element.classList.remove('has-error');
      const message = element.querySelector('[data-validation-error]');
      if (message) {
        message.remove();
      }
    });

    errors.forEach(error => {
      const root = currentMode === 'form' ? elements.formEditor : elements.wizardEditor;
      const field = EditorUtils.findByDataPath(root, error.path);
      if (!field) {
        return;
      }
      field.classList.add('has-error');
      if (!field.querySelector('[data-validation-error]')) {
        const message = document.createElement('div');
        message.className = 'field-error';
        message.dataset.validationError = 'true';
        message.textContent = error.message;
        field.appendChild(message);
      }
    });
  }

  function scrollToField(path) {
    const root = currentMode === 'form' ? elements.formEditor : elements.wizardEditor;
    const field = EditorUtils.findByDataPath(root, path);
    if (!field) {
      return;
    }
    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
    field.classList.add('highlight');
    setTimeout(() => field.classList.remove('highlight'), 2000);
  }

  function setStatus(type, message) {
    elements.statusIcon.className = 'status-icon';
    if (type === 'valid') {
      elements.statusIcon.classList.add('valid');
      elements.statusIcon.textContent = '●';
    } else if (type === 'invalid' || type === 'error') {
      elements.statusIcon.classList.add('invalid');
      elements.statusIcon.textContent = type === 'error' ? '✕' : '●';
    } else if (type === 'loading' || type === 'warning') {
      elements.statusIcon.classList.add('warning');
      elements.statusIcon.textContent = type === 'loading' ? '○' : '●';
    } else {
      elements.statusIcon.textContent = '●';
    }
    elements.statusText.textContent = message;
  }

  async function copyYaml() {
    const success = await YamlExport.copyToClipboard();
    showToast(
      success ? 'YAML copied to clipboard.' : 'Failed to copy YAML.',
      success ? 'success' : 'error'
    );
  }

  function downloadYaml() {
    YamlExport.download();
    showToast('YAML download started.', 'success');
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    getFormData: () => state.exportData,
    getDisplayData: () => state.displayData,
    getSchema: () => schema,
    runValidation
  };
})();
