import { NextResponse } from "next/server";
import type { ServiceCategory } from "@/lib/services-types";

export const runtime = "nodejs";

const laborRates: Record<ServiceCategory, number> = {
  plumbing: 95,
  electrical: 105,
  hvac: 115,
  appliance: 85,
  carpentry: 75,
  painting: 55,
  cleaning: 45,
  pest_control: 65,
  landscaping: 60,
  general: 70,
};

const slaTimes: Record<"routine" | "urgent" | "emergency", string> = {
  emergency: "2 hours",
  urgent: "24 hours",
  routine: "72 hours",
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { customerId, category = "general", description, address, scheduledAt, urgency = "routine" } = body;

    if (!address || !description) {
      return NextResponse.json({ error: "address and description are required" }, { status: 400 });
    }

    const requestId = `SR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const laborRate = laborRates[category as ServiceCategory] ?? 70;
    const slaDeadline = new Date(
      Date.now() + (urgency === "emergency" ? 2 : urgency === "urgent" ? 24 : 72) * 60 * 60 * 1000
    ).toISOString();

    return NextResponse.json({
      id: requestId,
      customerId: customerId ?? "guest",
      category,
      description,
      address,
      urgency,
      status: "pending",
      estimatedLaborRate: laborRate,
      slaDeadline,
      slaTarget: slaTimes[urgency as keyof typeof slaTimes],
      technicianId: null,
      scheduledAt: scheduledAt ?? null,
      createdAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  return NextResponse.json({ id, status: "assigned", technician: { name: "Carlos Rivera", eta: "45 min" } });
}
