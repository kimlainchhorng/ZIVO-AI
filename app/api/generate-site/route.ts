import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export type FileAction = "create" | "update" | "delete";

export interface GeneratedFile {
  path: string;
  content: string;
  action: FileAction;
}

export interface GenerateSiteResponse {
  files: GeneratedFile[];
  preview_html?: string;
  summary?: string;
  notes?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

type GenerateMode = "standard" | "advanced" | "minimal";

const BASE_RULES = `
Rules:
- ALWAYS include a \`preview_html\` field: a single complete self-contained HTML file with ALL CSS inline in <style> tags and ALL JS inline in <script> tags. No external CDN links that might fail.
- Each file in \`files\` must have a \`path\`, \`content\`, and \`action\` ("create" | "update" | "delete").
- Make the UI beautiful: use modern CSS, gradients, good typography, proper spacing.
- The HTML preview should look like a real polished app, not a demo.
- Return ONLY valid JSON, no markdown fences, no explanation text.`;

const SYSTEM_PROMPT_STANDARD = `You are ZIVO AI — an expert full-stack developer that generates complete, working web applications.

When given a description, respond with a valid JSON object:
{
  "files": [
    {
      "path": "index.html",
      "content": "<!DOCTYPE html>...(complete, self-contained HTML with inline CSS and JS)...",
      "action": "create"
    }
  ],
  "preview_html": "<!DOCTYPE html>...(single self-contained HTML file for live preview)...",
  "summary": "Brief description of what was built",
  "notes": "Any additional notes"
}
${BASE_RULES}`;

const SYSTEM_PROMPT_ADVANCED = `You are ZIVO AI — an expert full-stack developer that generates complete Next.js App Router projects.

You are an expert in:
- TypeScript, JavaScript, Python, SQL, HTML, CSS, JSON, YAML, Markdown, GraphQL
- Next.js 14 App Router, React, TailwindCSS, ShadCN UI, Radix UI, Framer Motion
- Responsive design (mobile-first), SEO metadata, accessibility
- REST APIs, GraphQL, WebSocket, Serverless, Microservices
- CI/CD, Docker, database schemas (PostgreSQL, Prisma, Supabase)

When given a description, respond with a valid JSON object containing a FULL Next.js project structure:
{
  "files": [
    { "path": "package.json", "content": "...", "action": "create" },
    { "path": "README.md", "content": "...", "action": "create" },
    { "path": "app/layout.tsx", "content": "...", "action": "create" },
    { "path": "app/page.tsx", "content": "...", "action": "create" },
    { "path": "app/about/page.tsx", "content": "...", "action": "create" },
    { "path": "app/contact/page.tsx", "content": "...", "action": "create" },
    { "path": "app/globals.css", "content": "...", "action": "create" },
    { "path": "components/Navbar.tsx", "content": "...", "action": "create" },
    { "path": "components/Footer.tsx", "content": "...", "action": "create" },
    { "path": "tailwind.config.ts", "content": "...", "action": "create" }
  ],
  "preview_html": "<!DOCTYPE html>...(single self-contained HTML file for live preview)...",
  "summary": "Brief description of what was built",
  "notes": "Any additional notes"
}

Include: package.json (with next, react, tailwindcss, framer-motion), app/layout.tsx, app/page.tsx with hero/features/CTA sections, app/about/page.tsx, app/contact/page.tsx with contact form, components/Navbar.tsx with responsive mobile menu, components/Footer.tsx, and tailwind.config.ts with design tokens.
Each page should use Framer Motion for animations and be fully responsive.
${BASE_RULES}`;

const SYSTEM_PROMPT_MINIMAL = `You are ZIVO AI — an expert web developer that generates minimal, self-contained HTML files.

When given a description, respond with a valid JSON object containing a SINGLE HTML file:
{
  "files": [
    {
      "path": "index.html",
      "content": "<!DOCTYPE html>...(complete, self-contained HTML with ALL CSS and JS inline)...",
      "action": "create"
    }
  ],
  "preview_html": "<!DOCTYPE html>...(same as the single HTML file)...",
  "summary": "Brief description of what was built",
  "notes": "Any additional notes"
}
${BASE_RULES}`;

const TYPE_CHECK_PROMPT = `You are a TypeScript expert. Review the following generated files for TypeScript type errors or obvious bugs.
If there are errors, return a corrected JSON object using the same schema (files, preview_html, summary, notes).
If there are no errors, return the original JSON unchanged.
Return ONLY valid JSON, no markdown, no explanation.`;

function getSystemPrompt(mode: GenerateMode): string {
  if (mode === "advanced") return SYSTEM_PROMPT_ADVANCED;
  if (mode === "minimal") return SYSTEM_PROMPT_MINIMAL;
  return SYSTEM_PROMPT_STANDARD;
}

async function generateFiles(
  prompt: string,
  mode: GenerateMode,
  context: ChatMessage[]
): Promise<GenerateSiteResponse> {
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: getSystemPrompt(mode) },
  ];

  // Inject prior context for multi-turn building
  for (const m of context) {
    messages.push({ role: m.role, content: m.content });
  }

  messages.push({ role: "user", content: prompt });

  const response = await getClient().chat.completions.create({
    model: "gpt-4o",
    temperature: Number(process.env.OPENAI_TEMPERATURE ?? "0.4"),
    max_tokens: mode === "advanced" ? 8000 : 4000,
    messages,
  });

  const text = response.choices?.[0]?.message?.content || "{}";
  return parseJSON(text);
}

function parseJSON(text: string): GenerateSiteResponse {
  const cleaned = text
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("AI did not return valid JSON");
  }
}

async function selfCorrect(
  parsed: GenerateSiteResponse,
  maxRetries: number = 2
): Promise<GenerateSiteResponse> {
  let current = parsed;
  let retries = 0;

  while (retries < maxRetries) {
    const checkResponse = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      max_tokens: 4000,
      messages: [
        { role: "system", content: TYPE_CHECK_PROMPT },
        { role: "user", content: JSON.stringify(current) },
      ],
    });

    const correctedText = checkResponse.choices?.[0]?.message?.content || "{}";
    let corrected: GenerateSiteResponse;
    try {
      corrected = parseJSON(correctedText);
    } catch {
      break;
    }

    const unchanged =
      corrected.files?.length === current.files?.length &&
      (corrected.files ?? []).every((f, i) => f.content === (current.files ?? [])[i]?.content);

    if (unchanged) break;

    current = corrected;
    retries++;
  }

  return current;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt: string = body?.prompt || "";
    const mode: GenerateMode = ["standard", "advanced", "minimal"].includes(body?.mode)
      ? (body.mode as GenerateMode)
      : "standard";
    const context: ChatMessage[] = Array.isArray(body?.context)
      ? (body.context as Array<{ role: string; content: string }>)
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))
      : [];

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in .env.local" },
        { status: 500 }
      );
    }

    if (!prompt.trim()) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    let parsed: GenerateSiteResponse;
    try {
      parsed = await generateFiles(prompt, mode, context);
    } catch {
      return NextResponse.json({ error: "Invalid JSON from AI" }, { status: 500 });
    }

    if (!Array.isArray(parsed.files)) {
      parsed.files = [];
    }

    // Self-correction loop (max 2 retries)
    const corrected = await selfCorrect(parsed);

    return NextResponse.json(corrected);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
