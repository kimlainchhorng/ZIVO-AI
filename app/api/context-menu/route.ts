import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ description: "Context menu builder – generates React context menu component code using AI" });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const items = body.items as Array<{ label: string; action: string }> | undefined;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Missing or invalid items array" }, { status: 400 });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a React expert. Generate a complete, accessible, TypeScript React context menu component using Tailwind CSS. Include positioning logic on right-click. No explanations, only code.",
        },
        {
          role: "user",
          content: `Generate a context menu component with these items: ${JSON.stringify(items)}`,
        },
      ],
    });
    return NextResponse.json({ result: completion.choices[0]?.message?.content ?? "" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
