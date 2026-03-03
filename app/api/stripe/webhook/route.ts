import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json(
        { error: "Missing STRIPE_WEBHOOK_SECRET in .env.local" },
        { status: 500 }
      );
    }

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    // Parse the event payload
    // NOTE: In production, verify the signature using the Stripe SDK:
    //   import Stripe from 'stripe';
    //   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    //   const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    // This prevents replay attacks and ensures events are genuine.
    let event: { type: string; data: { object: Record<string, unknown> } };
    try {
      event = JSON.parse(body);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed":
        // Payment successful
        break;
      case "customer.subscription.created":
        // Subscription created
        break;
      case "customer.subscription.deleted":
        // Subscription cancelled
        break;
      case "invoice.payment_failed":
        // Payment failed
        break;
      default:
        // Unknown event type — ignore
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
