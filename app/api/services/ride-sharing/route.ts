import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { pickup, dropoff, rideType, passengerId } = body;

    if (!pickup || !dropoff) {
      return NextResponse.json({ error: "pickup and dropoff are required" }, { status: 400 });
    }

    const rideId = `RIDE-${Date.now()}`;
    const estimatedFare = {
      economy: 12.5,
      xl: 18.0,
      pool: 8.0,
      premium: 28.0,
      blacklane: 75.0,
      corporate: 35.0,
    }[rideType as string] ?? 12.5;

    return NextResponse.json({
      rideId,
      status: "searching_driver",
      pickup,
      dropoff,
      rideType: rideType ?? "economy",
      estimatedFare: estimatedFare.toFixed(2),
      estimatedETA: Math.floor(Math.random() * 8) + 2,
      passengerId: passengerId ?? null,
      createdAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rideId = searchParams.get("rideId");

  if (!rideId) {
    return NextResponse.json({ error: "rideId is required" }, { status: 400 });
  }

  return NextResponse.json({
    rideId,
    status: "driver_assigned",
    driver: {
      name: "Alex M.",
      rating: 4.9,
      vehicle: "Toyota Camry",
      plate: "ABC-1234",
      eta: 3,
    },
    location: { lat: 37.7749, lng: -122.4194 },
  });
}
