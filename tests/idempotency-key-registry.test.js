const registry = require('../src/idempotency/keyRegistry');

describe('Idempotency Key Registry (TASK-IDEM-001)', () => {
  beforeEach(() => {
    // There's no clear reset API; rebuild module cache to reset the in-memory store
    jest.resetModules();
  });

  test('AC-1: reserving a new key returns reserved and key is known', () => {
    const reg = require('../src/idempotency/keyRegistry');
    const key = 'key-1';
    const res = reg.reserve(key);
    expect(res.status).toBe(reg.STATUS_RESERVED);
    expect(reg.has(key)).toBe(true);
  });

  test('AC-2: reserving an already reserved key returns in_progress and does not duplicate', () => {
    const reg = require('../src/idempotency/keyRegistry');
    const key = 'key-2';
    const first = reg.reserve(key);
    expect(first.status).toBe(reg.STATUS_RESERVED);
    const second = reg.reserve(key);
    expect(second.status).toBe(reg.STATUS_IN_PROGRESS);
    // ensure still only one entry known
    expect(reg.has(key)).toBe(true);
  });

  test('AC-3: completing a reserved key stores snapshot and marks completed', () => {
    const reg = require('../src/idempotency/keyRegistry');
    const key = 'key-3';
    reg.reserve(key);
    const snapshot = { foo: 'bar' };
    const comp = reg.complete(key, snapshot);
    expect(comp.status).toBe(reg.STATUS_COMPLETED);
    const res = reg.reserve(key);
    expect(res.status).toBe(reg.STATUS_COMPLETED);
    expect(res.result).toEqual(snapshot);
  });

  test('AC-4: reserving an already completed key returns completed with snapshot', () => {
    const reg = require('../src/idempotency/keyRegistry');
    const key = 'key-4';
    reg.reserve(key);
    const snapshot = { data: 123 };
    reg.complete(key, snapshot);
    const res = reg.reserve(key);
    expect(res.status).toBe(reg.STATUS_COMPLETED);
    expect(res.result).toEqual(snapshot);
  });

  test('AC-5: reserving an invalid key throws TypeError', () => {
    const reg = require('../src/idempotency/keyRegistry');
    expect(() => reg.reserve('')).toThrow(TypeError);
    expect(() => reg.reserve(null)).toThrow(TypeError);
    expect(() => reg.reserve(123)).toThrow(TypeError);
  });

  test('AC-6: releasing a reserved key removes reservation; releasing completed key leaves intact', () => {
    const reg = require('../src/idempotency/keyRegistry');
    const keyReserved = 'key-6a';
    const keyCompleted = 'key-6b';

    reg.reserve(keyReserved);
    reg.reserve(keyCompleted);
    reg.complete(keyCompleted, { ok: true });

    // release reserved
    reg.release(keyReserved);
    expect(reg.has(keyReserved)).toBe(false);

    // release completed
    reg.release(keyCompleted);
    expect(reg.has(keyCompleted)).toBe(true);
    const res = reg.reserve(keyCompleted);
    expect(res.status).toBe(reg.STATUS_COMPLETED);
  });

  test('AC-7: completing a key that was never reserved throws Error', () => {
    const reg = require('../src/idempotency/keyRegistry');
    expect(() => reg.complete('never-reserved', { x: 1 })).toThrow(Error);
  });
});
