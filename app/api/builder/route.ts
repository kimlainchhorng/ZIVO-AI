import OpenAI from "openai";
import { NextResponse } from "next/server";

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
  files: GeneratedFile[];
  summary: string;
}

const SYSTEM_PROMPT = `You are an expert full-stack developer AI assistant. Your task is to generate complete, production-ready code files.

You are proficient in: TypeScript, JavaScript, Python, SQL, PL/pgSQL, HTML, CSS, JSON, YAML, Markdown, Bash, Dockerfile, GraphQL, WebAssembly, Rust, Go, OpenAPI, ProtoBuf.
Architectures: CI/CD, REST API, WebSocket, Serverless, Microservices, full-stack web, mobile backends, real-time, cloud deployment.
UI Libraries: ShadCN UI, Radix UI, Material UI, Chakra UI (buttons, modals, forms, dashboards, navbars).
Layout: Flexbox, CSS Grid, responsive/mobile-first design.
Design: colors, spacing, typography, shadows, border-radius design tokens.
UX Patterns: Dashboard, Sidebar nav, Card layouts, Search bars, Forms, Responsive layouts.
Mobile: Flutter/Dart, Kotlin (Android), Swift (iOS), React Native.
Animation: Framer Motion, Lottie, CSS animations.

When given a description, respond ONLY with a valid JSON object matching this exact schema:
{
  "files": [
    {
      "path": "relative/file/path.ts",
      "action": "create" | "update" | "delete",
      "content": "complete file content as a string",
      "language": "typescript" | "javascript" | "css" | "json" | "sql" | "markdown" | "python" | "bash" | "dockerfile" | "graphql" | "go" | "rust"
    }
  ],
  "summary": "brief description of what was generated"
}

Rules:
- Return ONLY the JSON object, no markdown fences, no extra text.
- Generate minimal working code that follows Next.js App Router best practices.
- Include proper TypeScript types.
- Organize imports alphabetically.
- Add concise comments only where needed.
- File paths should be relative to the project root (e.g. "app/page.tsx").
- For delete actions, content should be an empty string.`;

const PLAN_SYSTEM_PROMPT = `You are an expert full-stack developer AI assistant. The user wants a project plan, not code yet.

When given an app description, respond ONLY with a valid JSON object matching this exact schema:
{
  "plan": "markdown string with the build plan"
}

The markdown plan should include:
- **Pages to build** (list each page and its purpose)
- **Key components** (reusable UI components needed)
- **Data flow** (state management, API routes, data models)
- **Estimated complexity** (Low / Medium / High with brief reason)

Return ONLY the JSON object, no markdown fences, no extra text.`;

function stripMarkdownFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

function parseBuilderJSON<T>(text: string): T {
  const clean = stripMarkdownFences(text);
  try {
    return JSON.parse(clean) as T;
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as T;
    throw new Error("AI did not return valid JSON");
  }
}

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

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Missing or invalid prompt" }, { status: 400 });
    }

    if (planOnly) {
      const r = await getClient().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: PLAN_SYSTEM_PROMPT },
          { role: "user", content: prompt.trim() },
        ],
        temperature: 0.3,
      });
      const text: string = r.choices[0]?.message?.content ?? "";
      let parsed: { plan: string };
      try {
        parsed = parseBuilderJSON<{ plan: string }>(text);
      } catch {
        return NextResponse.json({ error: "AI did not return valid JSON", raw: text }, { status: 502 });
      }
      if (typeof parsed.plan !== "string") {
        return NextResponse.json({ error: "Invalid plan response structure" }, { status: 502 });
      }
      return NextResponse.json(parsed);
    }

    const r = await getClient().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt.trim() },
      ],
      temperature: 0.2,
    });

    const text: string = r.choices[0]?.message?.content ?? "";

    let parsed: BuilderResponse;
    try {
      parsed = parseBuilderJSON<BuilderResponse>(text);
    } catch {
      return NextResponse.json(
        { error: "AI did not return valid JSON", raw: text },
        { status: 502 }
      );
    }

    if (!Array.isArray(parsed.files)) {
      return NextResponse.json(
        { error: "Invalid response structure: missing files array" },
        { status: 502 }
      );
    }

    const validActions: FileAction[] = ["create", "update", "delete"];
    for (const file of parsed.files) {
      if (!file.path || typeof file.path !== "string") {
        return NextResponse.json({ error: "File missing path" }, { status: 502 });
      }
      if (!validActions.includes(file.action)) {
        return NextResponse.json(
          { error: `Invalid file action: ${file.action}` },
          { status: 502 }
        );
      }
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error)?.message || "Server error" }, { status: 500 });
  }
}
