// POST /api/projects/[id]/continue — continue building an existing project
// Loads existing files from Supabase, runs a patch build via /api/build,
// then saves the updated files and appends a build record.
//
// Body: { instruction: string; model?: string }
// Streams: text/event-stream (same SSE format as /api/build)

export const runtime = "nodejs";

import {
  extractBearerToken,
  getUserFromToken,
  getProject,
  getProjectFiles,
  upsertProjectFiles,
  appendProjectBuild,
} from "@/lib/db/projects-db";
import type { GeneratedFile } from "@/lib/ai/schema";

type SSEEventRaw = {
  type: string;
  stage?: string;
  message?: string;
  progress?: number;
  files?: GeneratedFile[];
  details?: unknown;
};

function encodeSSE(payload: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const token = extractBearerToken(req.headers.get("Authorization"));
  if (!token) {
    return new Response(
      `data: ${JSON.stringify({ type: "error", message: "Unauthorized" })}\n\n`,
      { status: 401, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  const user = await getUserFromToken(token);
  if (!user) {
    return new Response(
      `data: ${JSON.stringify({ type: "error", message: "Unauthorized" })}\n\n`,
      { status: 401, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  let body: { instruction?: string; model?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(
      `data: ${JSON.stringify({ type: "error", message: "Invalid JSON body" })}\n\n`,
      { status: 400, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  const { instruction, model = "gpt-4o" } = body;
  if (!instruction?.trim()) {
    return new Response(
      `data: ${JSON.stringify({ type: "error", message: "instruction is required" })}\n\n`,
      { status: 400, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  // Load existing project + files
  let project;
  let existingFiles: GeneratedFile[] = [];
  try {
    project = await getProject(token, id);
    if (!project) {
      return new Response(
        `data: ${JSON.stringify({ type: "error", message: "Project not found" })}\n\n`,
        { status: 404, headers: { "Content-Type": "text/event-stream" } }
      );
    }
    const dbFiles = await getProjectFiles(token, id);
    existingFiles = dbFiles.map((f) => ({
      path: f.path,
      content: f.content,
      action: "update" as const,
    }));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load project";
    return new Response(
      `data: ${JSON.stringify({ type: "error", message })}\n\n`,
      { status: 500, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: unknown): void => {
        try { controller.enqueue(encodeSSE(payload)); } catch { /* client disconnected; ignore enqueue error */ }
      };

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          // Stream closed; stop heartbeat
          clearInterval(heartbeat);
        }
      }, 15_000);

      try {
        send({ type: "stage", stage: "BLUEPRINT", message: "Loading existing project files…", progress: 5 });

        // Proxy to /api/build with existing files as patch context
        const buildUrl = new URL("/api/build", req.url);
        const buildRes = await fetch(buildUrl.toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: instruction,
            model,
            existingFiles,
            projectId: id,
            mode: project.mode,
          }),
        });

        if (!buildRes.ok || !buildRes.body) {
          send({ type: "error", message: `Build service returned ${buildRes.status}` });
          return;
        }

        // Forward all SSE events from the upstream build stream
        const reader = buildRes.body.getReader();
        const decoder = new TextDecoder();
        let sseBuffer = "";
        let collectedFiles: GeneratedFile[] = [];
        let buildSummary = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          sseBuffer += decoder.decode(value, { stream: true });

          const lines = sseBuffer.split("\n");
          sseBuffer = lines.pop() ?? "";

          for (const line of lines) {
            // Forward raw heartbeat comments
            if (line.startsWith(": ")) {
              try { controller.enqueue(encoder.encode(`${line}\n\n`)); } catch { /* client disconnected */ }
              continue;
            }
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (!raw || raw === "[DONE]") continue;

            // Parse and forward; skip lines that are not valid JSON
            let evt: SSEEventRaw;
            try { evt = JSON.parse(raw) as SSEEventRaw; } catch { continue; }

            send(evt);

            if (evt.type === "files" && Array.isArray(evt.files)) {
              collectedFiles = evt.files as GeneratedFile[];
            }
            if (evt.type === "stage" && evt.stage === "DONE" && evt.message) {
              buildSummary = evt.message;
            }
          }
        }

        // Persist updated files and append build record
        if (collectedFiles.length > 0) {
          await upsertProjectFiles(
            token,
            id,
            collectedFiles
              .filter((f) => f.action !== "delete")
              .map((f) => ({ path: f.path, content: f.content, generated_by: model }))
          );
        }

        await appendProjectBuild(token, id, buildSummary || `Continue build: ${instruction.slice(0, 120)}`);

        send({
          type: "stage",
          stage: "DONE",
          message: buildSummary || "Continue build complete.",
          progress: 100,
          data: { projectId: id },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Continue build error";
        send({ type: "error", message });
      } finally {
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          // Stream was already closed by client disconnect; this is expected
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
