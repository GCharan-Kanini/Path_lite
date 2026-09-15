function computeDelay(attempt) {
  // Validate attempt
  if (typeof attempt !== 'number' || attempt < 1) {
    throw new RangeError('attempt must be a number >= 1');
  }

  const base = 100; // ms
  const cap = 5000; // ms

  // Use left shift for integer exponent when safe, else Math.pow
  // Compute exponential growth: base * 2^(attempt-1)
  let delay = base * Math.pow(2, attempt - 1);

  if (delay > cap) return cap;
  return delay;
}

module.exports = { computeDelay };
