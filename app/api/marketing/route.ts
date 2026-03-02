import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    campaigns: [
      { id: "1", name: "Launch Campaign", status: "active", reach: 50000 },
      { id: "2", name: "Email Newsletter", status: "scheduled", reach: 12000 },
    ],
    totalReach: 62000,
    activeCampaigns: 1,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, type, targetAudience } = body as {
      name?: string;
      type?: string;
      targetAudience?: string;
    };
    if (!name || !type) {
      return NextResponse.json(
        { error: "Missing required fields: name, type" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        id: Date.now().toString(),
        name,
        type,
        targetAudience: targetAudience ?? "all",
        status: "draft",
        createdAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
