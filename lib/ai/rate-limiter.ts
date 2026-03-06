// lib/ai/rate-limiter.ts — Pre-configured rate limiter instances for AI routes

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix timestamp in ms
}

/** Sliding window rate limiter using an in-memory Map of timestamps. */
export class RateLimiter {
  private readonly store = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number
  ) {}

  /**
   * Checks if the given key is within the rate limit.
   * Uses a sliding window based on timestamps.
   */
  check(key: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    const timestamps = (this.store.get(key) ?? []).filter((ts) => ts > windowStart);

    if (timestamps.length >= this.limit) {
      const oldestInWindow = timestamps[0]!;
      return {
        allowed: false,
        remaining: 0,
        resetAt: oldestInWindow + this.windowMs,
      };
    }

    timestamps.push(now);
    this.store.set(key, timestamps);

    return {
      allowed: true,
      remaining: this.limit - timestamps.length,
      resetAt: now + this.windowMs,
    };
  }

  /** Clears all stored timestamps (useful for tests). */
  reset(): void {
    this.store.clear();
  }

  /** Removes the entry for a specific key. */
  resetKey(key: string): void {
    this.store.delete(key);
  }
}

/** Rate limiter for /api/build — 10 requests per minute. */
export const buildRateLimiter = new RateLimiter(10, 60_000);

/** Rate limiter for /api/agent — 5 requests per minute. */
export const agentRateLimiter = new RateLimiter(5, 60_000);

/** Rate limiter for /api/voice-to-app — 20 requests per minute. */
export const voiceRateLimiter = new RateLimiter(20, 60_000);
