import { getOpenAIClient } from "@/lib/openai-client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";


const SYSTEM_PROMPT = `You are an expert PostgreSQL database architect. Generate a complete database schema for a Supabase/PostgreSQL project.

Return a JSON object with this exact structure:
{
  "schemaName": "string",
  "description": "string",
  "sql": "-- Full SQL migration including CREATE TABLE, indexes, constraints, RLS policies",
  "tables": [
    {
      "name": "string",
      "description": "string",
      "columns": [
        {
          "name": "string",
          "type": "string",
          "nullable": false,
          "default": "string or null",
          "constraints": "string"
        }
      ],
      "indexes": ["string"],
      "rlsPolicies": ["string"]
    }
  ],
  "enums": [{ "name": "string", "values": ["string"] }],
  "functions": ["string"]
}

Always include:
- UUID primary keys with gen_random_uuid()
- created_at and updated_at timestamps
- Row Level Security (RLS) enabled on all tables
- Appropriate indexes for foreign keys and frequently queried columns
- Foreign key constraints with ON DELETE behavior`;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { prompt } = body;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY in .env.local" }, { status: 500 });
    }
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const r = await getOpenAIClient().responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Generate a PostgreSQL schema for: ${prompt}` },
      ],
    });

    const text = (r as any).output_text ?? "";

    let parsed: any = null;
    try {
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\})/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[1] : text);
    } catch {
      parsed = { raw: text };
    }

    return NextResponse.json({ ok: true, schema: parsed });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Schema generation failed" }, { status: 500 });
  }
}
