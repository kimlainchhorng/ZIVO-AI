// app/api/stream/route.ts — SSE streaming endpoint for build pipeline progress

export const runtime = 'nodejs';

import type { NextRequest } from 'next/server';
import { ProgressStage, createProgressEvent } from '@/lib/ai/progress-events';

const HEARTBEAT_INTERVAL_MS = 15000;

function buildSSEStream(projectId: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    start(controller) {
      // Send initial connection event
      const connectEvent = createProgressEvent(
        ProgressStage.INTENT,
        `Connected to stream for project ${projectId}`,
        0,
        { projectId }
      );
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(connectEvent)}\n\n`));

      // Send periodic heartbeat comments to keep the connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeat);
        }
      }, HEARTBEAT_INTERVAL_MS);

      // Clean up on cancel
      return () => {
        clearInterval(heartbeat);
      };
    },
  });
}

/** GET /api/stream?projectId=xxx — open SSE stream for a project */
export async function GET(request: NextRequest): Promise<Response> {
  const projectId = request.nextUrl.searchParams.get('projectId') ?? 'default';

  const stream = buildSSEStream(projectId);

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

/** POST /api/stream — emit a custom progress event */
export async function POST(request: NextRequest): Promise<Response> {
  const raw = await request.json() as unknown;
  if (!raw || typeof raw !== 'object') {
    return Response.json({ ok: false, error: 'Invalid request body' }, { status: 400 });
  }
  const body = raw as Record<string, unknown>;
  const projectId = typeof body.projectId === 'string' ? body.projectId : 'default';
  const stage = typeof body.stage === 'string' ? body.stage : 'INTENT';
  const message = typeof body.message === 'string' ? body.message : '';
  const progress = typeof body.progress === 'number' ? body.progress : 0;

  const stageEnum = (ProgressStage[stage as keyof typeof ProgressStage] ?? ProgressStage.INTENT);

  const event = createProgressEvent(stageEnum, message, progress, { projectId });

  return Response.json({ ok: true, event });
}
