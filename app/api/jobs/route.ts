import { NextResponse } from "next/server";
import { defaultQueue } from "../../../lib/job-queue";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const jobId = url.searchParams.get("jobId");

  if (jobId) {
    const job = defaultQueue.getJob(jobId);
    if (!job) {
      return NextResponse.json({ error: `Job ${jobId} not found` }, { status: 404 });
    }
    return NextResponse.json({ job });
  }

  return NextResponse.json({ jobs: defaultQueue.getAll() });
}

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { type, payload } = body as { type?: string; payload?: unknown };

    if (!type || typeof type !== "string") {
      return NextResponse.json({ error: "type is required" }, { status: 400 });
    }

    const jobId = defaultQueue.enqueue(type, payload ?? {});
    const job = defaultQueue.getJob(jobId);
    return NextResponse.json({ jobId, job }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
