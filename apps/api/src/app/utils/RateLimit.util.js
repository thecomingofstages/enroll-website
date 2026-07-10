class SlidingWindowRateLimiter {
  constructor(windowMs, maxRequests) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.store = new Map();
  }

  allow(key) {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now >= entry.resetAt) {
      this.store.set(key, { resetAt: now + this.windowMs, count: 1 });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    entry.count += 1;
    this.store.set(key, entry);
    return true;
  }
}

module.exports = SlidingWindowRateLimiter;
