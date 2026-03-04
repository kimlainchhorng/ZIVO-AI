import { NextResponse } from "next/server";
import OpenAI from "openai";
import { stripMarkdownFences } from "@/lib/code-parser";

export const runtime = "nodejs";

export type ComponentType =
  | "hero"
  | "features"
  | "pricing"
  | "testimonials"
  | "navbar"
  | "footer"
  | "dashboard"
  | "auth"
  | "sidebar"
  | "card"
  | "table"
  | "form";

export type ComponentStyle = "minimal" | "modern" | "corporate" | "playful";

export interface ComponentGeneratorRequest {
  componentType: ComponentType;
  appName?: string;
  style?: ComponentStyle;
  colorScheme?: string;
  darkMode?: boolean;
}

export interface GeneratedFile {
  path: string;
  content: string;
  action: "create";
}

export interface ComponentGeneratorResponse {
  files: GeneratedFile[];
  summary: string;
  previewHtml?: string;
}

const VALID_COMPONENT_TYPES: ComponentType[] = [
  "hero", "features", "pricing", "testimonials", "navbar", "footer",
  "dashboard", "auth", "sidebar", "card", "table", "form",
];

const COMPONENT_GENERATOR_SYSTEM_PROMPT = `You are ZIVO AI — an expert React/TypeScript component generator.

Generate a single, self-contained, production-ready React component (TSX) using Tailwind CSS.

Rules:
- Export the component as the default export.
- Include a TypeScript props interface with JSDoc comments.
- Use only Tailwind CSS classes for styling (no inline styles or CSS modules).
- The component must be fully functional, accessible (ARIA labels, semantic HTML, keyboard navigation).
- Include realistic placeholder data — no TODO comments, no lorem ipsum.
- No explicit \`any\` types; use proper TypeScript types.
- Include proper loading, error, and empty states where appropriate.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "components/{ComponentName}.tsx", "content": "...", "action": "create" }
  ],
  "summary": "Brief description of what was generated",
  "previewHtml": "Optional standalone HTML preview string (single self-contained HTML file)"
}

Return ONLY the JSON object. No markdown fences, no extra text.`;

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function GET(): Promise<Response> {
  return NextResponse.json({
    endpoint: "POST /api/component-generator",
    description: "Generate a single production-ready React component",
    body: {
      componentType: VALID_COMPONENT_TYPES,
      appName: "string (optional)",
      style: ["minimal", "modern", "corporate", "playful"],
      colorScheme: "string (optional, e.g. 'blue', '#6366f1')",
      darkMode: "boolean (optional)",
    },
  });
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = (await req.json().catch(() => ({}))) as Partial<ComponentGeneratorRequest>;
    const {
      componentType,
      appName = "My App",
      style = "modern",
      colorScheme = "#6366f1",
      darkMode = true,
    } = body;

    if (!componentType || !VALID_COMPONENT_TYPES.includes(componentType)) {
      return NextResponse.json(
        { error: `Invalid componentType. Must be one of: ${VALID_COMPONENT_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    const userPrompt = `Generate a "${componentType}" component for "${appName}".
Style: ${style}
Color scheme: ${colorScheme}
Dark mode: ${darkMode}

The component should be production-ready with realistic content and full TypeScript typing.`;

    const client = getClient();
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
      max_tokens: 4096,
      messages: [
        { role: "system", content: COMPONENT_GENERATOR_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const rawText = response.choices?.[0]?.message?.content ?? "";
    const cleaned = stripMarkdownFences(rawText);

    let parsed: ComponentGeneratorResponse;
    try {
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : cleaned) as ComponentGeneratorResponse;
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
