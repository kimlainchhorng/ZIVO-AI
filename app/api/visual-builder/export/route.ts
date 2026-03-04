import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ description: "Export visual builder canvas as Next.js + Tailwind code via OpenAI." });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const components = Array.isArray(body.components) ? (body.components as unknown[]) : [];

    if (components.length === 0) {
      return NextResponse.json({ code: "// No components to export" });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const componentList = components
      .map((c) => {
        const comp = c as Record<string, unknown>;
        return `${comp.type as string}(${JSON.stringify(comp.props ?? {})})`;
      })
      .join(", ");

    const chat = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a Next.js expert. Generate clean, functional Next.js 15 App Router page code using Tailwind CSS with a dark theme (#0a0a0a background, #6366f1 accent). Output only the code, no explanation.",
        },
        {
          role: "user",
          content: `Generate a Next.js page that renders the following components in order: ${componentList}. Use 'use client' if needed. Keep it concise and complete.`,
        },
      ],
      max_tokens: 800,
    });

    const code = chat.choices[0]?.message?.content ?? "// Generation failed";
    return NextResponse.json({ code });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
