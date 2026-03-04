import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    description:
      "Per-user rate limiting API. POST { userId: string, limit: number, window: string }",
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const userId = typeof body.userId === "string" ? body.userId : "";
    const limit = typeof body.limit === "number" ? body.limit : 100;
    const window = typeof body.window === "string" ? body.window : "1m";

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const rateLimitConfig = {
      userId,
      limit,
      window,
      remaining: limit,
      resetAt: new Date(Date.now() + parseWindowMs(window)).toISOString(),
      policy: "sliding_window",
      headers: {
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(limit),
        "X-RateLimit-Window": window,
      },
      status: "active",
    };

    return NextResponse.json(rateLimitConfig);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function parseWindowMs(window: string): number {
  const match = /^(\d+)(s|m|h|d)$/.exec(window);
  if (!match) return 60 * 1000;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  if (unit === "s") return value * 1000;
  if (unit === "m") return value * 60 * 1000;
  if (unit === "h") return value * 60 * 60 * 1000;
  return value * 24 * 60 * 60 * 1000;
}
