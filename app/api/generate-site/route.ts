import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt: string = body?.prompt || "";

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in .env.local" },
        { status: 500 }
      );
    }

    if (!prompt.trim()) {
      return NextResponse.json(
        { error: "Missing prompt" },
        { status: 400 }
      );
    }

    const systemPrompt =
      "You are a code generator. Return ONLY valid JSON. " +
      "Schema: { files: Array<{ path: string; content: string }>, notes?: string }. " +
      "Do NOT wrap JSON in markdown. Do NOT include backticks.";

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL_TEXT || "gpt-4.1-mini",
      temperature: Number(process.env.OPENAI_TEMPERATURE ?? "0.4"),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content || "{}";

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON from AI", raw: text },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}