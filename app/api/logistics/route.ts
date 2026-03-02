import { NextResponse } from "next/server";
import type { FreightMode } from "@/lib/services-types";

export const runtime = "nodejs";

const modeRates: Record<FreightMode, number> = {
  ltl: 2.10,
  ftl: 2.85,
  rail: 1.40,
  air: 8.50,
  ocean: 0.80,
  intermodal: 1.95,
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { origin, destination, pickupDate, deliveryDate, weight = 0, mode = "ftl", rate, isHazmat = false, requiresTemp = false, tollsIncluded = true } = body;

    if (!origin || !destination || !pickupDate) {
      return NextResponse.json({ error: "origin, destination, and pickupDate are required" }, { status: 400 });
    }

    const estimatedRate = rate ?? modeRates[mode as FreightMode] ?? 2.85;
    const loadId = `LF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const bolNumber = `BOL-${Math.floor(100000 + Math.random() * 900000)}`;

    return NextResponse.json({
      id: loadId,
      origin,
      destination,
      pickupDate,
      deliveryDate: deliveryDate ?? null,
      weight,
      mode,
      rate: parseFloat(estimatedRate.toFixed(2)),
      isHazmat,
      requiresTemp,
      tollsIncluded,
      status: "posted",
      billOfLading: {
        number: bolNumber,
        issuedAt: new Date().toISOString(),
      },
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
  return NextResponse.json({ id, status: "in_transit", currentLocation: "Albuquerque, NM", eta: "2026-03-14T14:00:00Z" });
}
