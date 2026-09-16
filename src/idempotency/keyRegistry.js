// In-memory idempotency key registry
// CommonJS module

const STATUS_RESERVED = 'reserved';
const STATUS_IN_PROGRESS = 'in_progress';
const STATUS_COMPLETED = 'completed';

const store = new Map();

function _validateKey(key) {
  if (typeof key !== 'string' || key.length === 0) {
    throw new TypeError('idempotency key must be a non-empty string');
  }
}

function reserve(key) {
  _validateKey(key);

  if (!store.has(key)) {
    store.set(key, { status: STATUS_RESERVED });
    return { status: STATUS_RESERVED };
  }

  const entry = store.get(key);
  if (entry.status === STATUS_RESERVED) {
    return { status: STATUS_IN_PROGRESS };
  }

  if (entry.status === STATUS_COMPLETED) {
    return { status: STATUS_COMPLETED, result: entry.snapshot };
  }

  // Fallback (shouldn't happen)
  return { status: entry.status };
}

function complete(key, snapshot) {
  _validateKey(key);

  if (!store.has(key)) {
    throw new Error('cannot complete idempotency key that was not reserved');
  }

  const entry = store.get(key);
  if (entry.status !== STATUS_RESERVED) {
    throw new Error('cannot complete idempotency key that is not reserved');
  }

  entry.status = STATUS_COMPLETED;
  entry.snapshot = snapshot;
  store.set(key, entry);
  return { status: STATUS_COMPLETED };
}

function release(key) {
  // releasing a reserved key removes the reservation;
  // releasing a completed key leaves it intact; releasing unknown key is a no-op
  if (typeof key !== 'string') {
    return; // silently ignore non-string keys for release
  }

  const entry = store.get(key);
  if (!entry) return;
  if (entry.status === STATUS_RESERVED) {
    store.delete(key);
  }
}

function has(key) {
  return store.has(key);
}

function getSnapshot(key) {
  const entry = store.get(key);
  return entry ? entry.snapshot : undefined;
}

module.exports = {
  STATUS_RESERVED,
  STATUS_IN_PROGRESS,
  STATUS_COMPLETED,
  reserve,
  complete,
  release,
  has,
  getSnapshot,
};
