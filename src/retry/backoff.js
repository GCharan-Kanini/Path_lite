// Exponential backoff with cap
// computeDelay(attempt): returns delay in ms

const BASE_DELAY = 100;
const MAX_CAP = 5000;

function computeDelay(attempt) {
  if (!Number.isInteger(attempt) || attempt < 1) {
    throw new RangeError('attempt must be an integer >= 1');
  }

  // Iteratively double until attempt reached or cap hit to avoid overflow
  let delay = BASE_DELAY;
  for (let i = 2; i <= attempt; i++) {
    delay = Math.min(delay * 2, MAX_CAP);
    // if we've reached cap, further attempts will stay at cap; can break early
    if (delay >= MAX_CAP) {
      delay = MAX_CAP;
      break;
    }
  }

  return delay;
}

module.exports = { computeDelay };
