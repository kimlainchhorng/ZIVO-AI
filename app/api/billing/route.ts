import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Billing & Monetization API
 * GET  /api/billing  – retrieve current subscription and usage
 * POST /api/billing  – create or update a subscription
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  }

  // TODO: query billing provider (Stripe, etc.)
  return NextResponse.json({
    ok: true,
    subscription: {
      tenantId,
      plan: "starter",
      status: "active",
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      usage: { generations: 0, limit: 100 },
    },
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { tenantId, plan, paymentMethodId } = body as {
    tenantId?: string;
    plan?: string;
    paymentMethodId?: string;
  };

  if (!tenantId || !plan) {
    return NextResponse.json({ error: "tenantId and plan required" }, { status: 400 });
  }

  // TODO: create/update subscription via payment provider
  return NextResponse.json({
    ok: true,
    subscription: {
      id: crypto.randomUUID(),
      tenantId,
      plan,
      paymentMethodId,
      status: "active",
      createdAt: new Date().toISOString(),
    },
  });
}
