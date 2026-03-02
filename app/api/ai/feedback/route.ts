import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * AI Feedback API – Human-in-the-Loop
 * POST /api/ai/feedback  – submit feedback on an AI output
 * GET  /api/ai/feedback  – retrieve aggregated feedback
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    feedback: [],
    stats: { total: 0, positive: 0, negative: 0, corrections: 0 },
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { generationId, rating, correction, comment } = body as {
    generationId?: string;
    rating?: "positive" | "negative";
    correction?: string;
    comment?: string;
  };

  if (!generationId) {
    return NextResponse.json({ error: "generationId required" }, { status: 400 });
  }

  // TODO: persist feedback to database and trigger model improvement pipeline
  return NextResponse.json({
    ok: true,
    id: crypto.randomUUID(),
    generationId,
    rating,
    correction,
    comment,
    createdAt: new Date().toISOString(),
  });
}
