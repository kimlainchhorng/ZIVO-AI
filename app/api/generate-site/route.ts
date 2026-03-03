import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type BuilderFile = { action: "create" | "update" | "delete"; path: string; content?: string };
type BuilderResponse = { files: BuilderFile[]; notes?: string };

function safeJsonParse(text: string): { ok: true; value: any } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e: any) {
    return { ok: false, error: e?.message || "JSON parse error" };
  }
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY in .env.local" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const prompt = body?.prompt;
    const mode: "text" | "json" = body?.mode === "json" ? "json" : "text";

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    if (mode === "json") {
      const r = await client.responses.create({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "Return ONLY valid JSON in this exact shape: {\"files\":[{\"action\":\"create|update|delete\",\"path\":\"string\",\"content\":\"string?\"}],\"notes\":\"string\"}. No markdown.",
          },
          { role: "user", content: prompt },
        ],
      });

      const text = (r as any).output_text ?? "";
      const parsed = safeJsonParse(text);

      if (!parsed.ok) {
        return NextResponse.json(
          { error: "Invalid JSON from AI", parseError: parsed.error, raw: text },
          { status: 500 }
        );
      }

      const data = parsed.value as BuilderResponse;
      if (!data?.files || !Array.isArray(data.files)) {
        return NextResponse.json({ error: "JSON missing files[]", raw: text }, { status: 500 });
      }

      return NextResponse.json(data);
    }

    // text mode
    const r = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: "Return only the final code output. No markdown. No explanation." },
        { role: "user", content: prompt },
      ],
    });

    const text = (r as any).output_text ?? "";
    return NextResponse.json({ result: text });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
