import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ description: "Search-everywhere (cmdk) configuration generator" });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const items = (body.items as string[] | undefined) ?? [];
    const shortcuts = (body.shortcuts as string[] | undefined) ?? [];

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a React expert. Generate a complete TypeScript cmdk (Command Menu) component with Tailwind CSS. Include keyboard shortcut handling, search filtering, and the provided items as commands. No explanations, only code.",
        },
        {
          role: "user",
          content: `Generate a cmdk search-everywhere component. Items: ${JSON.stringify(items)}. Open shortcuts: ${JSON.stringify(shortcuts)}.`,
        },
      ],
    });
    return NextResponse.json({ result: completion.choices[0]?.message?.content ?? "" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
