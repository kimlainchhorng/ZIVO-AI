import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

type Framework =
  | "nextjs"
  | "remix"
  | "astro"
  | "sveltekit"
  | "nuxt"
  | "express"
  | "fastapi"
  | "django"
  | "nestjs"
  | "laravel";

interface GenerateFrameworkBody {
  prompt: string;
  framework: Framework;
  appType?: string;
}

interface GeneratedFile {
  path: string;
  content: string;
  action: string;
}

interface GenerateFrameworkResult {
  files: GeneratedFile[];
  summary: string;
  setupInstructions: string;
  framework: string;
}

function isGeneratedFile(value: unknown): value is GeneratedFile {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.path === "string" &&
    typeof obj.content === "string" &&
    typeof obj.action === "string"
  );
}

const VALID_FRAMEWORKS: Framework[] = [
  "nextjs", "remix", "astro", "sveltekit", "nuxt",
  "express", "fastapi", "django", "nestjs", "laravel",
];

export async function POST(req: Request): Promise<NextResponse> {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 500 });
  }

  const body = await req.json().catch(() => ({})) as Partial<GenerateFrameworkBody>;
  const { prompt, framework, appType } = body;

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "Missing required field: prompt (string)." }, { status: 400 });
  }
  if (!framework || !VALID_FRAMEWORKS.includes(framework)) {
    return NextResponse.json(
      { error: `Missing or invalid field: framework. Must be one of: ${VALID_FRAMEWORKS.join(", ")}.` },
      { status: 400 },
    );
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const userContent = [
    `Generate a complete ${framework} application.`,
    appType ? `App type: ${appType}` : "",
    `Requirements: ${prompt}`,
  ]
    .filter(Boolean)
    .join("\n");

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are an expert ${framework} developer. Generate complete, production-ready ${framework} application code. Return JSON with: files (array of {path: string, content: string, action: 'create'}), summary (string), setupInstructions (string).`,
      },
      { role: "user", content: userContent },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response as JSON." }, { status: 500 });
  }

  const rawFiles = Array.isArray(parsed.files) ? parsed.files : [];
  const result: GenerateFrameworkResult = {
    files: rawFiles.filter(isGeneratedFile),
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    setupInstructions: typeof parsed.setupInstructions === "string" ? parsed.setupInstructions : "",
    framework,
  };

  return NextResponse.json(result);
}
