import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const type = body?.type ?? "video_mvp";

    const jobId = crypto.randomUUID();

    if (type === "video_mvp") {
      return NextResponse.json({
        jobId,
        type,
        steps: [
          { step: 1, name: "Generate storyboard images", endpoint: "/api/image" },
          { step: 2, name: "Store frames", note: "Use Supabase Storage later (recommended)" },
          { step: 3, name: "Create video", note: "Add Runway/Pika/Replicate later" },
        ],
      });
    }

    return NextResponse.json({ jobId, type, steps: [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}