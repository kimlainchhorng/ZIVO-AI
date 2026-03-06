// lib/ai/api-generator.ts — AI API Route Generator

import OpenAI from "openai";
import type { Table } from "./database-generator";

export interface APIRoute {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  description: string;
  handler: string;
  tags: string[];
}

export interface GeneratedAPIFile {
  path: string;
  content: string;
  action: "create";
}

export interface APIGeneratorResult {
  routes: APIRoute[];
  files: GeneratedAPIFile[];
}

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const API_SYSTEM_PROMPT = `You are a Next.js API route expert. Generate complete CRUD API routes for the given tables.

Return ONLY a valid JSON object (no markdown fences):
{
  "routes": [
    {
      "method": "GET",
      "path": "/api/users",
      "description": "List all users with pagination and filtering",
      "handler": "full TypeScript route handler code",
      "tags": ["users", "list"]
    }
  ],
  "files": [
    {
      "path": "app/api/users/route.ts",
      "content": "full file content",
      "action": "create"
    }
  ]
}

Rules:
- Generate GET (list + filter), GET by ID, POST (create), PUT (update), DELETE for each table
- Use Supabase (@supabase/supabase-js) as the backend
- Use Zod for input validation
- Include proper TypeScript types (no any)
- Include error handling with NextResponse.json
- Export runtime = "nodejs"
- All files use 'import { NextResponse } from "next/server"'
- Include pagination (page, limit query params) for list endpoints`;

export async function generateAPIRoutes(
  prompt: string,
  tables?: Table[],
  framework: "nextjs" | "express" = "nextjs"
): Promise<APIGeneratorResult> {
  const client = getClient();

  const tableContext = tables?.length
    ? `\n\nDatabase tables:\n${JSON.stringify(tables.map((t) => ({ name: t.name, columns: t.columns.map((c) => ({ name: c.name, type: c.type })) })), null, 2)}`
    : "";

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
    max_tokens: 8192,
    messages: [
      { role: "system", content: API_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Generate ${framework} CRUD API routes for: ${prompt}${tableContext}`,
      },
    ],
  });

  const rawText = response.choices?.[0]?.message?.content ?? "";
  let parsed: APIGeneratorResult;
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText) as APIGeneratorResult;
  } catch {
    throw new Error("Failed to parse AI response for API routes");
  }

  return {
    routes: parsed.routes ?? [],
    files: parsed.files ?? [],
  };
}
