import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    description:
      "Content moderation API using OpenAI moderation endpoint. POST { content: string }",
  });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const content = typeof body.content === "string" ? body.content : "";

    if (!content) {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const moderation = await client.moderations.create({ input: content });
    const result = moderation.results[0];

    return NextResponse.json({
      flagged: result?.flagged ?? false,
      categories: result?.categories ?? {},
      category_scores: result?.category_scores ?? {},
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
