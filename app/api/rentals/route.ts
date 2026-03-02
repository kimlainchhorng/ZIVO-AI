import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { carId, pickupDate, dropoffDate, pickupLocation, dropoffLocation, insuranceType = "standard" } = body;

    if (!carId || !pickupDate || !dropoffDate) {
      return NextResponse.json({ error: "carId, pickupDate, and dropoffDate are required" }, { status: 400 });
    }

    const days = Math.max(1, Math.round((new Date(dropoffDate).getTime() - new Date(pickupDate).getTime()) / (1000 * 60 * 60 * 24)));
    const dailyRates: Record<string, number> = { c1: 45, c2: 89, c3: 125, c4: 165 };
    const insuranceCosts: Record<string, number> = { basic: 8.99, standard: 14.99, premium: 24.99 };
    const dailyRate = dailyRates[carId] ?? 65;
    const insuranceDailyCost = insuranceCosts[insuranceType] ?? 14.99;
    const basePrice = days * dailyRate;
    const insuranceCost = days * insuranceDailyCost;
    const totalPrice = basePrice + insuranceCost;

    return NextResponse.json({
      id: `RNT-${Date.now()}`,
      carId,
      pickupDate,
      dropoffDate,
      pickupLocation: pickupLocation ?? "SFO Airport",
      dropoffLocation: dropoffLocation ?? pickupLocation ?? "SFO Airport",
      days,
      dailyRate,
      basePrice: parseFloat(basePrice.toFixed(2)),
      insurance: { type: insuranceType, dailyCost: insuranceDailyCost, totalCost: parseFloat(insuranceCost.toFixed(2)) },
      totalPrice: parseFloat(totalPrice.toFixed(2)),
      status: "confirmed",
      licenseVerified: false,
      confirmationCode: `ZR-${Math.floor(10000 + Math.random() * 90000)}`,
      createdAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    available: [
      { id: "c1", make: "Toyota", model: "Corolla", category: "economy", dailyRate: 45 },
      { id: "c2", make: "Ford", model: "Explorer", category: "suv", dailyRate: 89 },
      { id: "c4", make: "BMW", model: "5 Series", category: "luxury", dailyRate: 165 },
    ],
  });
}
