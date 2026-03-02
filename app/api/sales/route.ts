import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface Deal {
  id: string;
  name: string;
  stage: "lead" | "qualified" | "proposal" | "negotiation" | "closed-won" | "closed-lost";
  value: number;
  owner: string;
  expectedCloseDate: string;
}

export async function GET() {
  return NextResponse.json({
    pipeline: [
      {
        id: "D-001",
        name: "Enterprise Plan - Globex",
        stage: "proposal",
        value: 24000,
        owner: "rep-sara",
        expectedCloseDate: "2025-08-15",
      },
      {
        id: "D-002",
        name: "Team Plan - Initech",
        stage: "negotiation",
        value: 9600,
        owner: "rep-mike",
        expectedCloseDate: "2025-07-31",
      },
      {
        id: "D-003",
        name: "Starter Plan - Umbrella",
        stage: "closed-won",
        value: 1200,
        owner: "rep-sara",
        expectedCloseDate: "2025-07-08",
      },
    ] satisfies Deal[],
    summary: {
      totalPipelineValue: 34800,
      closedWonThisMonth: 18400,
      openDeals: 2,
      averageDealValue: 11600,
    },
    leads: {
      total: 84,
      qualified: 32,
      conversionRate: 38,
    },
    roi: {
      salesSpend: 12000,
      revenue: 18400,
      roiPercent: 53,
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, value, owner, expectedCloseDate } = body as {
      name?: string;
      value?: number;
      owner?: string;
      expectedCloseDate?: string;
    };
    if (!name || !owner) {
      return NextResponse.json(
        { error: "Missing required fields: name, owner" },
        { status: 400 }
      );
    }
    const deal: Deal = {
      id: `D-${Date.now()}`,
      name,
      stage: "lead",
      value: value ?? 0,
      owner,
      expectedCloseDate: expectedCloseDate ?? "",
    };
    return NextResponse.json(deal, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
