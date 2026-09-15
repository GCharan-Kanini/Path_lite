const { computeDelay } = require('../src/retry/backoff');

describe('TASK-503 Exponential backoff computeDelay', () => {
  test('AC-1: returns 100ms for attempt 1, doubles for attempts 2 and 3', () => {
    expect(computeDelay(1)).toBe(100);
    expect(computeDelay(2)).toBe(200);
    expect(computeDelay(3)).toBe(400);
  });

  test('AC-2: never returns more than cap 5000ms', () => {
    expect(computeDelay(1)).toBeLessThanOrEqual(5000);
    expect(computeDelay(10)).toBeLessThanOrEqual(5000);
    expect(computeDelay(100)).toBeLessThanOrEqual(5000);
    // specifically, for large attempt it should equal cap
    expect(computeDelay(20)).toBe(5000);
  });

  test('AC-3: throws RangeError for attempt below 1', () => {
    expect(() => computeDelay(0)).toThrow(RangeError);
    expect(() => computeDelay(-1)).toThrow(RangeError);
    expect(() => computeDelay(NaN)).toThrow(RangeError);
  });
});
