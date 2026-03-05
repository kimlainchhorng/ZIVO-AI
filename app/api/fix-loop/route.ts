// app/api/fix-loop/route.ts — AI Fix Loop Streaming API

import { NextResponse } from "next/server";
import { runFixLoop } from "@/lib/ai/fix-loop";
import type { GeneratedFile } from "@/lib/build-runner";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    description: "AI Fix Loop — POST { files, maxRetries? } to run build validation + AI fix loop with SSE streaming",
  });
}

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { files, maxRetries = 3 } = body as {
    files?: GeneratedFile[];
    maxRetries?: number;
  };

  if (!Array.isArray(files) || files.length === 0) {
    return NextResponse.json({ error: "files array is required" }, { status: 400 });
  }

  for (const f of files) {
    if (!f || typeof (f as GeneratedFile).path !== "string" || typeof (f as GeneratedFile).content !== "string") {
      return NextResponse.json(
        { error: "Each file must have path (string) and content (string)" },
        { status: 400 }
      );
    }
  }

  const safeMaxRetries = Math.min(Math.max(1, Number(maxRetries) || 3), 5);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        send({ type: "progress", message: "Starting fix loop…", iteration: 0 });

        const result = await runFixLoop(
          files as { path: string; content: string }[],
          safeMaxRetries,
          (iteration, errors) => {
            send({
              type: "progress",
              message: `Iteration ${iteration}: found ${errors.length} error(s)`,
              iteration,
              errors,
            });
          }
        );

        if (result.success) {
          send({
            type: "fixed",
            message: `Fixed in ${result.iterations} iteration(s)`,
            files: result.finalFiles,
            iteration: result.iterations,
          });
        }

        send({
          type: "done",
          message: result.success ? "Build successful" : "Max retries reached",
          files: result.finalFiles,
          iterations: result.iterations,
          success: result.success,
          finalErrors: result.buildHistory[result.buildHistory.length - 1]?.errors ?? [],
        });
      } catch (err: unknown) {
        send({
          type: "error",
          message: (err as Error)?.message ?? "Fix loop failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
