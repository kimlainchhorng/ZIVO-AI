import { NextResponse } from "next/server";
import OpenAI from "openai";
import { stripMarkdownFences } from "../../../lib/code-parser";

export const runtime = "nodejs";

interface TableDefinition {
  name: string;
  columns: Array<{ name: string; type: string; nullable?: boolean }>;
  primaryKey?: string;
}

interface RLSPolicy {
  table: string;
  name: string;
  command: "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "ALL";
  using?: string;
  withCheck?: string;
  roles: string[];
}

interface RLSBody {
  tables: TableDefinition[];
  authProvider: "supabase" | "custom";
  multiTenant?: boolean;
}

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { tables, authProvider, multiTenant = false } = body as Partial<RLSBody>;

    if (!Array.isArray(tables) || tables.length === 0) {
      return NextResponse.json({ error: "tables must be a non-empty array" }, { status: 400 });
    }
    if (!authProvider || !["supabase", "custom"].includes(authProvider)) {
      return NextResponse.json({ error: "authProvider must be supabase or custom" }, { status: 400 });
    }

    const tablesSummary = tables.map((t) => `Table: ${t.name} (${t.columns.map((c) => c.name).join(", ")})`).join("\n");
    const authNote = authProvider === "supabase"
      ? "Use auth.uid() for the current user ID and auth.role() for roles."
      : "Use current_user_id() and current_user_role() functions.";
    const multiTenantNote = multiTenant ? "\nGenerate multi-tenant isolation policies using tenant_id columns." : "";

    const prompt = `Generate PostgreSQL Row Level Security (RLS) policies for these tables.
Auth provider: ${authProvider}. ${authNote}${multiTenantNote}

Tables:
${tablesSummary}

Return a JSON object:
{
  "policies": [{"table":"...","name":"...","command":"SELECT|INSERT|UPDATE|DELETE|ALL","using":"...","withCheck":"...","roles":["authenticated"]}],
  "sql": "-- Complete SQL to enable RLS and create all policies",
  "explanation": ["policy1 explanation", ...]
}

Respond ONLY with the JSON object.`;

    const completion = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 2048,
      messages: [
        { role: "system", content: "You are a database security expert specializing in Row Level Security policies." },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let result: { policies: RLSPolicy[]; sql: string; explanation: string[] } = { policies: [], sql: "", explanation: [] };
    try {
      result = JSON.parse(stripMarkdownFences(raw)) as typeof result;
    } catch {
      result.sql = raw;
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
