import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY in .env.local" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const prompt = body?.prompt;
    const system = body?.system ?? "You are ZIVO AI. Be concise, helpful, and practical.";
    const temperature = typeof body?.temperature === "number" ? body.temperature : 0.4;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const r = await client.responses.create({
      model: "gpt-4.1-mini",
      temperature,
      input: [
        { role: "system", content: String(system) },
        { role: "user", content: prompt },
      ],
    });

    const text = (r as any).output_text ?? "";
    return NextResponse.json({ result: text });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}