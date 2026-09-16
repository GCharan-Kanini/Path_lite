const { evaluateCompatibility, parseSemVer } = require('../src/validation/schemaVersionCompatibility');

describe('AC-1: identical valid semantic versions => OK decision', () => {
  test('returns OK and no event_type for identical versions', () => {
    const stored = { schema_version: '1.2.3' };
    const runtime = { schema_version: '1.2.3' };
    const res = evaluateCompatibility(stored, runtime, {});
    expect(res.decision).toBe('OK');
    expect(res.event_type).toBeNull();
    expect(res.stored_version).toBe('1.2.3');
    expect(res.runtime_version).toBe('1.2.3');
  });
});

describe('AC-2: different major versions => BLOCKED with SchemaResumeBlocked', () => {
  test('major version mismatch blocks resume', () => {
    const stored = { schema_version: '1.0.0' };
    const runtime = { schema_version: '2.0.0' };
    const res = evaluateCompatibility(stored, runtime, {});
    expect(res.decision).toBe('BLOCKED');
    expect(res.event_type).toBe('SchemaResumeBlocked');
    expect(res.reason).toMatch(/Major version mismatch/);
  });
});

describe('AC-3: same major and registered migration => MIGRATE with SchemaMigrationApplied', () => {
  test('migration path exists', () => {
    const stored = { schema_version: '1.0.0' };
    const runtime = { schema_version: '1.1.0' };
    const migrationMap = { '1.0.0': '1.1.0' };
    const res = evaluateCompatibility(stored, runtime, { migrationMap });
    expect(res.decision).toBe('MIGRATE');
    expect(res.event_type).toBe('SchemaMigrationApplied');
  });
});

describe('AC-4: same major and no migration path => FALLBACK with SchemaResumeFallbackAllowed', () => {
  test('no migration available falls back', () => {
    const stored = { schema_version: '1.0.0' };
    const runtime = { schema_version: '1.2.0' };
    const res = evaluateCompatibility(stored, runtime, {});
    expect(res.decision).toBe('FALLBACK');
    expect(res.event_type).toBe('SchemaResumeFallbackAllowed');
  });
});

describe('AC-5: malformed or missing version => INVALID_VERSION and never throws', () => {
  test('malformed stored version string', () => {
    const stored = { schema_version: '1.0' };
    const runtime = { schema_version: '1.0.0' };
    const res = evaluateCompatibility(stored, runtime, {});
    expect(res.decision).toBe('INVALID_VERSION');
    expect(res.event_type).toBe('SchemaInvalidVersion');
  });

  test('missing versions', () => {
    const res = evaluateCompatibility({}, {}, {});
    expect(res.decision).toBe('INVALID_VERSION');
  });

  test('parseSemVer rejects negative or non-numeric', () => {
    expect(parseSemVer('a.b.c').valid).toBe(false);
    expect(parseSemVer('-1.2.3').valid).toBe(false);
    expect(parseSemVer('1.2').valid).toBe(false);
  });
});

describe('AC-6: immutability - caller-owned inputs are not mutated', () => {
  test('inputs remain unchanged after evaluation', () => {
    const stored = { schema_version: '1.0.0', other: { nested: true } };
    const runtime = { schema_version: '1.1.0', extra: [1,2,3] };
    const storedCopy = JSON.parse(JSON.stringify(stored));
    const runtimeCopy = JSON.parse(JSON.stringify(runtime));
    evaluateCompatibility(stored, runtime, {});
    expect(stored).toEqual(storedCopy);
    expect(runtime).toEqual(runtimeCopy);
  });
});
