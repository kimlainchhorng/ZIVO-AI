import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface ThemeFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateThemeRequest {
  name?: string;
  primaryColor?: string;
  style?: "minimal" | "bold" | "playful" | "professional" | "dark";
  fontFamily?: string;
}

export interface GenerateThemeResponse {
  files: ThemeFile[];
  tokens: Record<string, unknown>;
  summary: string;
}

const THEME_SYSTEM_PROMPT = `You are ZIVO AI — a design systems expert.

Generate a complete design system and theme configuration for a Next.js + Tailwind CSS project.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "tokens": { "colors": {}, "typography": {}, "spacing": {} },
  "summary": "Brief description"
}

Always generate:
1. tailwind.config.ts — Full design tokens (colors, typography, spacing, radii, shadows, animations)
2. app/globals.css — CSS custom properties (--color-primary, etc.)
3. tokens.json — Design tokens in W3C format
4. components/ui/design-tokens.ts — TypeScript constants for all tokens

Color palette must include:
- primary, secondary, accent
- neutrals (50–950 scale)
- semantic: success, warning, error, info
- dark/light mode variants

Typography scale: xs(12px), sm(14px), base(16px), lg(18px), xl(20px), 2xl(24px), 3xl(30px), 4xl(36px)
Spacing: 4px base grid (1=4px, 2=8px, 3=12px, 4=16px, 6=24px, 8=32px, 12=48px, 16=64px)

Return ONLY valid JSON, no markdown fences.`;

export async function POST(req: Request): Promise<Response> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      name = "ZIVO Theme",
      primaryColor = "#6366f1",
      style = "professional",
      fontFamily = "Inter",
    }: GenerateThemeRequest = body;

    const userPrompt = `Generate a complete design system for: "${name}"
Primary color: ${primaryColor}
Style: ${style}
Font family: ${fontFamily}

Generate a cohesive color palette, typography scale, spacing system, and all Tailwind config tokens.`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
      max_tokens: 6000,
      messages: [
        { role: "system", content: THEME_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateThemeResponse;
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
