import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY environment variable is not set");
  return new OpenAI({ apiKey });
}

export interface ColorScale {
  light: string;
  DEFAULT: string;
  dark: string;
}

export interface DesignSystem {
  name: string;
  colors: {
    primary: ColorScale;
    secondary: ColorScale;
    accent: ColorScale;
    background: ColorScale;
    foreground: ColorScale;
    muted: ColorScale;
    border: ColorScale;
  };
  fonts: {
    sans: string;
    mono: string;
    heading: string;
  };
  borderRadius: string;
  tailwindConfig: string;
  cssVariables: string;
}

const DESIGN_SYSTEM_PROMPT = `You are a professional UI/UX designer specializing in design systems.
Given a project description, generate a complete design system.
Return ONLY valid JSON matching this schema exactly:
{
  "name": "Design system name",
  "colors": {
    "primary":    { "light": "#hex", "DEFAULT": "#hex", "dark": "#hex" },
    "secondary":  { "light": "#hex", "DEFAULT": "#hex", "dark": "#hex" },
    "accent":     { "light": "#hex", "DEFAULT": "#hex", "dark": "#hex" },
    "background": { "light": "#hex", "DEFAULT": "#hex", "dark": "#hex" },
    "foreground": { "light": "#hex", "DEFAULT": "#hex", "dark": "#hex" },
    "muted":      { "light": "#hex", "DEFAULT": "#hex", "dark": "#hex" },
    "border":     { "light": "#hex", "DEFAULT": "#hex", "dark": "#hex" }
  },
  "fonts": {
    "sans": "Inter, system-ui, sans-serif",
    "mono": "'JetBrains Mono', monospace",
    "heading": "Cal Sans, Inter, sans-serif"
  },
  "borderRadius": "0.5rem",
  "tailwindConfig": "// tailwind.config.ts extend section as a JSON string",
  "cssVariables": "/* CSS custom properties string */"
}`;

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({})) as { prompt?: string; style?: string };
    const { prompt = "modern SaaS application", style = "modern" } = body;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is missing" }, { status: 500 });
    }

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.4,
      max_tokens: 2048,
      messages: [
        { role: "system", content: DESIGN_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Generate a design system for: "${prompt}". Style preference: ${style}. Include both light and dark color variants.`,
        },
      ],
    });

    const raw = response.choices?.[0]?.message?.content ?? "{}";
    const match = raw.match(/\{[\s\S]*\}/);
    try {
      const parsed = JSON.parse(match ? match[0] : raw) as DesignSystem;
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({ error: "Failed to parse design system" }, { status: 502 });
    }
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error)?.message ?? "Server error" }, { status: 500 });
  }
}
