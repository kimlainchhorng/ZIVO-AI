import OpenAI from "openai";
import { NextResponse } from "next/server";
import { CODE_BUILDER_SYSTEM_PROMPT, CODE_BUILDER_PLAN_PROMPT } from "../../../prompts/code-builder";
import { stripMarkdownFences } from "../../../lib/code-parser";
import { buildProjectContext } from "../../../lib/prompt-builder";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export type FileAction = "create" | "update" | "delete";

export interface GeneratedFile {
  path: string;
  action: FileAction;
  content: string;
  language: string;
}

export interface BuilderResponse {
  thinking?: string;
  files: GeneratedFile[];
  commands?: string[];
  summary: string;
  preview_html?: string;
}

function parseBuilderJSON(text: string): BuilderResponse {
  const cleaned = stripMarkdownFences(text);
  try {
    return JSON.parse(cleaned);
  } catch (parseErr) {
    console.error("[builder] Initial JSON parse failed:", parseErr);
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("AI did not return valid JSON");
  }
}


const _SYSTEM_PROMPT = `You are ZIVO AI, an expert software engineer and architect. You can build:
- Full-stack web applications (Next.js, React, Vue, Express, FastAPI)
- Mobile app backends (REST APIs, GraphQL, WebSocket)
- Cloud-native microservices
- CI/CD pipelines (GitHub Actions, Docker)
- Database schemas (PostgreSQL, Prisma, Supabase)
- Real-time features (WebSocket, SSE, Supabase Realtime)
- Serverless functions (Vercel, AWS Lambda)
- REST APIs, GraphQL APIs, WebSocket servers
- Dockerfile + docker-compose.yml configurations
- Complete UI with TypeScript + React + Next.js + TailwindCSS + ShadCN UI + Framer Motion

When given a description, respond ONLY with a valid JSON object matching this exact schema:
{
  "files": [
    {
      "path": "relative/file/path.ts",
      "action": "create" | "update" | "delete",
      "content": "complete file content as a string",
      "language": "typescript" | "javascript" | "python" | "bash" | "css" | "json" | "sql" | "markdown" | "graphql" | "yaml" | "dockerfile" | "go" | "rust"
    }
  ],
  "commands": ["npm install", "npm run dev"],
  "summary": "brief description of what was generated"
}

Rules:
- Return ONLY the JSON object, no markdown fences, no extra text.
- Generate complete, working code that follows Next.js App Router best practices.
- Include proper TypeScript types.
- Organize imports alphabetically.
- Add concise comments only where needed.
- File paths should be relative to the project root (e.g. "app/page.tsx").
- For delete actions, content should be an empty string.
- Use TailwindCSS for styling, Framer Motion for animations when relevant.
- Include package.json with all necessary dependencies when generating a full project.`;

const _PLAN_SYSTEM_PROMPT = `You are an expert full-stack developer AI assistant. The user wants a project plan, not code yet.

When given an app description, respond ONLY with a valid JSON object matching this exact schema:
{
  "plan": "markdown string with the build plan"
}`;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY in environment" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const prompt = body?.prompt;
    const planOnly = Boolean(body?.planOnly);
    const stream = Boolean(body?.stream);
    const selectedModel: string = typeof body?.model === "string" ? body.model : "gpt-4o";
    const existingFiles: Array<{ path: string; content: string }> = Array.isArray(body?.existingFiles)
      ? body.existingFiles
      : [];
    const generatePreview = Boolean(body?.generatePreview);

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Missing or invalid prompt" }, { status: 400 });
    }

    // Build user message — prepend existing file context if provided
    const projectContext = existingFiles.length > 0
      ? buildProjectContext(existingFiles) + "\n\n"
      : "";
    const userMessage = `${projectContext}${prompt.trim()}`;

    if (planOnly) {
      const r = await getClient().chat.completions.create({
        model: selectedModel,
        messages: [
          { role: "system", content: CODE_BUILDER_PLAN_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      });
      const text: string = r.choices[0]?.message?.content ?? "";
      let parsed: { plan: string };
      try {
        parsed = parseBuilderJSON(text) as unknown as { plan: string };
      } catch {
        return NextResponse.json({ error: "AI did not return valid JSON", raw: text }, { status: 502 });
      }
      if (typeof parsed.plan !== "string") {
        return NextResponse.json({ error: "AI plan response missing 'plan' field", raw: text }, { status: 502 });
      }
      return NextResponse.json({ plan: parsed.plan });
    }

    // ── Streaming mode ────────────────────────────────────────────────────────
    if (stream) {
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            const streamCompletion = await getClient().chat.completions.create({
              model: selectedModel,
              messages: [
                { role: "system", content: CODE_BUILDER_SYSTEM_PROMPT },
                { role: "user", content: userMessage },
              ],
              temperature: 0.2,
              max_tokens: 32000,
              stream: true,
            });

            for await (const chunk of streamCompletion) {
              const delta = chunk.choices[0]?.delta?.content ?? "";
              if (delta) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: delta })}\n\n`));
              }
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Stream error";
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`));
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // ── Non-streaming mode with retry ─────────────────────────────────────────
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const r = await getClient().chat.completions.create({
          model: selectedModel,
          messages: [
            { role: "system", content: CODE_BUILDER_SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
          temperature: 0.2,
          max_tokens: 32000,
        });
        const text = r.choices[0]?.message?.content ?? "";
        const parsed = parseBuilderJSON(text);
        if (!Array.isArray(parsed.files) || parsed.files.length === 0) {
          throw new Error("AI returned no files");
        }

        // ── Optional preview HTML generation ──────────────────────────────────
        if (generatePreview) {
          try {
            const previewPrompt = `Given these generated files, create a single self-contained HTML preview page that visually demonstrates the UI/UX of this project. Include all CSS inline and use placeholder data. Output ONLY the raw HTML starting with <!DOCTYPE html>.

Files summary:
${parsed.files.map((f) => `${f.path} (${f.language})`).join("\n")}

Project summary: ${parsed.summary}`;

            const previewR = await getClient().chat.completions.create({
              model: "gpt-4o",
              messages: [
                { role: "system", content: "You are a UI developer. Generate a self-contained HTML preview." },
                { role: "user", content: previewPrompt },
              ],
              temperature: 0.4,
              max_tokens: 8000,
            });
            let previewHtml = previewR.choices[0]?.message?.content ?? "";
            previewHtml = previewHtml.replace(/^```(?:html)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
            if (previewHtml.includes("<!DOCTYPE") || previewHtml.includes("<html")) {
              parsed.preview_html = previewHtml;
            }
          } catch (previewErr) {
            console.warn("[builder] Preview generation failed:", previewErr);
            // Non-fatal: return without preview
          }
        }

        return NextResponse.json(parsed);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(`[builder] Attempt ${attempt} failed:`, lastError.message);
        if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
    return NextResponse.json(
      { error: lastError?.message ?? "Failed after 3 attempts" },
      { status: 502 }
    );
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error)?.message || "Server error" }, { status: 500 });
  }
}
