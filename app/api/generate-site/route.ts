import OpenAI from "openai";
import { NextResponse } from "next/server";
import { GENERATE_SITE_SYSTEM_PROMPT } from "@/lib/system-prompts";
import { recordGeneratedFile } from "@/lib/memory";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { prompt, projectId = "default" } = body as {
      prompt?: string;
      projectId?: string;
    };

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY in .env.local" }, { status: 500 });
    }
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const completion = await getClient().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: GENERATE_SITE_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      parsed = { code: raw, reasoning: "" };
    }

    const code = String(parsed.code ?? "");

    // Record in project memory
    if (code) {
      recordGeneratedFile(projectId, "generated.html", "html", `Generated for: ${prompt.slice(0, 80)}`);
    }

    return NextResponse.json({
      result: code,
      reasoning: parsed.reasoning ?? "",
      components: parsed.components ?? [],
      seoMetadata: parsed.seoMetadata ?? {},
      techUsed: parsed.techUsed ?? [],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
