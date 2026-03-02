import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { prompt, framework, port } = body;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY in .env.local" }, { status: 500 });
    }
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const frameworkStr = framework && typeof framework === "string" ? framework : "Node.js";
    const portStr = port ? String(port) : "3000";

    const r = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You generate Dockerfile and docker-compose.yml files. Return ONLY the file contents separated by '--- docker-compose.yml ---', no explanations.",
        },
        {
          role: "user",
          content: `Framework: ${frameworkStr}\nPort: ${portStr}\n\n${prompt}`,
        },
      ],
    });

    const text = (r as { output_text?: string }).output_text ?? "";
    return NextResponse.json({ result: text });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
