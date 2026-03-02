import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    acquisition: {
      totalUsers: 14820,
      newUsersThisMonth: 1340,
      channels: [
        { source: "organic", users: 6200 },
        { source: "paid", users: 4100 },
        { source: "referral", users: 2800 },
        { source: "direct", users: 1720 },
      ],
    },
    retention: {
      day1: 72,
      day7: 48,
      day30: 31,
    },
    revenue: {
      mrr: 48200,
      arr: 578400,
      churnRate: 2.4,
      ltv: 860,
    },
    cohorts: [
      { month: "2025-01", users: 420, retained30d: 130 },
      { month: "2025-02", users: 580, retained30d: 195 },
      { month: "2025-03", users: 740, retained30d: 251 },
    ],
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event, userId, properties } = body as {
      event?: string;
      userId?: string;
      properties?: Record<string, string | number | boolean>;
    };
    if (!event || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: event, userId" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        id: Date.now().toString(),
        event,
        userId,
        properties: properties ?? {},
        timestamp: new Date().toISOString(),
        recorded: true,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
