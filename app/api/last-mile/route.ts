import { NextResponse } from "next/server";
import type { DeliverySpeed } from "@/lib/services-types";

export const runtime = "nodejs";

const pricingMap: Record<DeliverySpeed, number> = {
  next_hour: 14.99,
  same_day: 7.99,
  scheduled: 4.99,
  standard: 2.99,
};

const etaMap: Record<DeliverySpeed, string> = {
  next_hour: "Within 60 minutes",
  same_day: "By 9 PM today",
  scheduled: "At selected window",
  standard: "1–3 business days",
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { speed = "same_day", pickupAddress, deliveryAddress, scheduledWindow, requirePhotoProof = true, geofenceEnabled = true } = body;

    if (!pickupAddress || !deliveryAddress) {
      return NextResponse.json({ error: "pickupAddress and deliveryAddress are required" }, { status: 400 });
    }

    const deliveryId = `LM-${Date.now()}`;
    const price = pricingMap[speed as DeliverySpeed] ?? 7.99;
    const eta = etaMap[speed as DeliverySpeed] ?? "Today";

    return NextResponse.json({
      id: deliveryId,
      speed,
      status: "scheduled",
      pickupAddress,
      deliveryAddress,
      scheduledWindow: scheduledWindow ?? null,
      requirePhotoProof,
      geofenceEnabled,
      price,
      eta,
      courierId: null,
      trackingUrl: `/track/${deliveryId}`,
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
  return NextResponse.json({ id, status: "out_for_delivery", estimatedArrival: "15 min" });
}
