import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

interface GeneratedFile {
  path: string;
  content: string;
}

interface I18nResult {
  files: GeneratedFile[];
  summary: string;
  rtlLanguages: string[];
}

export async function POST(req: Request): Promise<NextResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({})) as {
    projectName?: string;
    sourceLanguage?: string;
    targetLanguages?: string[];
    framework?: "next-intl" | "react-i18next";
    content?: string;
  };

  const targetLanguages = body.targetLanguages ?? ["en", "es", "fr", "zh", "ar", "ja"];

  const client = new OpenAI({ apiKey });

  const userContent = [
    body.projectName && `Project name: ${body.projectName}`,
    `Source language: ${body.sourceLanguage ?? "en"}`,
    `Target languages: ${targetLanguages.join(", ")}`,
    body.framework && `Framework: ${body.framework}`,
    body.content && `Content to translate:\n${body.content}`,
  ]
    .filter(Boolean)
    .join("\n");

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are an internationalization expert. Generate multi-language support files and setup code. Return JSON with: files (array of {path: string, content: string}) for translation JSON files per language and the i18n setup code; summary (string), rtlLanguages (string[] like ['ar', 'he']).",
      },
      { role: "user", content: userContent },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";

  let result: I18nResult;
  try {
    result = JSON.parse(raw) as I18nResult;
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }

  return NextResponse.json(result);
}
