import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ description: "Generate Framer Motion animation code using OpenAI." });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const preset = typeof body.preset === "string" ? body.preset : "fade";
    const duration = typeof body.duration === "number" ? body.duration : 0.5;
    const delay = typeof body.delay === "number" ? body.delay : 0;
    const target = typeof body.target === "string" ? body.target : "div";

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const chat = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a Framer Motion expert. Generate clean, minimal TypeScript React components using Framer Motion. Output only the code, no explanation or markdown.",
        },
        {
          role: "user",
          content: `Generate a Framer Motion component with a "${preset}" animation preset, duration of ${duration}s, and delay of ${delay}s. Target element: ${target}. Include the motion variants and a working example component.`,
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
