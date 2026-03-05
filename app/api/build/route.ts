// app/api/build/route.ts — SSE streaming build pipeline endpoint
// Accepts: POST { prompt, model?, projectId?, existingFiles?, projectMemory?, context? }
// Streams:  text/event-stream with stage/files/error events

export const runtime = "nodejs";

import { runOrchestratorV4 } from "@/agents/orchestrator-v4";
import { ProgressStage } from "@/lib/ai/progress-events";
import type { GeneratedFile } from "@/lib/ai/schema";

type SSEStageType = "BLUEPRINT" | "MANIFEST" | "GENERATE" | "VALIDATE" | "FIX" | "DONE";

interface StageEvent {
  type: "stage";
  stage: SSEStageType;
  message: string;
  progress?: number;
}

interface FilesEvent {
  type: "files";
  files: GeneratedFile[];
}

interface ErrorEvent {
  type: "error";
  message: string;
  details?: unknown;
}

type SSEEvent = StageEvent | FilesEvent | ErrorEvent;

const PROGRESS_STAGE_MAP: Partial<Record<ProgressStage, SSEStageType>> = {
  [ProgressStage.BLUEPRINT]: "BLUEPRINT",
  [ProgressStage.ARCHITECTURE]: "BLUEPRINT",
  [ProgressStage.MANIFEST]: "MANIFEST",
  [ProgressStage.GENERATING]: "GENERATE",
  [ProgressStage.VALIDATING]: "VALIDATE",
  [ProgressStage.FIXING]: "FIX",
  [ProgressStage.DONE]: "DONE",
};

function encodeSSE(event: SSEEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}

export async function POST(req: Request): Promise<Response> {
  let body: {
    prompt?: string;
    model?: string;
    projectId?: string;
    existingFiles?: GeneratedFile[];
    projectMemory?: Record<string, unknown> | null;
    context?: unknown;
  };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return new Response(
      `data: ${JSON.stringify({ type: "error", message: "Invalid JSON body" })}\n\n`,
      { status: 400, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  const { prompt, model = "gpt-4o", existingFiles = [], projectMemory = null } = body;

  if (!prompt?.trim()) {
    return new Response(
      `data: ${JSON.stringify({ type: "error", message: "prompt is required" })}\n\n`,
      { status: 400, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      `data: ${JSON.stringify({ type: "error", message: "OPENAI_API_KEY is not configured" })}\n\n`,
      { status: 500, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: SSEEvent): void => {
        try {
          controller.enqueue(encodeSSE(event));
        } catch {
          // Client disconnected; ignore enqueue errors
        }
      };

      // Heartbeat to keep the connection alive during long AI calls
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15_000);

      try {
        // Sanitise existingFiles to match GeneratedFile shape
        const safeExisting: GeneratedFile[] = Array.isArray(existingFiles)
          ? existingFiles.map((f) => ({
              path: String(f.path ?? ""),
              content: String(f.content ?? ""),
              action: (["create", "update", "delete"].includes(f.action ?? "") ? f.action : "create") as
                | "create"
                | "update"
                | "delete",
            }))
          : [];

        await runOrchestratorV4(
          prompt,
          safeExisting,
          null, // project memory handled client-side
          (progressEvent) => {
            const sseStage = PROGRESS_STAGE_MAP[progressEvent.stage];
            if (sseStage) {
              send({
                type: "stage",
                stage: sseStage,
                message: progressEvent.message,
                progress: progressEvent.progress,
              });
            }

            // Emit incremental file list whenever the GENERATING stage completes a batch
            if (
              progressEvent.stage === ProgressStage.GENERATING &&
              progressEvent.progress > 0 &&
              Array.isArray((progressEvent.data as { generated?: string[] } | undefined)?.generated)
            ) {
              // Batch completion events carry the paths; full file list emitted at DONE
            }
          },
          model
        ).then((result) => {
          // Emit all generated files
          send({ type: "files", files: result.files });
          send({ type: "stage", stage: "DONE", message: result.summary, progress: 100 });
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Build pipeline error";
        send({ type: "error", message, details: err instanceof Error ? err.stack : undefined });
      } finally {
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
