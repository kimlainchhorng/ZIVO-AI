import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { pickupAddress, deliveryAddress, size, weight, specialHandling, declaredValue } = body;

    if (!pickupAddress || !deliveryAddress || !size) {
      return NextResponse.json(
        { error: "pickupAddress, deliveryAddress, and size are required" },
        { status: 400 }
      );
    }

    const basePrices: Record<string, number> = {
      small: 4.99,
      medium: 8.99,
      large: 14.99,
      xl: 24.99,
    };

    const basePrice = basePrices[size as string] ?? 8.99;
    const insuranceFee = declaredValue ? Math.round((declaredValue as number) * 0.02 * 100) / 100 : 0;
    const coldChainFee = (specialHandling as string[] ?? []).includes("cold") ? 12.99 : 0;
    const total = basePrice + insuranceFee + coldChainFee;

    const trackingNumber = `PKG-${Date.now().toString(36).toUpperCase()}`;

    return NextResponse.json({
      trackingNumber,
      status: "scheduled",
      pickupAddress,
      deliveryAddress,
      size,
      weight: weight ?? null,
      specialHandling: specialHandling ?? [],
      declaredValue: declaredValue ?? 0,
      pricing: {
        base: basePrice.toFixed(2),
        insurance: insuranceFee.toFixed(2),
        coldChain: coldChainFee.toFixed(2),
        total: total.toFixed(2),
      },
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const trackingNumber = searchParams.get("trackingNumber");

  if (!trackingNumber) {
    return NextResponse.json({ error: "trackingNumber is required" }, { status: 400 });
  }

  return NextResponse.json({
    trackingNumber,
    status: "out_for_delivery",
    checkpoints: [
      { status: "Picked Up", timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), location: "Origin Facility" },
      { status: "In Transit", timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString(), location: "Regional Hub" },
      { status: "Out for Delivery", timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), location: "Local Depot" },
    ],
    estimatedDelivery: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    driver: { name: "Carlos M.", phone: "+1-555-0182" },
  });
}
