// Pure CommonJS module implementing semantic-version compatibility checks

function parseSemVer(input) {
  // Do not mutate input; coerce to string safely
  if (typeof input !== 'string') return { valid: false, raw: input };
  const raw = input;
  const semverRegex = /^\d+\.\d+\.\d+$/;
  if (!semverRegex.test(raw)) return { valid: false, raw };
  const parts = raw.split('.').map(Number);
  return { valid: true, raw, major: parts[0], minor: parts[1], patch: parts[2] };
}

function readVersion(input) {
  // Accept either a string or an object with schema_version property
  if (typeof input === 'string') return input;
  if (input && typeof input === 'object') {
    if (typeof input.schema_version === 'string') return input.schema_version;
    if (typeof input.version === 'string') return input.version;
  }
  return undefined;
}

/**
 * Evaluate compatibility between stored and runtime schema versions.
 * options:
 *   - migrationMap: object mapping storedVersionString -> runtimeVersionString
 *
 * Returns a new object (does not mutate inputs):
 *   {
 *     decision: 'OK'|'BLOCKED'|'MIGRATE'|'FALLBACK'|'INVALID_VERSION',
 *     stored_version: string|null,
 *     runtime_version: string|null,
 *     event_type: string|null,
 *     reason: string
 *   }
 */
function evaluateCompatibility(storedInput, runtimeInput, options) {
  // Do not modify inputs
  const storedRaw = readVersion(storedInput);
  const runtimeRaw = readVersion(runtimeInput);

  const parsedStored = parseSemVer(storedRaw);
  const parsedRuntime = parseSemVer(runtimeRaw);

  if (!parsedStored.valid || !parsedRuntime.valid) {
    return {
      decision: 'INVALID_VERSION',
      stored_version: parsedStored.valid ? parsedStored.raw : (storedRaw === undefined ? null : String(storedRaw)),
      runtime_version: parsedRuntime.valid ? parsedRuntime.raw : (runtimeRaw === undefined ? null : String(runtimeRaw)),
      event_type: 'SchemaInvalidVersion',
      reason: 'One or both versions are missing or malformed. Expected MAJOR.MINOR.PATCH',
    };
  }

  // Both valid
  const stored = parsedStored.raw;
  const runtime = parsedRuntime.raw;

  if (stored === runtime) {
    return {
      decision: 'OK',
      stored_version: stored,
      runtime_version: runtime,
      event_type: null,
      reason: 'Stored and runtime schema versions are identical',
    };
  }

  if (parsedStored.major !== parsedRuntime.major) {
    return {
      decision: 'BLOCKED',
      stored_version: stored,
      runtime_version: runtime,
      event_type: 'SchemaResumeBlocked',
      reason: `Major version mismatch: stored ${parsedStored.major} vs runtime ${parsedRuntime.major}`,
    };
  }

  // same major but different versions
  const migrationMap = options && options.migrationMap && typeof options.migrationMap === 'object'
    ? options.migrationMap
    : null;

  const hasMigration = migrationMap && Object.prototype.hasOwnProperty.call(migrationMap, stored) && migrationMap[stored] === runtime;

  if (hasMigration) {
    return {
      decision: 'MIGRATE',
      stored_version: stored,
      runtime_version: runtime,
      event_type: 'SchemaMigrationApplied',
      reason: `Migration path found from ${stored} to ${runtime}`,
    };
  }

  return {
    decision: 'FALLBACK',
    stored_version: stored,
    runtime_version: runtime,
    event_type: 'SchemaResumeFallbackAllowed',
    reason: `No migration path available for stored ${stored} to runtime ${runtime}; fallback allowed`,
  };
}

module.exports = { parseSemVer, evaluateCompatibility };
