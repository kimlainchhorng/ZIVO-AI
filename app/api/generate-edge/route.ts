import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface EdgeFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateEdgeRequest {
  appName?: string;
  platform?: "cloudflare" | "deno" | "vercel-edge" | "all";
  description?: string;
}

export interface GenerateEdgeResponse {
  files: EdgeFile[];
  summary: string;
  setupInstructions: string;
  deployCommands: string[];
}

const EDGE_SYSTEM_PROMPT = `You are ZIVO AI — an expert in edge deployment architecture.

Generate edge deployment configuration files for a Next.js application.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "setupInstructions": "Step-by-step setup",
  "deployCommands": ["wrangler deploy", "deno deploy"]
}

For Cloudflare Workers: include wrangler.toml and worker script.
For Deno Deploy: include deno.json.
For Vercel Edge: convert API routes to edge runtime with export const runtime = 'edge'.

Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const body = await req.json() as GenerateEdgeRequest;
    const {
      appName = "My App",
      platform = "vercel-edge",
      description = "Next.js web application",
    } = body;

    const userPrompt = `Generate edge deployment config for "${appName}".
Platform: ${platform}
Description: ${description}

Include all configuration files and deployment scripts needed.`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 4096,
      messages: [
        { role: "system", content: EDGE_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateEdgeResponse;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json(
          { error: "AI did not return valid JSON" },
          { status: 502 }
        );
      }
      parsed = JSON.parse(match[0]);
    }

    if (!Array.isArray(parsed.files)) {
      return NextResponse.json(
        { error: "Invalid response structure: missing files array" },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
