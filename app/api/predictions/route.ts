import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Predictive Intelligence API
 * GET  /api/predictions  – fetch AI-generated predictions for a tenant
 * POST /api/predictions  – request a specific prediction
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");

  return NextResponse.json({
    ok: true,
    tenantId,
    predictions: [
      { type: "usage", forecast: "Usage expected to grow 25% next month", confidence: 0.82 },
      { type: "cost", forecast: "Estimated cost: $48 next billing cycle", confidence: 0.78 },
      { type: "feature", suggestion: "Enable caching to reduce API calls by ~30%", confidence: 0.91 },
    ],
    generatedAt: new Date().toISOString(),
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { tenantId, type } = body as {
    tenantId?: string;
    type?: string;
    context?: Record<string, unknown>;
  };

  if (!tenantId || !type) {
    return NextResponse.json({ error: "tenantId and type required" }, { status: 400 });
  }

  // TODO: run ML prediction pipeline
  return NextResponse.json({
    ok: true,
    prediction: {
      id: crypto.randomUUID(),
      tenantId,
      type,
      result: null,
      status: "queued",
      requestedAt: new Date().toISOString(),
    },
  });
}
