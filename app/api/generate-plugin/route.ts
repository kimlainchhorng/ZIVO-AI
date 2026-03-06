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

export interface GeneratePluginRequest {
  plugin: string;
  appName?: string;
}

export interface GeneratePluginResponse {
  files: GeneratedFile[];
  summary: string;
  setupInstructions: string;
  requiredEnvVars: string[];
}

const PLUGIN_SYSTEM_PROMPT = `You are ZIVO AI — an expert in third-party integrations for Next.js 15 applications.

Generate complete integration boilerplate for the requested plugin/service.

Always generate ALL of these:
1. lib/integrations/[plugin].ts — Client setup + typed helper functions
2. components/examples/[Plugin]Example.tsx — Usage example React component

Supported plugins: Stripe, Supabase, Firebase, Mapbox, Resend, OpenAI, Clerk, Prisma, Pusher, Twilio, AWS S3, Cloudinary

Rules:
- Use TypeScript with strict types
- Client setup must use environment variables via process.env (never hardcoded)
- Helper functions must be async with proper error handling
- Example component must be a working 'use client' React component
- Include JSDoc comments on all exported functions
- No console.log in production code

Respond ONLY with a valid JSON object (no markdown fences):
{
  "files": [
    { "path": "lib/integrations/[plugin].ts", "content": "...", "action": "create" },
    { "path": "components/examples/[Plugin]Example.tsx", "content": "...", "action": "create" }
  ],
  "summary": "Brief description of what was generated",
  "setupInstructions": "Step-by-step setup guide including npm install commands",
  "requiredEnvVars": ["PLUGIN_API_KEY=your_key_here"]
}`;

function stripFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const plugin: string = body?.plugin || "";
    const appName: string = body?.appName || "MyApp";

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is missing" }, { status: 500 });
    }
    if (!plugin.trim()) {
      return NextResponse.json({ error: "Missing plugin name" }, { status: 400 });
    }

    const userMessage = `Generate integration boilerplate for: ${plugin}
App name: ${appName}

Include client setup, helper functions, and a usage example component.`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 8000,
      messages: [
        { role: "system", content: PLUGIN_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    });

    const text = response.choices?.[0]?.message?.content || "{}";
    const clean = stripFences(text);

    let parsed: GeneratePluginResponse;
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
    if (!parsed.summary) parsed.summary = `${plugin} integration generated`;
    if (!parsed.setupInstructions) parsed.setupInstructions = "";
    if (!Array.isArray(parsed.requiredEnvVars)) parsed.requiredEnvVars = [];

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
