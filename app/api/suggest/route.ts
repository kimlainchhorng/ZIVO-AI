import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const partial: string = body?.partial ?? "";

    if (!partial.trim()) {
      return NextResponse.json({ suggestions: [] });
    }

    const response = await getClient().chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content: `You are a prompt completion assistant for an AI web app builder called ZIVO AI.
Given a partial prompt, return exactly 3 short, specific, compelling prompt completions.
Return ONLY a valid JSON array of 3 strings. No markdown, no explanation.
Example: ["Build a landing page with hero, features, and pricing", "Build a todo app with dark mode and local storage", "Build an e-commerce store with cart and checkout"]`,
        },
        { role: "user", content: `Partial prompt: "${partial}"\nReturn 3 completions:` },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "[]";
    let suggestions: string[] = [];
    try {
      suggestions = JSON.parse(text);
      if (!Array.isArray(suggestions)) suggestions = [];
    } catch {
      suggestions = [];
    }

    return NextResponse.json({ suggestions: suggestions.slice(0, 3) });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error)?.message || "Server error" }, { status: 500 });
  }
}
