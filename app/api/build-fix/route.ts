// app/api/build-fix/route.ts — SSE streaming Build/Test/Fix loop

import OpenAI from "openai";
import { validateFiles } from "../../../agents/validator";
import { stripMarkdownFences } from "../../../lib/code-parser";
import { CODE_BUILDER_SYSTEM_PROMPT } from "../../../prompts/code-builder";

export const runtime = "nodejs";

const FIX_MODE_SUFFIX = `

## FIX MODE
You have been given files with validation errors. Fix ONLY the errors listed.
Return ONLY the files that changed in the same JSON format:
{
  "files": [{ "path": "...", "content": "...", "action": "update" }],
  "summary": "What was fixed"
}`;

const FIX_SYSTEM_PROMPT = CODE_BUILDER_SYSTEM_PROMPT + FIX_MODE_SUFFIX;

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

interface InputFile {
  path: string;
  content: string;
}

interface FixedFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

function encode(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: Request): Promise<Response> {
  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      encode({ type: "error", message: "Missing OPENAI_API_KEY in environment" }),
      {
        status: 500,
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      }
    );
  }

  let body: {
    files?: Record<string, string>;
    prompt?: string;
    maxIterations?: number;
  };

  try {
    body = await req.json();
  } catch {
    return new Response(
      encode({ type: "error", message: "Invalid JSON in request body" }),
      {
        status: 400,
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      }
    );
  }

  const { files: filesMap = {}, prompt, maxIterations = 5 } = body;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller): Promise<void> {
      const enqueue = (data: Record<string, unknown>): void => {
        controller.enqueue(encoder.encode(encode(data)));
      };

      try {
        if (
          typeof filesMap !== "object" ||
          filesMap === null ||
          Array.isArray(filesMap)
        ) {
          enqueue({ type: "error", message: "'files' must be a Record<string, string>" });
          controller.close();
          return;
        }

        const clampedMax = Math.min(Math.max(1, maxIterations ?? 5), 10);

        // Convert file map to array format expected by validator
        let currentFiles: InputFile[] = Object.entries(filesMap).map(
          ([path, content]) => ({ path, content })
        );

        enqueue({ type: "step", step: "Analyzing files…", status: "running" });

        let finalFiles = currentFiles;
        let iterationCount = 0;
        let lastValid = false;

        for (let i = 0; i < clampedMax; i++) {
          iterationCount = i + 1;

          const validation = validateFiles(currentFiles);
          const errors = validation.issues.filter((issue) => issue.type === "error");

          if (validation.valid || errors.length === 0) {
            enqueue({
              type: "step",
              step: `Pass ${i + 1}: ${i === 0 ? "No errors found" : "All errors resolved"}`,
              status: "done",
              detail: validation.summary,
            });
            lastValid = true;
            finalFiles = currentFiles;
            break;
          }

          const errorDetail = errors
            .map((e) => `${e.file}${e.line ? `:${e.line}` : ""} — ${e.message}`)
            .join("\n");

          enqueue({
            type: "step",
            step: `Pass ${i + 1}: Found ${errors.length} error(s)`,
            status: "done",
            detail: errorDetail,
          });

          if (i === clampedMax - 1) {
            // Last iteration — no more fixes
            finalFiles = currentFiles;
            break;
          }

          enqueue({
            type: "step",
            step: `Iteration ${i + 1}/${clampedMax}: Fixing ${errors.length} error(s)…`,
            status: "running",
          });

          // Build the fix prompt
          const fileContext = currentFiles
            .map((f) => `// ${f.path}\n${f.content}`)
            .join("\n\n---\n\n");

          const fixPrompt = prompt
            ? `Original request: ${prompt}\n\nProject files:\n${fileContext}\n\nErrors to fix:\n${errorDetail}`
            : `Project files:\n${fileContext}\n\nErrors to fix:\n${errorDetail}`;

          let rawResponse = "";
          try {
            const completion = await getClient().chat.completions.create({
              model: "gpt-4o",
              temperature: 0.1,
              max_tokens: 16000,
              messages: [
                { role: "system", content: FIX_SYSTEM_PROMPT },
                { role: "user", content: fixPrompt },
              ],
            });
            rawResponse = completion.choices?.[0]?.message?.content ?? "";
          } catch (apiErr: unknown) {
            const message =
              apiErr instanceof Error ? apiErr.message : "OpenAI API error";
            enqueue({ type: "error", message });
            controller.close();
            return;
          }

          // Parse fixed files
          let fixedFiles: FixedFile[] = [];
          try {
            const cleaned = stripMarkdownFences(rawResponse);
            let parsed: unknown;
            try {
              parsed = JSON.parse(cleaned);
            } catch {
              const match = cleaned.match(/\{[\s\S]*\}/);
              if (match) parsed = JSON.parse(match[0]);
            }

            if (
              parsed &&
              typeof parsed === "object" &&
              "files" in parsed &&
              Array.isArray((parsed as Record<string, unknown>).files)
            ) {
              fixedFiles = (
                (parsed as { files: unknown[] }).files as unknown[]
              ).filter(
                (f): f is FixedFile =>
                  f !== null &&
                  typeof f === "object" &&
                  typeof (f as Record<string, unknown>).path === "string" &&
                  typeof (f as Record<string, unknown>).content === "string"
              ) as FixedFile[];
            }
          } catch {
            // Could not parse fix response — skip this iteration
          }

          if (fixedFiles.length > 0) {
            // Merge fixes back into current files
            const fileMap = new Map(currentFiles.map((f) => [f.path, f.content]));
            for (const fix of fixedFiles) {
              if (fix.action === "delete") {
                fileMap.delete(fix.path);
              } else {
                fileMap.set(fix.path, fix.content);
              }
            }
            currentFiles = Array.from(fileMap.entries()).map(([path, content]) => ({
              path,
              content,
            }));

            enqueue({
              type: "fix",
              iteration: i + 1,
              files: fixedFiles,
            });

            enqueue({
              type: "step",
              step: `Iteration ${i + 1}/${clampedMax}: Fixed ${fixedFiles.length} file(s)`,
              status: "done",
              detail: `Applied fixes to: ${fixedFiles.map((f) => f.path).join(", ")}`,
            });
          } else {
            enqueue({
              type: "step",
              step: `Iteration ${i + 1}/${clampedMax}: No files changed`,
              status: "done",
            });
            finalFiles = currentFiles;
            break;
          }
        }

        // Final validation pass
        const finalValidation = validateFiles(finalFiles);
        const finalErrors = finalValidation.issues.filter(
          (issue) => issue.type === "error"
        );
        lastValid = finalErrors.length === 0;

        enqueue({
          type: "complete",
          files: finalFiles,
          iterations: iterationCount,
          valid: lastValid,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unexpected server error";
        enqueue({ type: "error", message });
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
