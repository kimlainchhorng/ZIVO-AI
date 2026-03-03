import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? "placeholder",
});

export type FileAction = "create" | "update" | "delete";

export interface GeneratedFile {
  path: string;
  content: string;
  action: FileAction;
}

export interface GenerateSiteResponse {
  files: GeneratedFile[];
  preview_html?: string;
  summary?: string;
  notes?: string;
}

const SYSTEM_PROMPT = `You are an expert full-stack developer AI. Generate complete, production-ready Next.js App Router code.

Rules:
- Return ONLY valid JSON: { "files": Array<{ "path": string; "content": string; "action": "create"|"update"|"delete" }>, "preview_html": string, "summary": string, "notes"?: string }
- Generate complete, working code — no placeholders or TODOs
- Use TypeScript with strict types
- Use Tailwind CSS for styling
- Include proper error handling
- Generate all necessary files (page.tsx, components, API routes, types)
- Do NOT wrap JSON in markdown fences
- Do NOT include backticks in the JSON response
- ALWAYS include a preview_html field: a single complete self-contained HTML file with ALL CSS inline in <style> tags and ALL JS inline in <script> tags
- Make the UI beautiful: use modern CSS, gradients, good typography, proper spacing`;

const TYPE_CHECK_PROMPT = `You are a TypeScript expert. Review the following generated files for TypeScript type errors or obvious bugs.
If there are errors, return a corrected JSON object using the same schema (files, preview_html, summary, notes).
If there are no errors, return the original JSON unchanged.
Return ONLY valid JSON, no markdown, no explanation.`;

const VALID_MODELS = ["gpt-4.1-mini", "gpt-4o", "gpt-4o-mini"] as const;
type ValidModel = (typeof VALID_MODELS)[number];

async function generateFiles(
  prompt: string,
  model: ValidModel,
  stream: boolean
): Promise<GenerateSiteResponse> {
  if (stream) {
    const streamResponse = await client.chat.completions.create({
      model,
      temperature: Number(process.env.OPENAI_TEMPERATURE ?? "0.4"),
      max_tokens: 4000,
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    });

    let text = "";
    for await (const chunk of streamResponse) {
      text += chunk.choices[0]?.delta?.content ?? "";
    }
    return parseJSON(text);
  }

  const response = await client.chat.completions.create({
    model,
    temperature: Number(process.env.OPENAI_TEMPERATURE ?? "0.4"),
    max_tokens: 4000,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
  });

  const text = response.choices?.[0]?.message?.content || "{}";
  return parseJSON(text);
}

function parseJSON(text: string): GenerateSiteResponse {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("AI did not return valid JSON");
  }
}

async function selfCorrect(
  parsed: GenerateSiteResponse,
  maxRetries: number = 2
): Promise<GenerateSiteResponse> {
  let current = parsed;
  let retries = 0;

  while (retries < maxRetries) {
    const checkResponse = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      max_tokens: 4000,
      messages: [
        { role: "system", content: TYPE_CHECK_PROMPT },
        { role: "user", content: JSON.stringify(current) },
      ],
    });

    const correctedText = checkResponse.choices?.[0]?.message?.content || "{}";
    let corrected: GenerateSiteResponse;
    try {
      corrected = parseJSON(correctedText);
    } catch {
      break;
    }

    const unchanged =
      corrected.files?.length === current.files?.length &&
      (corrected.files ?? []).every(
        (f, i) => f.content === (current.files ?? [])[i]?.content
      );

    if (unchanged) break;

    current = corrected;
    retries++;
  }

  return current;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in .env.local" },
        { status: 500 }
      );
    }

    const prompt: string = body?.prompt ?? "";
    if (!prompt.trim()) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const requestedModel: string = body?.model ?? "gpt-4o";
    const model: ValidModel = (VALID_MODELS as readonly string[]).includes(requestedModel)
      ? (requestedModel as ValidModel)
      : "gpt-4o";

    const useStream: boolean = body?.stream === true;

    let parsed: GenerateSiteResponse;
    try {
      parsed = await generateFiles(prompt, model, useStream);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON from AI" },
        { status: 500 }
      );
    }

    if (!Array.isArray(parsed.files)) {
      parsed.files = [];
    }

    const corrected = await selfCorrect(parsed);

    return NextResponse.json(corrected);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
