// lib/rate-limiter.ts — Sliding window rate limiter

import { NextResponse } from "next/server";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix timestamp in ms
}

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

/** Sliding window rate limiter using an in-memory Map of timestamps. */
export class RateLimiter {
  private readonly store = new Map<string, number[]>();

  /**
   * Checks if the given key is within the rate limit.
   * Uses a sliding window based on timestamps.
   */
  check(key: string, limit: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing timestamps for the key, filter to current window
    const timestamps = (this.store.get(key) ?? []).filter((ts) => ts > windowStart);

    if (timestamps.length >= limit) {
      const oldestInWindow = timestamps[0] ?? now;
      return {
        allowed: false,
        remaining: 0,
        resetAt: oldestInWindow + windowMs,
      };
    }

    // Record this request
    timestamps.push(now);
    this.store.set(key, timestamps);

    return {
      allowed: true,
      remaining: limit - timestamps.length,
      resetAt: now + windowMs,
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

/** Default shared rate limiter instance. */
export const defaultRateLimiter = new RateLimiter();

// ─── Per-endpoint config store ────────────────────────────────────────────────

export interface EndpointRateLimitConfig {
  endpoint: string;
  limit: number;
  windowMs: number;
}

const endpointConfigs = new Map<string, EndpointRateLimitConfig>();

export function setEndpointConfig(config: EndpointRateLimitConfig): void {
  endpointConfigs.set(config.endpoint, config);
}

export function getEndpointConfig(endpoint: string): EndpointRateLimitConfig | undefined {
  return endpointConfigs.get(endpoint);
}

export function listEndpointConfigs(): EndpointRateLimitConfig[] {
  return Array.from(endpointConfigs.values());
}

// ─── HOC ─────────────────────────────────────────────────────────────────────

export type NextHandler = (req: Request) => Promise<Response>;

/**
 * Higher-order component that wraps a Next.js route handler with rate limiting.
 */
export function withRateLimit(
  handler: NextHandler,
  config: RateLimitConfig,
  keyFn?: (req: Request) => string
): NextHandler {
  return async (req: Request): Promise<Response> => {
    const key = keyFn
      ? keyFn(req)
      : (req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "anonymous");

    const result = defaultRateLimiter.check(key, config.limit, config.windowMs);

    if (!result.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded", resetAt: result.resetAt },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(config.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(result.resetAt),
            "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          },
        }
      );
    }

    const response = await handler(req);
    return response;
  };
}
