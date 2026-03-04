import { NextResponse } from "next/server";
import OpenAI from "openai";
import { WEBSITE_BUILDER_SYSTEM_PROMPT } from "@/prompts/website-builder";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

interface StreamStep {
  type: "step" | "log" | "error" | "done";
  status?: "running" | "done" | "error";
  label?: string;
  iteration?: number;
  maxIterations?: number;
  message?: string;
  files?: Array<{ path: string; content: string; action: string }>;
  preview_html?: string;
  summary?: string;
}

function encodeStep(step: StreamStep): string {
  return `data: ${JSON.stringify(step)}\n\n`;
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({})) as {
      prompt?: string;
      model?: string;
      mode?: string;
    };
    const { prompt, model = "gpt-4o", mode = "advanced" } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is missing" }, { status: 500 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (step: StreamStep) => {
          controller.enqueue(encoder.encode(encodeStep(step)));
        };

        try {
          send({ type: "step", status: "running", label: "Understanding your prompt…", iteration: 1, maxIterations: mode === "advanced" ? 8 : 3 });

          const maxIter = mode === "advanced" ? 3 : 1;

          for (let iteration = 1; iteration <= maxIter; iteration++) {
            send({
              type: "step",
              status: "running",
              label: iteration === 1 ? "Generating code…" : `Auto-fixing errors… (pass ${iteration}/${maxIter})`,
              iteration,
              maxIterations: maxIter,
            });

            const messages: OpenAI.ChatCompletionMessageParam[] = [
              { role: "system", content: WEBSITE_BUILDER_SYSTEM_PROMPT },
              {
                role: "user",
                content: iteration === 1
                  ? `Build: ${prompt}`
                  : `Build: ${prompt}\n\nIteration ${iteration}/${maxIter}: Fix any issues and improve quality.`,
              },
            ];

            let raw = "";
            try {
              const completion = await getClient().chat.completions.create({
                model,
                temperature: 0.3,
                max_tokens: 8192,
                messages,
              });
              raw = completion.choices?.[0]?.message?.content ?? "";
            } catch {
              send({ type: "error", message: "OpenAI request failed" });
              break;
            }

            send({ type: "log", message: `> Iteration ${iteration}: received ${raw.length} chars` });

            // Try to parse JSON
            let parsed: { files?: Array<{ path: string; content: string; action: string }>; preview_html?: string; summary?: string } | null = null;
            const match = raw.match(/\{[\s\S]*\}/);
            if (match) {
              try { parsed = JSON.parse(match[0]); } catch { /* continue */ }
            }

            if (parsed?.files?.length) {
              send({ type: "step", status: "done", label: `Iteration ${iteration} complete`, iteration, maxIterations: maxIter });
              send({
                type: "done",
                files: parsed.files,
                preview_html: parsed.preview_html,
                summary: parsed.summary,
              });
              controller.close();
              return;
            }

            send({ type: "step", status: "error", label: `Iteration ${iteration} failed to parse output`, iteration, maxIterations: maxIter });
          }

          // Fallback: no valid output
          send({ type: "error", message: "Build failed after all iterations" });
        } catch (err: unknown) {
          send({ type: "error", message: (err as Error)?.message ?? "Unknown error" });
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error)?.message ?? "Server error" }, { status: 500 });
  }
}
