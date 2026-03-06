import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ description: "AI-powered performance analysis and suggestions" });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const url = body.url as string | undefined;
    if (!url) return NextResponse.json({ error: "Missing url field" }, { status: 400 });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a web performance expert. Given a URL, simulate a realistic performance analysis and return a JSON object with: performance (0-100), accessibility (0-100), seo (0-100), bestPractices (0-100), lcp (string like "2.4s"), fid (string like "45ms"), cls (string like "0.08"), tti (string like "3.1s"), suggestions (array of 5 specific improvement strings). Return ONLY valid JSON, no markdown.`,
        },
        { role: "user", content: `Analyze performance for: ${url}` },
      ],
    });
    return NextResponse.json({ result: completion.choices[0]?.message?.content ?? "{}" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
