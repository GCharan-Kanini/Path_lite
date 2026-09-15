const { computeDelay } = require('../src/retry/backoff');

describe('AC-1: exponential backoff doubling behavior', () => {
  test('attempt 1 returns 100 ms', () => {
    expect(computeDelay(1)).toBe(100);
  });

  test('attempt 2 returns 200 ms', () => {
    expect(computeDelay(2)).toBe(200);
  });

  test('attempt 3 returns 400 ms', () => {
    expect(computeDelay(3)).toBe(400);
  });
});


describe('AC-2: cap at 5000 ms', () => {
  test('very large attempt returns cap 5000 ms', () => {
    expect(computeDelay(100)).toBe(5000);
  });

  test('attempt that would exceed cap returns exactly 5000', () => {
    // Find attempt where base * 2^(attempt-1) > 5000
    // base=100, so 2^(attempt-1) > 50 -> attempt-1 >= 6 -> attempt >=7
    expect(computeDelay(7)).toBe(5000);
  });
});


describe('AC-3: invalid attempts throw RangeError', () => {
  test('attempt 0 throws RangeError', () => {
    expect(() => computeDelay(0)).toThrow(RangeError);
  });

  test('negative attempt throws RangeError', () => {
    expect(() => computeDelay(-1)).toThrow(RangeError);
  });

  test('non-number attempt throws RangeError', () => {
    expect(() => computeDelay('a')).toThrow(RangeError);
  });
});
