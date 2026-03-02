import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * PWA Analytics API
 * GET  /api/pwa  – fetch PWA install & engagement metrics
 * POST /api/pwa  – report a PWA event (install, notification click, etc.)
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    metrics: {
      installs: 0,
      activeUsers: 0,
      pushSubscriptions: 0,
      offlineSessions: 0,
      backgroundSyncs: 0,
    },
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { event, userId, metadata } = body as {
    event?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  };

  if (!event) {
    return NextResponse.json({ error: "event required" }, { status: 400 });
  }

  // TODO: store event in analytics pipeline
  return NextResponse.json({
    ok: true,
    recorded: { event, userId, metadata, timestamp: new Date().toISOString() },
  });
}
