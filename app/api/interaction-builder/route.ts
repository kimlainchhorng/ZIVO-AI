import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ description: "Generate Framer Motion interaction code from event + animation + target." });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const event = typeof body.event === "string" ? body.event : "click";
    const animation = typeof body.animation === "string" ? body.animation : "fade";
    const target = typeof body.target === "string" ? body.target : ".element";

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const chat = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a Framer Motion and React expert. Generate clean TypeScript React code using Framer Motion for interactive animations. Output only code with no markdown fences.",
        },
        {
          role: "user",
          content: `Generate a Framer Motion React component that applies a "${animation}" animation on "${event}" event to the target element "${target}". Include useState if needed, proper motion props (whileTap, whileHover, whileInView), and transition config.`,
        },
      ],
      max_tokens: 600,
    });

    const code = chat.choices[0]?.message?.content ?? "// Generation failed";
    return NextResponse.json({ code });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
