import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface SchemaFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateSchemaRequest {
  description: string;
  orm?: "prisma" | "drizzle";
  includeSupabase?: boolean;
}

export interface GenerateSchemaResponse {
  files: SchemaFile[];
  models: string[];
  summary: string;
}

const SCHEMA_SYSTEM_PROMPT = `You are ZIVO AI — an expert database architect and full-stack developer.

Generate a complete database schema from a natural language description, including Prisma schema,
Supabase SQL migrations, TypeScript types, CRUD API routes, and Zod validation schemas.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "models": ["ModelName1", "ModelName2"],
  "summary": "Brief description of what was generated"
}

Always include:
- prisma/schema.prisma — Complete Prisma schema with all models
- supabase/migrations/001_initial.sql — Initial Supabase SQL migration
- types/database.ts — Auto-generated TypeScript types
- lib/validations.ts — Zod validation schemas for all models
- app/api/[model]/route.ts — CRUD API routes for each model

Use best practices: proper relations, indexes, timestamps, soft deletes where appropriate.
Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const {
      description,
      orm = "prisma",
      includeSupabase = true,
    }: GenerateSchemaRequest = body;

    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json(
        { error: "Missing or invalid description" },
        { status: 400 }
      );
    }

    const userPrompt = `Generate a complete database schema for the following app:

"${description.trim()}"

ORM: ${orm}
Include Supabase migrations: ${includeSupabase}

Generate:
1. Complete Prisma schema (prisma/schema.prisma)
2. Supabase SQL migration file (supabase/migrations/001_initial.sql)
3. TypeScript types auto-generated from schema (types/database.ts)
4. Zod validation schemas for all models (lib/validations.ts)
5. CRUD API routes for each model (app/api/[model-name]/route.ts)`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 8192,
      messages: [
        { role: "system", content: SCHEMA_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateSchemaResponse;
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
