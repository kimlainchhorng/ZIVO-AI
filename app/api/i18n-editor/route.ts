import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ description: "i18n localization editor with AI translation" });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const action = body.action as string | undefined;

    if (action === "export") {
      const keys = (body.keys as Record<string, string> | undefined) ?? {};
      return NextResponse.json({ result: JSON.stringify(keys, null, 2) });
    }

    if (action === "import") {
      return NextResponse.json({ success: true, message: "Import handled client-side" });
    }

    if (action === "translate") {
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
      }
      const keys = (body.keys as Record<string, string> | undefined) ?? {};
      const targetLang = (body.targetLang as string | undefined) ?? "es";

      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Translate the following JSON key-value pairs from English to ${targetLang}. Return ONLY a JSON object with the same keys but translated values. No markdown.`,
          },
          { role: "user", content: JSON.stringify(keys) },
        ],
      });
      return NextResponse.json({ result: completion.choices[0]?.message?.content ?? "{}" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
