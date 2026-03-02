import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt = body?.prompt;
    const existingHtml: string | undefined = body?.existingHtml;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY in .env.local" }, { status: 500 });
    }
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const isRefinement = typeof existingHtml === "string" && existingHtml.trim().length > 0;

    const systemPrompt = isRefinement
      ? "You are an expert web developer. The user will provide existing HTML and a change instruction. Apply the requested changes and return the complete updated HTML. Return ONLY the full HTML, no explanations."
      : "You generate clean website code. Return ONLY the code output, no explanations.";

    const userMessage = isRefinement
      ? `Here is the current HTML:\n\`\`\`html\n${existingHtml}\n\`\`\`\n\nInstruction: ${prompt}\n\nReturn the full updated HTML.`
      : prompt;

    const r = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const text = (r as any).output_text ?? "";
    return NextResponse.json({ result: text });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
