import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ description: "Accessibility checker API – detects WCAG violations using AI" });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const html = body.html as string | undefined;
    if (!html) return NextResponse.json({ error: "Missing html field" }, { status: 400 });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an accessibility expert. Analyze the provided HTML/JSX and return a JSON array of WCAG violations. Each violation must have: id (string), severity ("critical"|"serious"|"moderate"|"minor"), description (string), fix (string). Return ONLY valid JSON array, no markdown.`,
        },
        { role: "user", content: html },
      ],
    });
    return NextResponse.json({ result: completion.choices[0]?.message?.content ?? "[]" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
