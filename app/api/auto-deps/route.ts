import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    description:
      "Auto dependency updater. POST { packageJson: string } to receive suggested dependency updates with changelogs and breaking-change warnings.",
  });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a dependency management expert. Analyze the provided package.json and suggest dependency updates. For each dependency identify the current version, the latest stable version, whether the update is a major/minor/patch bump, potential breaking changes, and security advisories. Return a structured JSON array of update recommendations sorted by priority.",
        },
        { role: "user", content: JSON.stringify(body) },
      ],
    });
    const result = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
