const { computeDelay } = require('../src/retry/backoff');

describe('TASK-504: Exponential backoff computeDelay', () => {
  test('AC-1: returns 100ms for attempt 1 and doubles for subsequent attempts', () => {
    expect(computeDelay(1)).toBe(100);
    expect(computeDelay(2)).toBe(200);
    expect(computeDelay(3)).toBe(400);
    expect(computeDelay(4)).toBe(800);
  });

  test('AC-2: never returns more than cap of 5000ms', () => {
    expect(computeDelay(10)).toBeLessThanOrEqual(5000);
    expect(computeDelay(20)).toBeLessThanOrEqual(5000);
    expect(computeDelay(100)).toBeLessThanOrEqual(5000);
    // specifically should equal cap once the exponential exceeds it
    expect(computeDelay(10)).toBe(5000);
  });

  test('AC-3: rejects attempt numbers below 1 with RangeError', () => {
    expect(() => computeDelay(0)).toThrow(RangeError);
    expect(() => computeDelay(-1)).toThrow(RangeError);
    expect(() => computeDelay(0.5)).toThrow(RangeError);
  });
});
