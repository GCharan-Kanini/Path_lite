const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const SCHEMA_PATH = path.join(__dirname, '..', '..', 'docs', 'design', 'schemas', 'hemodialysis_add_new.schema.json');

function loadSchema() {
  const raw = fs.readFileSync(SCHEMA_PATH, 'utf8');
  // The source schema file in this repo contains single backslashes in regexes
  // which makes it invalid JSON for Node's parser. To be robust we escape
  // lone backslashes (but leave already-escaped sequences intact) before parsing.
  const fixed = raw.replace(/\\(?=[^\\])/g, "\\\\");
  return JSON.parse(fixed);
}

function mapInstancePathToField(instancePath) {
  if (!instancePath) return '';
  // instancePath is like "/a/b"; map to dot notation
  const parts = instancePath.split('/').filter(Boolean);
  return parts.join('.');
}

function mapAjvErrors(errors) {
  if (!errors) return [];
  return errors.map((err) => {
    const instancePath = err.instancePath || err.dataPath || '';
    let field = mapInstancePathToField(instancePath);
    if (err.keyword === 'additionalProperties' && err.params && err.params.additionalProperty) {
      field = err.params.additionalProperty;
    }
    // If still empty, try to infer from schemaPath for required
    if (!field && err.keyword === 'required' && err.params && err.params.missingProperty) {
      field = err.params.missingProperty;
    }
    return {
      field,
      message: err.message,
      keyword: err.keyword,
      params: err.params || {},
      instancePath,
      schemaPath: err.schemaPath
    };
  });
}

let compiled = null;

function getValidator() {
  if (compiled) return compiled;
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const schema = loadSchema();
  compiled = ajv.compile(schema);
  return compiled;
}

function validateHemodialysis(doc) {
  // Never mutate input
  const validator = getValidator();
  const valid = validator(doc);
  const errors = mapAjvErrors(validator.errors);
  return { valid: !!valid, errors };
}

module.exports = { validateHemodialysis };
