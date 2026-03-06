import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface GeneratedFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateMultipageRequest {
  prompt: string;
  pages?: string[];
}

export interface GenerateMultipageResponse {
  files: GeneratedFile[];
  summary: string;
  routeMap: Record<string, string>;
}

const DEFAULT_PAGES = [
  "app/page.tsx",
  "app/dashboard/page.tsx",
  "app/login/page.tsx",
  "app/signup/page.tsx",
  "app/settings/page.tsx",
  "app/layout.tsx",
];

const MULTIPAGE_SYSTEM_PROMPT = `You are ZIVO AI — an expert Next.js 15 App Router developer building full multi-page applications.

Generate a complete multi-page Next.js 15 App Router application.

Rules:
- Always output ALL pages listed in the request (default: Landing, Dashboard, Login, Signup, Settings, Layout).
- Use 'use client' directive ONLY on components that use React hooks or browser APIs. Server components should NOT have 'use client'.
- Link between pages using Next.js <Link href="..."> from 'next/link'.
- Every page must have proper TypeScript types.
- Use Tailwind CSS for styling with a dark theme.
- The app/layout.tsx must wrap children with a proper <html><body> structure.
- Include a shared NavBar component used across all pages.
- Each page must be a complete, working component with real content.

Respond ONLY with a valid JSON object (no markdown fences):
{
  "files": [
    { "path": "app/page.tsx", "content": "...", "action": "create" },
    { "path": "app/dashboard/page.tsx", "content": "...", "action": "create" },
    { "path": "app/login/page.tsx", "content": "...", "action": "create" },
    { "path": "app/signup/page.tsx", "content": "...", "action": "create" },
    { "path": "app/settings/page.tsx", "content": "...", "action": "create" },
    { "path": "app/layout.tsx", "content": "...", "action": "create" },
    { "path": "components/NavBar.tsx", "content": "...", "action": "create" }
  ],
  "summary": "Brief description of what was built",
  "routeMap": {
    "/": "app/page.tsx",
    "/dashboard": "app/dashboard/page.tsx",
    "/login": "app/login/page.tsx",
    "/signup": "app/signup/page.tsx",
    "/settings": "app/settings/page.tsx"
  }
}`;

function stripFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt: string = body?.prompt || "";
    const pages: string[] = Array.isArray(body?.pages) ? body.pages : DEFAULT_PAGES;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is missing" }, { status: 500 });
    }
    if (!prompt.trim()) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const pageList = pages.join(", ");
    const userMessage = `${prompt}\n\nGenerate these pages: ${pageList}`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
      max_tokens: 16000,
      messages: [
        { role: "system", content: MULTIPAGE_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    });

    const text = response.choices?.[0]?.message?.content || "{}";
    const clean = stripFences(text);

    let parsed: GenerateMultipageResponse;
    try {
      parsed = JSON.parse(clean);
    } catch {
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        return NextResponse.json({ error: "Invalid JSON from AI" }, { status: 500 });
      }
    }

    if (!Array.isArray(parsed.files)) parsed.files = [];
    if (!parsed.routeMap) parsed.routeMap = {};
    if (!parsed.summary) parsed.summary = "Multi-page app generated";

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
