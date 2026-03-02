import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// POST /api/database-builder
// Body: { description: string, tables?: string[], projectId?: string }
export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const { description, tables, projectId } = body;

    if (!description || typeof description !== "string") {
      return NextResponse.json(
        { error: "description is required" },
        { status: 400 }
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const tableHint = tables?.length
      ? `\n\nFocus on these tables: ${tables.join(", ")}`
      : "";

    const r = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: `You are a Supabase database expert. Generate production-ready database schemas including:
- CREATE TABLE statements with proper data types
- Primary keys (UUID with gen_random_uuid())
- Foreign key relationships
- Indexes for performance
- Row Level Security (RLS) policies
- Triggers for updated_at timestamps
- Functions for business logic

Output the SQL in a \`\`\`file:schema.sql block, then explain each table.`,
        },
        {
          role: "user",
          content: `Generate a Supabase schema for:${projectId ? ` (Project: ${projectId})` : ""}\n${description}${tableHint}`,
        },
      ],
    } as Parameters<typeof client.responses.create>[0]);

    const result = (r as { output_text?: string }).output_text ?? "";

    // Extract SQL from the response
    const sqlMatch = result.match(/```(?:sql|file:[^\n]*)\n([\s\S]*?)```/);
    const sql = sqlMatch?.[1]?.trim() ?? "";

    return NextResponse.json({ ok: true, result, sql });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
