import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { origin, destination, weight, loadType, commodity, contactEmail } = body;

    if (!origin || !destination || !weight || !loadType) {
      return NextResponse.json(
        { error: "origin, destination, weight, and loadType are required" },
        { status: 400 }
      );
    }

    const ratePerMile: Record<string, number> = {
      ftl: 2.85,
      ltl: 3.5,
      hazmat: 4.2,
      temp: 3.9,
    };

    const estimatedMiles = Math.floor(Math.random() * 1500) + 200;
    const rate = ratePerMile[loadType as string] ?? 2.85;
    const baseRate = estimatedMiles * rate;
    const fuelSurcharge = baseRate * 0.18;
    const totalRate = baseRate + fuelSurcharge;

    const loadId = `FRT-${Math.floor(Math.random() * 90000 + 10000)}`;

    return NextResponse.json({
      loadId,
      status: "posted",
      origin,
      destination,
      weight,
      loadType,
      commodity: commodity ?? "General Freight",
      contactEmail: contactEmail ?? null,
      estimatedMiles,
      pricing: {
        baseRate: baseRate.toFixed(2),
        fuelSurcharge: fuelSurcharge.toFixed(2),
        total: totalRate.toFixed(2),
        currency: "USD",
      },
      carriersNotified: Math.floor(Math.random() * 20) + 5,
      estimatedTransitDays: Math.ceil(estimatedMiles / 500),
      postedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const loadId = searchParams.get("loadId");

  if (!loadId) {
    return NextResponse.json({ error: "loadId is required" }, { status: 400 });
  }

  return NextResponse.json({
    loadId,
    status: "in_transit",
    driver: { name: "Robert T.", cdlNumber: "CDL-***-7823", rating: 4.7 },
    vehicle: { type: "Semi-truck", plate: "TRK-5591", make: "Kenworth", model: "T680" },
    sensors: {
      temperature: 34,
      humidity: 62,
      impactEvents: 0,
      gpsLocation: { lat: 41.8781, lng: -87.6298, address: "I-80, Chicago, IL" },
    },
    estimatedArrival: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
  });
}
