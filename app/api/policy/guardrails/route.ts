import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    description:
      "AI safety guardrails API: content filtering, prompt injection detection, and PII detection. POST { content: string, checks: string[] }",
  });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const content = typeof body.content === "string" ? body.content : "";
    const checks = Array.isArray(body.checks)
      ? (body.checks as unknown[]).filter((c): c is string => typeof c === "string")
      : ["content_filter", "prompt_injection", "pii"];

    if (!content) {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = `You are an AI safety guardrail. Analyze the provided content and return a JSON object with the following keys based on the requested checks: ${checks.join(", ")}. For each check, return an object with "flagged" (boolean) and "reason" (string). Only return valid JSON.`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const result = JSON.parse(raw) as Record<string, unknown>;

    return NextResponse.json({ checks: result, content_length: content.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
