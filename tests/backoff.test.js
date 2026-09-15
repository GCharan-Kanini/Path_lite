const { computeDelay } = require('../src/retry/backoff');

describe('backoff.computeDelay', () => {
  test('AC-1: returns 100ms for attempt 1, doubles each attempt', () => {
    expect(computeDelay(1)).toBe(100);
    expect(computeDelay(2)).toBe(200);
    expect(computeDelay(3)).toBe(400);
    expect(computeDelay(4)).toBe(800);
  });

  test('AC-2: never exceeds cap of 5000ms', () => {
    // large attempt should be capped
    expect(computeDelay(100)).toBe(5000);
    expect(computeDelay(10)).toBe(5000);
  });

  test('AC-3: rejects attempt < 1 by throwing RangeError', () => {
    expect(() => computeDelay(0)).toThrow(RangeError);
    expect(() => computeDelay(-5)).toThrow(RangeError);
    expect(() => computeDelay(NaN)).toThrow(RangeError);
  });
});
