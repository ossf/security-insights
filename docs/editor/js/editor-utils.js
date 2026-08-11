/**
 * Shared helpers for the Security Insights editor.
 */
const EditorUtils = (function () {
  'use strict';

  function normalizePath(path) {
    if (typeof path !== 'string' || path.length === 0) {
      return [];
    }

    return path
      .replace(/\[(\d+)\]/g, '.$1')
      .split('.')
      .filter(Boolean);
  }

  function getNestedValue(obj, path) {
    return normalizePath(path).reduce((current, key) => {
      return current !== null
        && current !== undefined
        && current[key] !== undefined
        ? current[key]
        : undefined;
    }, obj);
  }

  function setNestedValue(obj, path, value) {
    if (!obj || typeof obj !== 'object') {
      throw new TypeError('Cannot set a value on a non-object document');
    }

    const keys = normalizePath(path);
    const lastKey = keys.pop();
    if (lastKey === undefined) {
      throw new TypeError('Cannot set a value without a path');
    }

    const parent = keys.reduce((current, key, index) => {
      if (!current || typeof current !== 'object') {
        throw new TypeError(`Cannot set "${path}" through a non-object value`);
      }

      if (current[key] === undefined) {
        const nextKey = keys[index + 1] !== undefined ? keys[index + 1] : lastKey;
        current[key] = /^\d+$/.test(nextKey) ? [] : {};
      } else if (current[key] === null || typeof current[key] !== 'object') {
        throw new TypeError(`Cannot set "${path}" through a non-object value`);
      }

      return current[key];
    }, obj);

    parent[lastKey] = value;
  }

  function deleteNestedValue(obj, path) {
    const keys = normalizePath(path);
    const lastKey = keys.pop();
    if (lastKey === undefined) {
      return;
    }

    const parent = keys.reduce((current, key) => {
      return current !== null
        && current !== undefined
        && current[key] !== undefined
        ? current[key]
        : undefined;
    }, obj);

    if (parent && typeof parent === 'object' && lastKey in parent) {
      if (Array.isArray(parent) && /^\d+$/.test(lastKey)) {
        parent.splice(Number(lastKey), 1);
      } else {
        delete parent[lastKey];
      }
    }
  }

  function isPlainMapping(value) {
    return value !== null
      && typeof value === 'object'
      && !Array.isArray(value)
      && Object.getPrototypeOf(value) === Object.prototype;
  }

  function parseYamlDocument(content, yamlParser) {
    const parser = yamlParser || globalThis.jsyaml;
    if (!parser || typeof parser.load !== 'function' || !parser.CORE_SCHEMA) {
      throw new Error('YAML parser is not available');
    }

    const data = parser.load(content, { schema: parser.CORE_SCHEMA });
    if (!isPlainMapping(data)) {
      throw new Error('Invalid YAML: expected a top-level mapping');
    }

    return data;
  }

  function cloneData(value) {
    if (Array.isArray(value)) {
      return value.map(cloneData);
    }

    if (isPlainMapping(value)) {
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, cloneData(item)])
      );
    }

    return value;
  }

  function getSchemaVersion(data, schema) {
    const documentVersion = data
      && data.header
      && data.header['schema-version'];
    const version = documentVersion || (schema && schema.version);
    return version ? String(version).replace(/^v/, '') : null;
  }

  function createFreshDocument(schemaVersion, today, maintainer) {
    const contact = maintainer
      ? {
        name: maintainer.name || '',
        primary: true,
        ...(maintainer.affiliation ? { affiliation: maintainer.affiliation } : {}),
        ...(maintainer.email ? { email: maintainer.email } : {})
      }
      : null;

    return {
      header: {
        'schema-version': schemaVersion
          ? String(schemaVersion).replace(/^v/, '')
          : '',
        'last-updated': today,
        'last-reviewed': today,
        url: ''
      },
      project: {
        name: '',
        administrators: contact ? [cloneData(contact)] : [],
        repositories: [],
        'vulnerability-reporting': {
          'reports-accepted': contact ? true : false,
          'bug-bounty-available': false,
          ...(contact
            ? {
              'in-scope': [],
              'out-of-scope': [],
              comment: '',
              policy: '',
              contact: cloneData(contact)
            }
            : {})
        }
      },
      repository: {
        status: '',
        url: '',
        'accepts-change-request': false,
        'accepts-automated-change-request': false,
        'core-team': contact ? [cloneData(contact)] : [],
        license: {
          url: '',
          expression: ''
        },
        security: {
          assessments: {
            self: {
              comment: ''
            }
          }
        }
      }
    };
  }

  function createDisplayData(childData, parentData) {
    const displayData = cloneData(childData);
    const hasChildProject = Object.prototype.hasOwnProperty.call(childData, 'project');
    const inheritedProject = parentData
      && isPlainMapping(parentData.project)
      && !hasChildProject;

    if (inheritedProject) {
      displayData.project = cloneData(parentData.project);
    }

    return {
      displayData,
      readOnlyPaths: inheritedProject ? ['project'] : []
    };
  }

  function createExportData(displayData, readOnlyPaths = []) {
    const exportData = cloneData(displayData);
    for (const path of readOnlyPaths) {
      deleteNestedValue(exportData, path);
    }
    return exportData;
  }

  function findByDataPath(root, path) {
    if (!root || typeof root.querySelectorAll !== 'function') {
      return null;
    }

    return Array.from(root.querySelectorAll('[data-path]'))
      .find(element => element.dataset.path === path) || null;
  }

  function isPathWithin(path, prefix) {
    return path === prefix
      || path.startsWith(`${prefix}.`)
      || path.startsWith(`${prefix}[`);
  }

  return {
    normalizePath,
    getNestedValue,
    setNestedValue,
    deleteNestedValue,
    isPlainMapping,
    parseYamlDocument,
    cloneData,
    getSchemaVersion,
    createFreshDocument,
    createDisplayData,
    createExportData,
    findByDataPath,
    isPathWithin
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EditorUtils;
}
