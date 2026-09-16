const path = require('path');
const fs = require('fs');
const { validateHemodialysis } = require('../src/validation/hemodialysisSchemaValidator');

const rawSchema = fs.readFileSync(path.join(__dirname, '..', 'docs', 'design', 'schemas', 'hemodialysis_add_new.schema.json'), 'utf8');
const fixedSchema = rawSchema.replace(/\\(?=[^\\])/g, "\\\\");
const schema = JSON.parse(fixedSchema);
const example = schema.examples[0];

describe('Hemodialysis Schema Validator', () => {
  test('AC-1: bundled schema example validates with no errors', () => {
    const { valid, errors } = validateHemodialysis(example);
    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  test('AC-2: invalid schema_version returns structured schema_version error', () => {
    const doc = Object.assign({}, example, { schema_version: '1.0' });
    const { valid, errors } = validateHemodialysis(doc);
    expect(valid).toBe(false);
    // find error touching schema_version
    const sv = errors.find(e => e.field === 'schema_version' || e.instancePath === '/schema_version');
    expect(sv).toBeDefined();
    expect(sv.message).toMatch(/pattern/);
    expect(sv.keyword).toBeDefined();
  });

  test('AC-3: out-of-range blood_flow_rate_ml_per_min returns field error', () => {
    const doc = Object.assign({}, example, { blood_flow_rate_ml_per_min: 10 });
    const { valid, errors } = validateHemodialysis(doc);
    expect(valid).toBe(false);
    const bf = errors.find(e => e.field === 'blood_flow_rate_ml_per_min' || e.instancePath === '/blood_flow_rate_ml_per_min');
    expect(bf).toBeDefined();
    // AJV message may be phrased like "must be >= 50" so check keyword and numeric bound
    expect(bf.keyword).toBe('minimum');
    expect(bf.message).toMatch(/>=?\s*50|50/);
  });

  test('AC-4: explicitly allowed null fields remain valid', () => {
    const doc = Object.assign({}, example, { session_id: null, access_type_other_detail: null, blood_flow_rate_ml_per_min: null });
    const { valid, errors } = validateHemodialysis(doc);
    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  test('AC-5: unknown top-level properties are rejected', () => {
    const doc = Object.assign({}, example, { unexpected_prop: 123 });
    const { valid, errors } = validateHemodialysis(doc);
    expect(valid).toBe(false);
    const ap = errors.find(e => e.keyword === 'additionalProperties' || e.message && e.message.includes('additional'));
    expect(ap).toBeDefined();
    // field should indicate the unknown prop name
    expect(ap.field).toBe('unexpected_prop');
  });
});
