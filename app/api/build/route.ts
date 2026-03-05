// app/api/build/route.ts — SSE streaming build pipeline endpoint
// Accepts: POST { prompt, model?, mode?, projectId?, existingFiles?, projectMemory?, context? }
// Streams:  text/event-stream with stage/files/error events
//
// mode: 'code' (default) | 'website' | 'mobile'
//   website → generates a multi-page Next.js site with design tokens + stable images
//   mobile  → generates an Expo Router project under mobile/ with UI primitives + mock data

export const runtime = "nodejs";

import { runOrchestratorV4 } from "@/agents/orchestrator-v4";
import { ProgressStage } from "@/lib/ai/progress-events";
import type { GeneratedFile } from "@/lib/ai/schema";
import { evaluateUI } from "@/lib/ai/ui-evaluator";
import { polishUI } from "@/lib/ai/ui-polish";

export type BuildMode = "code" | "website" | "mobile";

type SSEStageType = "BLUEPRINT" | "MANIFEST" | "GENERATE" | "VALIDATE" | "FIX" | "POLISH" | "DONE";

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

/** Enrich the user prompt based on build mode */
function enrichPrompt(prompt: string, mode: BuildMode): string {
  if (mode === "website") {
    return (
      `Build a complete, production-quality multi-page Next.js website. ` +
      `Use the design tokens from lib/design/tokens.ts and components from components/ui/*.tsx. ` +
      `Reference stable stock images from lib/assets.ts (picsum.photos stable IDs) for hero, features, and avatars. ` +
      `Use lucide-react icons via components/icons/Icon.tsx — no emoji in the UI. ` +
      `Include: homepage with hero section, features grid, testimonials (believable names + quotes), ` +
      `pricing tiers (3 tiers: Free/Pro/Enterprise), FAQ section, about page, contact page with form. ` +
      `Generate at minimum 15 files. All TypeScript. ` +
      `User request: ${prompt}`
    );
  }
  if (mode === "mobile") {
    return (
      `Build a complete Expo Router mobile app under the mobile/ directory. ` +
      `Structure: mobile/app/_layout.tsx, mobile/app/(tabs)/index.tsx, mobile/app/(tabs)/_layout.tsx, ` +
      `mobile/components/ui/ (Button, Card, Badge, Input primitives), ` +
      `mobile/theme/tokens.ts (design tokens), mobile/lib/mock-data.ts (realistic mock data), ` +
      `mobile/README.md (setup instructions). ` +
      `Use lucide-react-native for icons. Use expo-router for navigation. ` +
      `Each screen must include loading, empty, error, and success states. ` +
      `Use realistic mock data — no Lorem ipsum. ` +
      `Generate at minimum 12 files. All TypeScript. ` +
      `User request: ${prompt}`
    );
  }
  return prompt;
}

function encodeSSE(event: SSEEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}

export async function POST(req: Request): Promise<Response> {
  let body: {
    prompt?: string;
    model?: string;
    mode?: BuildMode;
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

  const { prompt, model = "gpt-4o", mode = "code", existingFiles = [] } = body;

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

        // Enrich prompt based on mode
        const enrichedPrompt = enrichPrompt(String(prompt), mode);

        const result = await runOrchestratorV4(
          enrichedPrompt,
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
          },
          model
        );

        let finalFiles = result.files;

        // UI polish loop for website/mobile builds
        if (mode === "website" || mode === "mobile") {
          const initialEval = evaluateUI(finalFiles);
          const POLISH_THRESHOLD = 85;
          const MAX_POLISH_PASSES = 2;

          if (initialEval.score < POLISH_THRESHOLD) {
            let passNum = 1;
            let currentFiles = finalFiles;

            while (passNum <= MAX_POLISH_PASSES) {
              const totalPasses = MAX_POLISH_PASSES + 1; // e.g. "Pass 2/3"
              send({
                type: "stage",
                stage: "POLISH",
                message: `Pass ${passNum + 1}/${totalPasses}: UI polish (score: ${evaluateUI(currentFiles).score}/100)`,
                progress: Math.round(85 + (passNum / MAX_POLISH_PASSES) * 10),
              });

              const polishResult = await polishUI(currentFiles, {
                model,
                maxIterations: 1,
                scoreThreshold: POLISH_THRESHOLD,
              });

              currentFiles = polishResult.files;
              if (polishResult.evalResult.score >= POLISH_THRESHOLD) break;
              passNum++;
            }

            finalFiles = currentFiles;
          }
        }

        // Emit all generated files
        send({ type: "files", files: finalFiles });
        send({ type: "stage", stage: "DONE", message: result.summary, progress: 100 });
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
