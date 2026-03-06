import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    description:
      "AI performance review endpoint. POST { code: string, type: 'frontend' | 'backend' } to receive performance analysis and optimization suggestions.",
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
            "You are a performance engineering expert. Analyze the provided code for performance bottlenecks. For frontend code check for unnecessary re-renders, large bundle sizes, blocking operations, and missing memoization. For backend code check for N+1 queries, missing indexes, synchronous blocking calls, inefficient algorithms, and memory leaks. Return ranked findings with estimated impact and concrete refactoring suggestions.",
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
