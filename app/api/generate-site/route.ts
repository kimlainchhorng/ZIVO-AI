import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

let _openai: OpenAI | null = null;

function _get_client(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set in environment variables.");
  }
  if (!_openai) {
    _openai = new OpenAI({ apiKey });
  }
  return _openai;
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "A non-empty prompt is required." },
        { status: 400 }
      );
    }

    const client = _get_client();
    const model = process.env.OPENAI_MODEL_TEXT ?? "gpt-4.1-mini";
    const temperature = parseFloat(process.env.OPENAI_TEMPERATURE ?? "0.4");

    const systemPrompt =
      "You are a file generator AI.\n" +
      "Return ONLY valid JSON in the following format:\n" +
      '{\n  "files": [\n    { "path": "app/page.tsx", "content": "file content here" }\n  ]\n}';

    const response = await client.chat.completions.create({
      model,
      temperature,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt.trim() },
      ],
    });

    const text = response.choices[0]?.message?.content ?? "{}";

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON.", raw: text },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}