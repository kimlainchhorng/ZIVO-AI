import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Rate-Limit Configuration API
 * GET  /api/rate-limit  – retrieve current rate-limit rules and usage
 * POST /api/rate-limit  – create or update a rate-limit rule
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");

  return NextResponse.json({
    ok: true,
    tenantId,
    rules: [
      { endpoint: "/api/generate-site", windowMs: 60000, maxRequests: 20 },
      { endpoint: "/api/chat", windowMs: 60000, maxRequests: 60 },
    ],
    usage: { windowMs: 60000, requestsMade: 0, remaining: 20 },
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { tenantId, endpoint, windowMs, maxRequests, burstAllowance } = body as {
    tenantId?: string;
    endpoint?: string;
    windowMs?: number;
    maxRequests?: number;
    burstAllowance?: number;
  };

  if (!endpoint || !windowMs || !maxRequests) {
    return NextResponse.json(
      { error: "endpoint, windowMs and maxRequests required" },
      { status: 400 }
    );
  }

  // TODO: persist rule and reload rate-limiter middleware
  return NextResponse.json({
    ok: true,
    rule: {
      id: crypto.randomUUID(),
      tenantId,
      endpoint,
      windowMs,
      maxRequests,
      burstAllowance: burstAllowance ?? 0,
      createdAt: new Date().toISOString(),
    },
  });
}
