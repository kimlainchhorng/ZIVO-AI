import { NextResponse } from "next/server";
import { runOrchestratorV2, type AgentV2File } from "@/agents/orchestrator-v2";

export const runtime = "nodejs";

export interface AgentV2Request {
  prompt: string;
  files?: AgentV2File[];
  stream?: boolean;
  maxIterations?: number;
}

export async function POST(req: Request): Promise<Response> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      prompt,
      files = [],
      stream = false,
      maxIterations = 5,
    }: AgentV2Request = body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "Missing or invalid prompt" },
        { status: 400 }
      );
    }

    if (stream) {
      // Server-Sent Events streaming
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          const send = (event: string, data: unknown) => {
            controller.enqueue(
              encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
            );
          };

          try {
            send("step", { message: "Planning…", status: "running" });

            const result = await runOrchestratorV2(
              prompt.trim(),
              files,
              Math.min(Math.max(1, maxIterations), 5)
            );

            for (const step of result.steps) {
              send("step", { message: step.step, status: step.status, detail: step.detail });
            }

            send("result", {
              files: result.files,
              validation: result.validation,
              summary: result.summary,
              iterations: result.iterations,
            });
          } catch (err: unknown) {
            send("error", { message: (err as Error)?.message ?? "Server error" });
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Non-streaming response
    const result = await runOrchestratorV2(
      prompt.trim(),
      files,
      Math.min(Math.max(1, maxIterations), 5)
    );

    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
