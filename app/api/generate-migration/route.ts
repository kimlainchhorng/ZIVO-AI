import { NextResponse } from "next/server";
import OpenAI from "openai";
import { stripMarkdownFences } from "../../../lib/code-parser";

export const runtime = "nodejs";

interface MigrationBody {
  oldSchema: string;
  newSchema: string;
  database: "postgresql" | "mysql";
}

interface MigrationResult {
  migrationUp: string;
  migrationDown: string;
  warnings: string[];
  isSafe: boolean;
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

    const { oldSchema, newSchema, database } = body as Partial<MigrationBody>;

    if (!oldSchema || typeof oldSchema !== "string") {
      return NextResponse.json({ error: "oldSchema is required" }, { status: 400 });
    }
    if (!newSchema || typeof newSchema !== "string") {
      return NextResponse.json({ error: "newSchema is required" }, { status: 400 });
    }
    if (!database || !["postgresql", "mysql"].includes(database)) {
      return NextResponse.json({ error: "database must be postgresql or mysql" }, { status: 400 });
    }

    const prompt = `Generate a safe database migration for ${database}.

Old schema:
${oldSchema}

New schema:
${newSchema}

Return a JSON object:
{
  "migrationUp": "-- SQL for applying the migration",
  "migrationDown": "-- SQL for rolling back the migration",
  "warnings": ["warning1", ...],
  "isSafe": true|false
}

Consider: data loss risks (dropping columns/tables), non-null column additions, index changes.
Mark isSafe=false if the migration could lose data without a backup.
Respond ONLY with the JSON object.`;

    const completion = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.1,
      max_tokens: 2048,
      messages: [
        { role: "system", content: "You are a database migration expert. Generate safe, reversible migrations." },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let result: MigrationResult = { migrationUp: "", migrationDown: "", warnings: [], isSafe: false };
    try {
      result = JSON.parse(stripMarkdownFences(raw)) as MigrationResult;
    } catch {
      result.migrationUp = raw;
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
