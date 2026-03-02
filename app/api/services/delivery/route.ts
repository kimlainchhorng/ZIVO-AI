import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { restaurantId, items, deliveryAddress, customerId, promoCode } = body;

    if (!restaurantId || !items || !deliveryAddress) {
      return NextResponse.json(
        { error: "restaurantId, items, and deliveryAddress are required" },
        { status: 400 }
      );
    }

    const subtotal = (items as { price: number; qty: number }[]).reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    );
    const deliveryFee = 1.99;
    const serviceFee = Math.round(subtotal * 0.1 * 100) / 100;
    const discount = promoCode === "ZIVO20" ? Math.round(subtotal * 0.2 * 100) / 100 : 0;
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const total = subtotal + deliveryFee + serviceFee + tax - discount;

    const orderId = `DR-${Math.floor(Math.random() * 90000 + 10000)}`;

    return NextResponse.json({
      orderId,
      status: "confirmed",
      restaurantId,
      customerId: customerId ?? null,
      deliveryAddress,
      items,
      pricing: {
        subtotal: subtotal.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        serviceFee: serviceFee.toFixed(2),
        tax: tax.toFixed(2),
        discount: discount.toFixed(2),
        total: total.toFixed(2),
      },
      estimatedDelivery: Math.floor(Math.random() * 20) + 25,
      createdAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  const statuses = ["confirmed", "preparing", "driver_assigned", "picked_up", "on_the_way", "delivered"];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

  return NextResponse.json({
    orderId,
    status: randomStatus,
    estimatedArrival: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    driver: {
      name: "James K.",
      rating: 4.8,
      location: { lat: 37.7749, lng: -122.4194 },
    },
  });
}
