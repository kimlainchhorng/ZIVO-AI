import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "overview";
  const range = searchParams.get("range") || "30d";

  const now = Date.now();
  const overview = {
    dau: 8423,
    mau: 84200,
    retention: { d1: 82, d7: 64, d30: 41 },
    conversion: 3.8,
    revenuePerUser: 24.60,
    sessionDuration: 8.4,
  };

  const funnel = [
    { step: "Visitors", count: 124000, rate: 100 },
    { step: "Sign Up", count: 18600, rate: 15.0 },
    { step: "Onboarding", count: 14880, rate: 80.0 },
    { step: "First Project", count: 10416, rate: 70.0 },
    { step: "Active User", count: 8333, rate: 80.0 },
    { step: "Paid", count: 4706, rate: 56.5 },
  ];

  const timeSeries = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(now - (29 - i) * 86400000).toISOString().split("T")[0],
    users: Math.floor(7000 + Math.random() * 3000),
    sessions: Math.floor(14000 + Math.random() * 6000),
    revenue: Math.floor(8000 + Math.random() * 4000),
  }));

  return NextResponse.json({ ok: true, type, range, overview, funnel, timeSeries });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, config } = body;

    if (!action) {
      return NextResponse.json({ error: "Action required" }, { status: 400 });
    }

    const results: Record<string, object> = {
      "create-report": {
        id: `report-${Date.now()}`,
        name: config?.name || "Custom Report",
        metrics: config?.metrics || ["users", "sessions", "revenue"],
        filters: config?.filters || {},
        schedule: config?.schedule || null,
        createdAt: new Date().toISOString(),
      },
      "create-funnel": {
        id: `funnel-${Date.now()}`,
        name: config?.name || "Conversion Funnel",
        steps: config?.steps || ["visit", "signup", "activate", "convert"],
        conversionRate: 3.8,
        dropoffPoints: ["signup → activate: 20% drop"],
      },
      "cohort-analysis": {
        cohortType: config?.type || "weekly",
        periods: 12,
        retentionMatrix: [[100, 82, 64, 52, 41, 35, 30, 26, 23, 21, 19, 18]],
        avgRetention: { d7: 64, d14: 52, d30: 41 },
      },
      "predictive-forecast": {
        metric: config?.metric || "users",
        horizon: config?.horizon || "30d",
        predictions: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() + (i + 1) * 86400000).toISOString().split("T")[0],
          predicted: Math.floor(8500 + i * 45 + Math.random() * 200),
          lower: Math.floor(8200 + i * 40),
          upper: Math.floor(8800 + i * 50),
        })),
        confidence: 0.85,
      },
    };

    if (action in results) {
      return NextResponse.json({ ok: true, action, result: results[action] });
    }

    return NextResponse.json({ ok: true, action, result: `${action} completed` });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Analytics action failed" }, { status: 500 });
  }
}
