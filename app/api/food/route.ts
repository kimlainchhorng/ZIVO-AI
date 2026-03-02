import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { restaurantId, items, deliveryAddress, specialInstructions } = body;

    if (!restaurantId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "restaurantId and items are required" }, { status: 400 });
    }

    const subtotal = items.reduce((sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity, 0);
    const deliveryFee = 1.99;
    const serviceFee = 0.99;

    const orderId = `ORD-${Date.now()}`;
    const estimatedMinutes = 25 + Math.floor(Math.random() * 20);

    return NextResponse.json({
      id: orderId,
      restaurantId,
      status: "confirmed",
      items,
      deliveryAddress: deliveryAddress ?? "On file",
      subtotal: parseFloat(subtotal.toFixed(2)),
      deliveryFee,
      serviceFee,
      tip: 0,
      total: parseFloat((subtotal + deliveryFee + serviceFee).toFixed(2)),
      estimatedDelivery: new Date(Date.now() + estimatedMinutes * 60 * 1000).toISOString(),
      specialInstructions: specialInstructions ?? null,
      placedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("id");
  if (!orderId) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  return NextResponse.json({ id: orderId, status: "preparing", estimatedDelivery: new Date(Date.now() + 20 * 60 * 1000).toISOString() });
}
