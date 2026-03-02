import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    period: "last_30_days",
    summary: {
      totalUsers: 1247839,
      activeUsers: 389204,
      appsDeployed: 94302,
      apiCalls: 1449360330,
      revenue: 4821440,
      churnRate: 0.023,
    },
    trends: {
      userGrowth: 0.124,
      revenueGrowth: 0.189,
      deploymentGrowth: 0.212,
    },
    topVerticals: [
      { name: "Healthcare AI", apps: 12403, revenue: 892000 },
      { name: "FinTech", apps: 9821, revenue: 1240000 },
      { name: "E-commerce", apps: 18302, revenue: 673000 },
      { name: "SaaS", apps: 21043, revenue: 1102000 },
      { name: "Education", apps: 8901, revenue: 412000 },
    ],
    topRegions: [
      { region: "North America", users: 492301 },
      { region: "Europe", users: 318204 },
      { region: "Asia Pacific", users: 287492 },
      { region: "Latin America", users: 98301 },
      { region: "Middle East & Africa", users: 51541 },
    ],
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { metric, startDate, endDate, groupBy } = body;

    return NextResponse.json({
      ok: true,
      metric: metric || "users",
      startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: endDate || new Date().toISOString(),
      groupBy: groupBy || "day",
      data: [],
      message: "Connect a database to retrieve time-series analytics data.",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Analytics query failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
