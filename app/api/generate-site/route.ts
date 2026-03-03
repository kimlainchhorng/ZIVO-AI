import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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

const SYSTEM_PROMPT = `You are ZIVO AI — an expert full-stack developer that generates complete, working web applications.

When given a description, respond with a valid JSON object:
{
  "files": [
    {
      "path": "index.html",
      "content": "<!DOCTYPE html>...(complete, self-contained HTML with inline CSS and JS)...",
      "action": "create"
    },
    {
      "path": "app/page.tsx",
      "content": "...(complete Next.js page component)...",
      "action": "create"
    }
  ],
  "preview_html": "<!DOCTYPE html>...(single self-contained HTML file for live preview)...",
  "summary": "Brief description of what was built",
  "notes": "Any additional notes"
}

Rules:
- ALWAYS include a \`preview_html\` field: a single complete self-contained HTML file with ALL CSS inline in <style> tags and ALL JS inline in <script> tags. No external CDN links that might fail.
- Each file in \`files\` must have a \`path\`, \`content\`, and \`action\` ("create" | "update" | "delete").
- Make the UI beautiful: use modern CSS, gradients, good typography, proper spacing.
- The HTML preview should look like a real polished app, not a demo.
- Return ONLY valid JSON, no markdown fences, no explanation text.`;

const TYPE_CHECK_PROMPT = `You are a TypeScript expert. Review the following generated files for TypeScript type errors or obvious bugs.
If there are errors, return a corrected JSON object using the same schema (files, preview_html, summary, notes).
If there are no errors, return the original JSON unchanged.
Return ONLY valid JSON, no markdown, no explanation.`;

async function generateFiles(prompt: string): Promise<GenerateSiteResponse> {
  const response = await client.chat.completions.create({
    model: "gpt-4o",
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

    // Compare file contents to detect whether the model made any changes
    const unchanged =
      corrected.files?.length === current.files?.length &&
      (corrected.files ?? []).every((f, i) => f.content === (current.files ?? [])[i]?.content);

    if (unchanged) {
      break;
    }

    current = corrected;
    retries++;
  }

  return current;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt: string = body?.prompt || "";

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in .env.local" },
        { status: 500 }
      );
    }

    if (!prompt.trim()) {
      return NextResponse.json(
        { error: "Missing prompt" },
        { status: 400 }
      );
    }

    let parsed: GenerateSiteResponse;
    try {
      parsed = await generateFiles(prompt);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON from AI" },
        { status: 500 }
      );
    }

    if (!Array.isArray(parsed.files)) {
      parsed.files = [];
    }

    // Self-correction loop (max 2 retries)
    const corrected = await selfCorrect(parsed);

    return NextResponse.json(corrected);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}