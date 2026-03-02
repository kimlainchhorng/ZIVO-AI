import { NextResponse } from "next/server";

interface AnalyticsEvent {
  event: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

const events: AnalyticsEvent[] = [];

function getStats() {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const todayEvents = events.filter(e => now - new Date(e.timestamp).getTime() < dayMs);
  const weekEvents = events.filter(e => now - new Date(e.timestamp).getTime() < 7 * dayMs);

  const generateEvents = events.filter(e => e.event === "site_generated");
  const buildEvents = events.filter(e => e.event === "build_completed");
  const scanEvents = events.filter(e => e.event === "code_scanned");

  return {
    total: events.length,
    today: todayEvents.length,
    thisWeek: weekEvents.length,
    byType: {
      sitesGenerated: generateEvents.length,
      buildsCompleted: buildEvents.length,
      codeScans: scanEvents.length,
    },
    recentEvents: events.slice(0, 20),
  };
}

export async function GET() {
  return NextResponse.json({ ok: true, stats: getStats() });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { event, metadata } = body;

    if (!event || typeof event !== "string") {
      return NextResponse.json({ error: "event name is required" }, { status: 400 });
    }

    const analyticsEvent: AnalyticsEvent = {
      event,
      timestamp: new Date().toISOString(),
      metadata,
    };

    events.unshift(analyticsEvent);
    if (events.length > 1000) events.pop();

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to track event";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
