import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface MicrofrontendFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateMicrofrontendRequest {
  appName?: string;
  features?: string[];
  framework?: "next" | "react" | "vue";
}

export interface GenerateMicrofrontendResponse {
  files: MicrofrontendFile[];
  summary: string;
  setupInstructions: string;
  apps: string[];
}

const MICROFRONTEND_SYSTEM_PROMPT = `You are ZIVO AI — an expert in micro-frontend architecture.

Generate a complete micro-frontend setup using Webpack 5 Module Federation for a Next.js project.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "setupInstructions": "Step-by-step setup instructions",
  "apps": ["shell", "feature-app-1"]
}

Include:
- Shell app configuration with Module Federation
- Feature app configurations
- Shared dependencies setup
- Inter-app communication (custom events)
- Independent deployment configs

Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const body = await req.json() as GenerateMicrofrontendRequest;
    const {
      appName = "My App",
      features = ["auth", "dashboard", "settings"],
      framework = "next",
    } = body;

    const userPrompt = `Generate micro-frontend architecture for "${appName}".
Framework: ${framework}
Feature apps: ${features.join(", ")}

Use Webpack 5 Module Federation with shell app + feature apps pattern.`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 8192,
      messages: [
        { role: "system", content: MICROFRONTEND_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateMicrofrontendResponse;
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
