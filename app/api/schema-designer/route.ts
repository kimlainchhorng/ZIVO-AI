import { NextResponse } from "next/server";
import OpenAI from "openai";
import { stripMarkdownFences } from "../../../lib/code-parser";

export const runtime = "nodejs";

interface SchemaDesignerBody {
  description: string;
  database: "postgresql" | "mysql" | "sqlite";
  orm?: "prisma" | "drizzle";
}

interface SchemaResult {
  schemaSQL: string;
  prismaSchema?: string;
  drizzleSchema?: string;
  rlsPolicies?: string;
  migrations?: string[];
  erd?: string;
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

    const { description, database, orm } = body as Partial<SchemaDesignerBody>;

    if (!description || typeof description !== "string") {
      return NextResponse.json({ error: "description is required" }, { status: 400 });
    }
    if (!database || !["postgresql", "mysql", "sqlite"].includes(database)) {
      return NextResponse.json({ error: "database must be postgresql, mysql, or sqlite" }, { status: 400 });
    }

    const ormSection = orm ? `\nAlso generate a ${orm} schema.` : "";
    const prompt = `Design a complete database schema for the following application.
Database: ${database}
Description: ${description}
${ormSection}

Return a JSON object:
{
  "schemaSQL": "CREATE TABLE ...",
  "prismaSchema": "model User { ... }" or null,
  "drizzleSchema": "export const users = pgTable(...)" or null,
  "rlsPolicies": "CREATE POLICY ..." or null,
  "migrations": ["-- migration 1 SQL"],
  "erd": "ASCII or Mermaid ERD"
}

Respond ONLY with the JSON object.`;

    const completion = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 4096,
      messages: [
        { role: "system", content: "You are a database architect. Design optimal, normalized schemas with proper constraints and indexes." },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let result: SchemaResult = { schemaSQL: "" };
    try {
      result = JSON.parse(stripMarkdownFences(raw)) as SchemaResult;
    } catch {
      result = { schemaSQL: raw };
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
