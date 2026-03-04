import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface BrandFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateBrandRequest {
  appName?: string;
  description?: string;
  industry?: string;
  style?: "modern" | "minimal" | "bold" | "playful";
}

export interface GenerateBrandResponse {
  files: BrandFile[];
  summary: string;
  colorPalette: Array<{ name: string; hex: string }>;
  fonts: Array<{ role: string; name: string }>;
}

const BRAND_SYSTEM_PROMPT = `You are ZIVO AI — an expert brand identity designer.

Generate a complete brand kit for a web application.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "colorPalette": [
    { "name": "Primary", "hex": "#4f46e5" },
    { "name": "Secondary", "hex": "#7c3aed" }
  ],
  "fonts": [
    { "role": "Heading", "name": "Inter" },
    { "role": "Body", "name": "Inter" }
  ]
}

Always include:
- public/brand/logo.svg — SVG logo
- app/globals.css updates with CSS variables
- BRAND.md — Brand guidelines document
- lib/brand.ts — Brand token exports

Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const body = await req.json() as GenerateBrandRequest;
    const {
      appName = "My App",
      description = "A modern web application",
      industry = "Technology",
      style = "modern",
    } = body;

    const userPrompt = `Generate a brand kit for "${appName}".
Description: ${description}
Industry: ${industry}
Style: ${style}

Include logo SVG, color palette, font pairing, and brand guidelines.`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.4,
      max_tokens: 4096,
      messages: [
        { role: "system", content: BRAND_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateBrandResponse;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json(
          { error: "AI did not return valid JSON" },
          { status: 502 }
        );
      }
      parsed = JSON.parse(match[0]);
    }

    if (!Array.isArray(parsed.files)) {
      return NextResponse.json(
        { error: "Invalid response structure: missing files array" },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
