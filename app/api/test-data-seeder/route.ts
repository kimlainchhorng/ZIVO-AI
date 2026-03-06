import { NextResponse } from "next/server";
import OpenAI from "openai";
import { TEST_DATA_SEEDER_SYSTEM_PROMPT } from "@/prompts/devops-ai-routes";

export const runtime = "nodejs";

interface TestDataSeederBody {
  schema: Record<string, unknown>;
  count: number;
}

export async function GET() {
  return NextResponse.json({
    description:
      "Test data seeder API. Accepts a JSON schema and a count, then uses AI to generate realistic fake data records matching the schema.",
  });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as TestDataSeederBody;
    const { schema, count } = body;

    if (!schema || typeof schema !== "object") {
      return NextResponse.json(
        { error: "Missing required field: schema (must be a JSON object)" },
        { status: 400 }
      );
    }

    const recordCount = typeof count === "number" && count > 0 ? Math.min(count, 100) : 5;

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = TEST_DATA_SEEDER_SYSTEM_PROMPT;

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Generate ${recordCount} realistic test data records conforming to this schema:\n\n${JSON.stringify(schema, null, 2)}\n\nReturn only a JSON array.`,
        },
      ],
      temperature: 0.8,
      response_format: { type: "json_object" },
    });

    const rawContent = completion.choices[0]?.message?.content ?? "{}";

    let records: unknown;
    try {
      const parsed = JSON.parse(rawContent) as Record<string, unknown>;
      const firstArrayValue = Object.values(parsed).find((v) => Array.isArray(v));
      records = firstArrayValue ?? parsed;
    } catch {
      records = rawContent;
    }

    return NextResponse.json({ count: recordCount, records });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
