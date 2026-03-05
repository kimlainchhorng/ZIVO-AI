// app/api/app-blueprint/route.ts — App blueprint generator endpoint

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { parseIntent, type ParsedIntent } from "@/lib/intent-parser";

export const runtime = "nodejs";

export interface BlueprintPage {
  path: string;
  name: string;
  description: string;
}

export interface BlueprintComponent {
  name: string;
  path: string;
  description: string;
}

export interface BlueprintColumn {
  name: string;
  type: string;
}

export interface BlueprintTable {
  table: string;
  columns: BlueprintColumn[];
}

export interface BlueprintApiRoute {
  path: string;
  methods: string[];
  description: string;
}

export interface AppBlueprint {
  intent: ParsedIntent;
  framework: string;
  pages: BlueprintPage[];
  components: BlueprintComponent[];
  database: BlueprintTable[];
  apiRoutes: BlueprintApiRoute[];
  authStrategy: string;
  deployTarget: string;
  estimatedFiles: number;
}

const BLUEPRINT_SYSTEM_PROMPT = `You are a senior software architect. Given a parsed application intent, produce a full project blueprint.

Return ONLY a valid JSON object (no markdown fences):
{
  "pages": [{ "path": "/dashboard", "name": "Dashboard", "description": "Main analytics view" }],
  "components": [{ "name": "StatsCard", "path": "components/StatsCard.tsx", "description": "Displays a KPI metric" }],
  "database": [{ "table": "users", "columns": [{ "name": "id", "type": "uuid" }, { "name": "email", "type": "text" }] }],
  "apiRoutes": [{ "path": "/api/users", "methods": ["GET", "POST"], "description": "User CRUD endpoints" }],
  "authStrategy": "Supabase Auth with email/password",
  "deployTarget": "Vercel",
  "estimatedFiles": 18
}`;

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

interface BlueprintAiResponse {
  pages?: BlueprintPage[];
  components?: BlueprintComponent[];
  database?: BlueprintTable[];
  apiRoutes?: BlueprintApiRoute[];
  authStrategy?: string;
  deployTarget?: string;
  estimatedFiles?: number;
}

export async function POST(req: Request): Promise<Response> {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { prompt } = body as { prompt?: string };
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  try {
    // Parse intent first
    const intent = await parseIntent(prompt.trim());

    // Generate full blueprint from intent
    const client = getClient();
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
      max_tokens: 2048,
      messages: [
        { role: "system", content: BLUEPRINT_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Generate a full blueprint for this application:\n\nApp Type: ${intent.appType}\nPages: ${intent.pages.join(", ")}\nComponents: ${intent.components.join(", ")}\nDatabase Tables: ${intent.database.join(", ")}\nFeatures: ${intent.features.join(", ")}\nTheme: ${intent.designTheme}\nFramework: ${intent.framework}\n\nOriginal prompt: ${prompt}`,
        },
      ],
    });

    const rawText = response.choices?.[0]?.message?.content ?? "";
    let aiData: BlueprintAiResponse = {};
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      aiData = JSON.parse(jsonMatch ? jsonMatch[0] : rawText) as BlueprintAiResponse;
    } catch {
      // Use intent data as fallback
    }

    const blueprint: AppBlueprint = {
      intent,
      framework: "Next.js",
      pages: aiData.pages ?? intent.pages.map((p) => ({
        path: p,
        name: p === "/" ? "Home" : p.replace("/", "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        description: `Page at ${p}`,
      })),
      components: aiData.components ?? intent.components.map((c) => ({
        name: c,
        path: `components/${c}.tsx`,
        description: `${c} component`,
      })),
      database: aiData.database ?? intent.database.map((t) => ({
        table: t,
        columns: [{ name: "id", type: "uuid" }, { name: "created_at", type: "timestamptz" }],
      })),
      apiRoutes: aiData.apiRoutes ?? [],
      authStrategy: aiData.authStrategy ?? (intent.features.includes("auth") ? "Supabase Auth" : "None"),
      deployTarget: aiData.deployTarget ?? "Vercel",
      estimatedFiles: aiData.estimatedFiles ?? (intent.pages.length * 2 + intent.components.length + 5),
    };

    return NextResponse.json(blueprint);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message ?? "Failed to generate blueprint" },
      { status: 500 }
    );
  }
}
