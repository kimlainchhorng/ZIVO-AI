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

export interface GenerateLogicRequest {
  appName: string;
  domain: string;
  actions: string[];
}

export interface GenerateLogicResponse {
  files: GeneratedFile[];
  summary: string;
  setupInstructions: string;
}

const LOGIC_SYSTEM_PROMPT = `You are ZIVO AI — an expert Next.js 15 App Router developer specializing in server-side logic, Server Actions, and API routes.

Generate production-ready server-side logic for a Next.js 15 application.

Always generate ALL of these:
1. app/actions/[domain].ts — Next.js Server Actions with 'use server' directive
2. app/api/[domain]/route.ts — REST API endpoints (GET, POST, PUT, DELETE handlers)
3. lib/[domain]/queries.ts — Type-safe database query functions
4. TypeScript interfaces for all domain entities

Rules:
- Use 'use server' at top of Server Actions file
- Server Actions must use proper TypeScript types
- API routes must use NextResponse.json() and handle errors gracefully
- Export const runtime = "nodejs" in API routes
- Query functions should be async and return typed results
- Include JSDoc comments for public functions
- No console.log in production code

Respond ONLY with a valid JSON object (no markdown fences):
{
  "files": [
    { "path": "app/actions/[domain].ts", "content": "...", "action": "create" },
    { "path": "app/api/[domain]/route.ts", "content": "...", "action": "create" },
    { "path": "lib/[domain]/queries.ts", "content": "...", "action": "create" },
    { "path": "types/[domain].ts", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "setupInstructions": "Step-by-step setup guide"
}`;

function stripFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const appName: string = body?.appName || "MyApp";
    const domain: string = body?.domain || "";
    const actions: string[] = Array.isArray(body?.actions) ? body.actions : [];

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is missing" }, { status: 500 });
    }
    if (!domain.trim()) {
      return NextResponse.json({ error: "Missing domain" }, { status: 400 });
    }

    const userMessage = `App: ${appName}
Domain: ${domain}
Actions to implement: ${actions.join(", ")}

Generate all Server Actions, API routes, and query functions for this domain.`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 12000,
      messages: [
        { role: "system", content: LOGIC_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    });

    const text = response.choices?.[0]?.message?.content || "{}";
    const clean = stripFences(text);

    let parsed: GenerateLogicResponse;
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
    if (!parsed.summary) parsed.summary = `Logic layer generated for ${domain}`;
    if (!parsed.setupInstructions) parsed.setupInstructions = "";

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
