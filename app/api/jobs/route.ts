import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Job Queue Monitor API
 * GET  /api/jobs  – list jobs and their status
 * POST /api/jobs  – enqueue a new background job
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const queue = searchParams.get("queue");

  return NextResponse.json({
    ok: true,
    jobs: [],
    stats: {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    },
    filter: { status, queue },
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { queue, type, payload, priority, delay } = body as {
    queue?: string;
    type?: string;
    payload?: Record<string, unknown>;
    priority?: number;
    delay?: number;
  };

  if (!queue || !type) {
    return NextResponse.json({ error: "queue and type required" }, { status: 400 });
  }

  // TODO: enqueue via Bull/RabbitMQ
  return NextResponse.json({
    ok: true,
    job: {
      id: crypto.randomUUID(),
      queue,
      type,
      payload,
      priority: priority ?? 0,
      delay: delay ?? 0,
      status: "waiting",
      createdAt: new Date().toISOString(),
    },
  });
}
