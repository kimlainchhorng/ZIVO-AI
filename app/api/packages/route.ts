import { NextResponse } from "next/server";
import type { PackageSize } from "@/lib/services-types";

export const runtime = "nodejs";

const pricingTable: Record<PackageSize, number> = {
  envelope: 4.99,
  small: 8.99,
  medium: 14.99,
  large: 24.99,
  xl: 39.99,
  freight: 99.99,
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { packageSize = "small", pickupAddress, deliveryAddress, recipientName, recipientPhone, specialHandling = [], insurance = false } = body;

    if (!pickupAddress || !deliveryAddress) {
      return NextResponse.json({ error: "pickupAddress and deliveryAddress are required" }, { status: 400 });
    }

    const basePrice = pricingTable[packageSize as PackageSize] ?? 8.99;
    const insuranceFee = insurance ? 2.99 : 0;
    const specialHandlingFee = (specialHandling as string[]).includes("Temperature Controlled") ? 9.99 : 0;
    const total = basePrice + insuranceFee + specialHandlingFee;

    const trackingNumber = `ZIVO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return NextResponse.json({
      id: `PKG-${Date.now()}`,
      trackingNumber,
      status: "scheduled",
      packageSize,
      pickupAddress,
      deliveryAddress,
      recipientName: recipientName ?? "Recipient",
      recipientPhone: recipientPhone ?? null,
      specialHandling,
      insurance,
      pricing: { basePrice, insuranceFee, specialHandlingFee, total: parseFloat(total.toFixed(2)) },
      estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const trackingNumber = searchParams.get("tracking");
  if (!trackingNumber) {
    return NextResponse.json({ error: "tracking number is required" }, { status: 400 });
  }
  return NextResponse.json({ trackingNumber, status: "in_transit", estimatedDelivery: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString() });
}
