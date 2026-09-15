// Exponential backoff with a cap
// computeDelay(attempt) returns delay in milliseconds

function computeDelay(attempt) {
  const cap = 5000;
  if (typeof attempt !== 'number' || !Number.isFinite(attempt)) {
    throw new RangeError('attempt must be a finite number >= 1');
  }
  if (attempt < 1) {
    throw new RangeError('attempt must be >= 1');
  }
  // Use integer attempts; allow fractional but compute as given
  const power = Math.pow(2, attempt - 1);
  const delay = 100 * power;
  return Math.min(delay, cap);
}

module.exports = { computeDelay };
