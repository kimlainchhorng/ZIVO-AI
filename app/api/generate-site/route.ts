import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt = body?.prompt;
    const existingHtml = body?.existingHtml;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY in .env.local" }, { status: 500 });
    }
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const userMessage =
      existingHtml && typeof existingHtml === "string"
        ? `Here is the existing HTML:\n\`\`\`html\n${existingHtml}\n\`\`\`\n\nUpdate it based on: ${prompt}`
        : prompt;

    const r = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You generate clean website code. Return ONLY the code output, no explanations.",
        },
        { role: "user", content: userMessage },
      ],
    });

    const text = (r as any).output_text ?? "";
    return NextResponse.json({ result: text });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
