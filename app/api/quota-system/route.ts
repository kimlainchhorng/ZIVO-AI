import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    description:
      "API quota system generator. POST { resource: string, limit: number, window: string, tier: string } to receive a quota configuration.",
  });
}

interface RateLimitRule {
  tier: string;
  resource: string;
  limit: number;
  window: string;
  windowSeconds: number;
  burstAllowance: number;
  retryAfterHeader: string;
  headers: Record<string, string>;
}

interface QuotaConfig {
  rule: RateLimitRule;
  storageKey: string;
  algorithm: string;
  enforcement: Record<string, unknown>;
  pseudocode: string;
}

function parseWindowToSeconds(window: string): number {
  const match = /^(\d+)(s|m|h|d)$/.exec(window.trim().toLowerCase());
  if (!match) return 60;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return value * (multipliers[unit] ?? 60);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const resource = typeof body.resource === "string" ? body.resource : "api";
    const limit = typeof body.limit === "number" ? body.limit : 100;
    const window = typeof body.window === "string" ? body.window : "1m";
    const tier = typeof body.tier === "string" ? body.tier : "free";

    const windowSeconds = parseWindowToSeconds(window);
    const burstAllowance = Math.ceil(limit * 0.2);

    const config: QuotaConfig = {
      rule: {
        tier,
        resource,
        limit,
        window,
        windowSeconds,
        burstAllowance,
        retryAfterHeader: "Retry-After",
        headers: {
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "{{remaining}}",
          "X-RateLimit-Reset": "{{resetTimestamp}}",
          "X-RateLimit-Window": window,
          "X-RateLimit-Tier": tier,
        },
      },
      storageKey: `quota:${tier}:${resource}:{{identifierHash}}`,
      algorithm: "sliding_window_counter",
      enforcement: {
        onExceeded: {
          statusCode: 429,
          body: { error: "Too Many Requests", retryAfter: "{{retryAfterSeconds}}" },
        },
        onBurst: {
          statusCode: 429,
          body: { error: "Burst limit exceeded", limit: burstAllowance },
        },
      },
      pseudocode: [
        `key = "quota:${tier}:${resource}:{identifier}"`,
        `now = current_unix_timestamp()`,
        `window_start = now - ${windowSeconds}`,
        `// Remove entries older than the window`,
        `ZREMRANGEBYSCORE key -inf window_start`,
        `count = ZCARD key`,
        `if count >= ${limit + burstAllowance}:`,
        `    return 429 Burst limit exceeded`,
        `elif count >= ${limit}:`,
        `    return 429 Too Many Requests`,
        `else:`,
        `    ZADD key now now`,
        `    EXPIRE key ${windowSeconds}`,
        `    return 200 OK`,
      ].join("\n"),
    };

    return NextResponse.json({ result: config });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
