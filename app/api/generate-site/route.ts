import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are ZIVO AI — an expert full-stack developer that generates complete, working web applications.

When given a description, respond with a valid JSON object:
{
  "files": [
    {
      "path": "index.html",
      "content": "<!DOCTYPE html>...(complete, self-contained HTML with inline CSS and JS)...",
      "language": "html"
    },
    {
      "path": "app/page.tsx",
      "content": "...(complete Next.js page component)...",
      "language": "typescript"
    }
  ],
  "preview_html": "<!DOCTYPE html>...(single self-contained HTML file for live preview)...",
  "summary": "Brief description of what was built"
}

Rules:
- ALWAYS include a \`preview_html\` field: a single complete self-contained HTML file with ALL CSS inline in <style> tags and ALL JS inline in <script> tags. No external CDN links that might fail.
- Make the UI beautiful: use modern CSS, gradients, good typography, proper spacing
- The HTML preview should look like a real polished app, not a demo
- Also include the main Next.js/React files in the \`files\` array
- Return ONLY valid JSON, no markdown fences, no explanation text`;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt: string = body?.prompt || "";

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in .env.local" },
        { status: 500 }
      );
    }

    if (!prompt.trim()) {
      return NextResponse.json(
        { error: "Missing prompt" },
        { status: 400 }
      );
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: Number(process.env.OPENAI_TEMPERATURE ?? "0.4"),
      max_tokens: 4000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content || "{}";

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON from AI", raw: text },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}