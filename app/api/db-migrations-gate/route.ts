import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    description:
      "Database migration gate. POST { migration: string, dbType: string } to check migration safety, detect destructive operations, and receive a go/no-go recommendation.",
  });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a database reliability engineer. Analyze the provided SQL migration script for the given database type (PostgreSQL, MySQL, SQLite, etc.). Check for: destructive operations (DROP TABLE, TRUNCATE, column removal), missing DOWN migration, lock-heavy operations that may cause downtime, missing indexes on foreign keys, data type changes that could cause truncation, and compliance with zero-downtime migration patterns. Return a JSON object with: verdict ('safe'|'warning'|'blocked'), issues (array of { severity, description, suggestion }), and mitigationSteps (string).",
        },
        { role: "user", content: JSON.stringify(body) },
      ],
    });
    const result = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
