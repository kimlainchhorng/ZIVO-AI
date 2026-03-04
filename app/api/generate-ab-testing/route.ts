import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface ABTestingFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateABTestingRequest {
  appName?: string;
  flagProvider?: "vercel" | "launchdarkly" | "statsig" | "custom";
  flags?: string[];
  experiments?: string[];
}

export interface GenerateABTestingResponse {
  files: ABTestingFile[];
  summary: string;
  setupInstructions: string;
  requiredEnvVars: string[];
}

const AB_TESTING_SYSTEM_PROMPT = `You are ZIVO AI — an expert in feature flags and A/B testing.

Generate a complete A/B testing and feature flag system for a Next.js App Router project.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "setupInstructions": "Step-by-step setup",
  "requiredEnvVars": []
}

Always include:
- lib/flags/feature-flags.ts — Flag definitions and defaults
- hooks/useFeatureFlag.ts — React hook for flag checks
- hooks/useVariant.ts — A/B variant assignment hook
- components/ABTest.tsx — Component for rendering variants
- app/admin/flags/page.tsx — Admin panel for flag management

Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const body = await req.json() as GenerateABTestingRequest;
    const {
      appName = "My App",
      flagProvider = "custom",
      flags = ["new-onboarding", "dark-mode-v2", "pricing-v2"],
      experiments = ["homepage-hero", "cta-button-color"],
    } = body;

    const userPrompt = `Generate A/B testing and feature flag infrastructure for "${appName}".
Flag provider: ${flagProvider}
Feature flags: ${flags.join(", ")}
A/B experiments: ${experiments.join(", ")}

Include flag definitions, hooks, admin panel, and variant assignment logic.`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 8192,
      messages: [
        { role: "system", content: AB_TESTING_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateABTestingResponse;
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
