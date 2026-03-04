import { NextResponse } from "next/server";
import OpenAI from "openai";
import { MOBILE_BUILDER_PROMPTS, MOBILE_BUILDER_BASE_INSTRUCTIONS } from "../../../prompts/mobile-builder";

export const runtime = "nodejs";

export type MobilePlatform = "flutter" | "react-native" | "kotlin" | "swift";

export interface GeneratedFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateMobileResponse {
  files: GeneratedFile[];
  commands?: string[];
  summary: string;
  platform: MobilePlatform;
}

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();
}

function parseJSON(text: string): GenerateMobileResponse {
  const cleaned = stripMarkdownFences(text);
  try {
    return JSON.parse(cleaned);
  } catch (parseErr) {
    console.error("[generate-mobile] Initial JSON parse failed:", parseErr);
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("AI did not return valid JSON");
  }
}

const VALID_FILE_ACTIONS = new Set(["create", "update", "delete"]);

function isValidFile(f: unknown): f is GeneratedFile {
  if (!f || typeof f !== "object") return false;
  const { path, content, action } = f as Record<string, unknown>;
  return (
    typeof path === "string" &&
    path.length > 0 &&
    typeof content === "string" &&
    VALID_FILE_ACTIONS.has(action as string)
  );
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const description = typeof body?.description === "string" ? body.description : "";
    const platform: MobilePlatform = ["flutter", "react-native", "kotlin", "swift"].includes(
      body?.platform
    )
      ? (body.platform as MobilePlatform)
      : "flutter";

    if (!description.trim()) {
      return NextResponse.json({ error: "Missing description" }, { status: 400 });
    }

    const systemPrompt = `${MOBILE_BUILDER_PROMPTS[platform]}\n${MOBILE_BUILDER_BASE_INSTRUCTIONS}`;

    let parsed: GenerateMobileResponse | null = null;
    let lastError = "";

    for (let attempt = 0; attempt < 3; attempt++) {
      const r = await getClient().chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: description.trim() },
        ],
        temperature: 0.3,
        max_tokens: 8000,
      });

      const text: string = r.choices[0]?.message?.content ?? "";
      try {
        parsed = parseJSON(text);
        if (Array.isArray(parsed.files)) break;
        lastError = "Invalid response structure: missing files array";
        parsed = null;
      } catch (e) {
        lastError = (e as Error).message || "AI did not return valid JSON";
      }
    }

    if (!parsed) {
      return NextResponse.json(
        { error: lastError || "AI did not return valid JSON" },
        { status: 502 }
      );
    }

    if (!Array.isArray(parsed.files)) {
      parsed.files = [];
    }
    parsed.files = parsed.files.filter(isValidFile);

    parsed.platform = platform;

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
