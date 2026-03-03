import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json(
        { error: "Missing STRIPE_SECRET_KEY in .env.local" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { priceId, successUrl, cancelUrl } = body as {
      priceId?: string;
      successUrl?: string;
      cancelUrl?: string;
    };

    if (!priceId || typeof priceId !== "string") {
      return NextResponse.json({ error: "priceId is required" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const finalSuccessUrl =
      successUrl && typeof successUrl === "string"
        ? successUrl
        : `${appUrl}/dashboard?checkout=success`;
    const finalCancelUrl =
      cancelUrl && typeof cancelUrl === "string"
        ? cancelUrl
        : `${appUrl}/dashboard?checkout=cancelled`;

    const params = new URLSearchParams({
      "payment_method_types[]": "card",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      mode: "subscription",
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
    });

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await response.json() as { url?: string; id?: string; error?: { message: string } };

    if (!response.ok) {
      return NextResponse.json(
        { error: session.error?.message ?? "Stripe API error" },
        { status: response.status }
      );
    }

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
