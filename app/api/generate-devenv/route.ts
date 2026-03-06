import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

interface GeneratedFile {
  path: string;
  content: string;
}

interface DevEnvResult {
  files: GeneratedFile[];
  summary: string;
  setupInstructions: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({})) as {
    projectType: string;
    language?: string;
    framework?: string;
    features?: string[];
  };

  if (!body.projectType) {
    return NextResponse.json({ error: "projectType is required" }, { status: 400 });
  }

  const client = new OpenAI({ apiKey });

  const userContent = [
    `Project type: ${body.projectType}`,
    body.language && `Language: ${body.language}`,
    body.framework && `Framework: ${body.framework}`,
    body.features?.length && `Features: ${body.features.join(", ")}`,
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
          "You are a DevOps expert specializing in developer tooling. Generate a complete development environment configuration. Return JSON with: files (array of {path: string, content: string}) for: .devcontainer/devcontainer.json, .vscode/settings.json, .vscode/extensions.json, .editorconfig, prettier.config.js, .prettierignore, eslint.config.mjs, .husky/pre-commit, commitlint.config.js, .env.example; summary (string), setupInstructions (string).",
      },
      { role: "user", content: userContent },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";

  let result: DevEnvResult;
  try {
    result = JSON.parse(raw) as DevEnvResult;
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }

  return NextResponse.json(result);
}
