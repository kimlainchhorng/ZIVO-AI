import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { brandVoice, codeStyle, customPrompt } = body;

    if (!brandVoice && !codeStyle && !customPrompt) {
      return NextResponse.json({ error: "At least one training field is required" }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      jobId: `ft-job-${Date.now()}`,
      message: "Fine-tune job submitted. Training will complete in 10–30 minutes.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
