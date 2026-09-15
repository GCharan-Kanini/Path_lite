// Exponential backoff with cap
// computeDelay(attempt): attempt 1 -> 100 ms, doubles each attempt, capped at 5000 ms

function computeDelay(attempt) {
  const BASE = 100;
  const CAP = 5000;

  if (typeof attempt !== 'number' || !Number.isFinite(attempt) || attempt < 1) {
    throw new RangeError('attempt must be a number >= 1');
  }

  // Use exponential growth: BASE * 2^(attempt-1)
  const delay = BASE * Math.pow(2, Math.floor(attempt) - 1);
  return Math.min(delay, CAP);
}

module.exports = { computeDelay };
