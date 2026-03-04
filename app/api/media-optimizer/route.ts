import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ description: "Generate next/image optimization config using OpenAI." });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl : "";
    const format = typeof body.format === "string" ? body.format : "webp";

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const chat = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a Next.js performance expert. Generate optimized next/image configuration and usage examples. Output only code, no markdown fences.",
        },
        {
          role: "user",
          content: `Generate an optimized next/image component for: URL="${imageUrl}", target format="${format}". Include next.config.ts remotePatterns if needed, and a ready-to-use Image component with proper width, height, priority, and loading settings.`,
        },
      ],
      max_tokens: 500,
    });

    const config = chat.choices[0]?.message?.content ?? "// Generation failed";
    return NextResponse.json({ config, imageUrl, format });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
