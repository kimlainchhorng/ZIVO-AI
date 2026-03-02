import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface Partner {
  id: string;
  name: string;
  type: "affiliate" | "reseller" | "integration" | "strategic";
  status: "active" | "pending" | "inactive";
  commissionRate: number;
  revenueGenerated: number;
  joinedAt: string;
}

export async function GET() {
  return NextResponse.json({
    partners: [
      {
        id: "PA-001",
        name: "Acme Corp",
        type: "reseller",
        status: "active",
        commissionRate: 20,
        revenueGenerated: 42000,
        joinedAt: "2024-11-01T00:00:00.000Z",
      },
      {
        id: "PA-002",
        name: "TechBridge",
        type: "integration",
        status: "active",
        commissionRate: 15,
        revenueGenerated: 18500,
        joinedAt: "2025-01-15T00:00:00.000Z",
      },
      {
        id: "PA-003",
        name: "GrowthHQ",
        type: "affiliate",
        status: "pending",
        commissionRate: 10,
        revenueGenerated: 0,
        joinedAt: "2025-07-01T00:00:00.000Z",
      },
    ] satisfies Partner[],
    summary: {
      totalPartners: 3,
      activePartners: 2,
      totalRevenueGenerated: 60500,
      pendingApplications: 1,
      averageCommissionRate: 15,
    },
    affiliateStats: {
      clicks: 12400,
      conversions: 310,
      conversionRate: 2.5,
      pendingPayouts: 3200,
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, type, commissionRate } = body as {
      name?: string;
      type?: Partner["type"];
      commissionRate?: number;
    };
    if (!name || !type) {
      return NextResponse.json(
        { error: "Missing required fields: name, type" },
        { status: 400 }
      );
    }
    const partner: Partner = {
      id: `PA-${Date.now()}`,
      name,
      type,
      status: "pending",
      commissionRate: commissionRate ?? 10,
      revenueGenerated: 0,
      joinedAt: new Date().toISOString(),
    };
    return NextResponse.json(partner, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
