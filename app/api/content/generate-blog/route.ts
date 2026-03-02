import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { topic, tone, keywords } = body;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY in .env.local" }, { status: 500 });
    }
    if (!topic || typeof topic !== "string") {
      return NextResponse.json({ error: "Missing topic" }, { status: 400 });
    }

    const toneStr = tone && typeof tone === "string" ? tone : "professional";
    const keywordsStr =
      Array.isArray(keywords) && keywords.length > 0
        ? `Keywords to include: ${keywords.join(", ")}`
        : "";

    const r = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: `You are an expert blog writer. Write in a ${toneStr} tone. Return well-structured blog post content in Markdown format.`,
        },
        {
          role: "user",
          content: `Write a blog post about: ${topic}\n${keywordsStr}`,
        },
      ],
    });

    const text = (r as any).output_text ?? "";
    return NextResponse.json({ result: text });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
