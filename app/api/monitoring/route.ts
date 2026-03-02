import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const metric = searchParams.get("metric") || "overview";
  const range = searchParams.get("range") || "24h";

  const now = Date.now();
  const metrics = {
    errorRate: 0.02,
    avgResponseTime: 142,
    uptime: 99.9,
    activeAlerts: 0,
    coreWebVitals: {
      lcp: 1800,
      fid: 12,
      cls: 0.04,
      fcp: 1200,
      ttfb: 210,
    },
    requestsPerMinute: 847,
    p95Latency: 280,
    p99Latency: 420,
  };

  const timeSeries = Array.from({ length: 24 }, (_, i) => ({
    timestamp: new Date(now - (23 - i) * 3600000).toISOString(),
    requests: Math.floor(800 + Math.random() * 200),
    errors: Math.floor(Math.random() * 3),
    latency: Math.floor(120 + Math.random() * 80),
  }));

  return NextResponse.json({ ok: true, metric, range, metrics, timeSeries });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { alertRule } = body;

    if (!alertRule) {
      return NextResponse.json({ error: "Alert rule required" }, { status: 400 });
    }

    const created = {
      id: `alert-${Date.now()}`,
      ...alertRule,
      status: "active",
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ ok: true, alert: created });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to create alert" }, { status: 500 });
  }
}
