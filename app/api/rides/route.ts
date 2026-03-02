import { NextResponse } from "next/server";
import type { RideType, RideStatus } from "@/lib/services-types";

export const runtime = "nodejs";

function estimateFare(rideType: RideType, surgeFactor = 1.0): number {
  const basePrices: Record<RideType, number> = {
    economy: 8,
    pool: 5,
    xl: 14,
    premium: 22,
    black: 35,
    moto: 4,
  };
  return parseFloat(((basePrices[rideType] ?? 8) * surgeFactor * (1 + Math.random() * 0.4)).toFixed(2));
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { rideType = "economy", pickup, dropoff, scheduledAt } = body;

    if (!pickup || !dropoff) {
      return NextResponse.json({ error: "pickup and dropoff are required" }, { status: 400 });
    }

    const rideId = `RIDE-${Date.now()}`;
    const surgeFactor = Math.random() > 0.7 ? 1.0 + Math.random() * 0.5 : 1.0;
    const status: RideStatus = "requested";

    return NextResponse.json({
      id: rideId,
      rideType,
      pickup,
      dropoff,
      status,
      surgeFactor: parseFloat(surgeFactor.toFixed(2)),
      estimatedFare: estimateFare(rideType as RideType, surgeFactor),
      estimatedArrival: `${Math.floor(2 + Math.random() * 8)} min`,
      scheduledAt: scheduledAt ?? null,
      requestedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}

export async function GET() {
  const drivers = [
    { id: "d1", name: "Alex T.", rating: 4.92, vehicle: "Toyota Camry · White", eta: "3 min", isOnline: true },
    { id: "d2", name: "Maria G.", rating: 4.87, vehicle: "Tesla Model 3 · Black", eta: "5 min", isOnline: true },
    { id: "d3", name: "Sam K.", rating: 4.79, vehicle: "Honda Accord · Silver", eta: "7 min", isOnline: true },
  ];
  return NextResponse.json({ drivers });
}
