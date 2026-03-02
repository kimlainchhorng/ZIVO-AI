import { NextResponse } from "next/server";
import { submitJob, JobSubmission, JobType } from "@/lib/background-jobs";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { type, projectId, input, maxRetries, webhookUrl } = body;

    if (!type || typeof type !== "string") {
      return NextResponse.json({ error: "type is required" }, { status: 400 });
    }
    if (!input || typeof input !== "object") {
      return NextResponse.json({ error: "input object is required" }, { status: 400 });
    }

    const submission: JobSubmission = {
      type: type as JobType,
      projectId,
      input,
      maxRetries,
      webhookUrl,
    };

    const job = submitJob(submission);
    return NextResponse.json({ ok: true, job }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
