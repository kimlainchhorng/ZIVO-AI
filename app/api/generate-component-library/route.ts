import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface ComponentLibraryFile {
  path: string;
  content: string;
  action: "create";
}

export interface GenerateComponentLibraryRequest {
  appName?: string;
  style?: "minimal" | "bold" | "glassmorphism" | "brutal" | "soft";
  components?: string[];
}

export interface GenerateComponentLibraryResponse {
  files: ComponentLibraryFile[];
  summary: string;
  setupInstructions: string;
}

const COMPONENT_LIBRARY_SYSTEM_PROMPT = `You are ZIVO AI — an expert UI engineer specializing in component libraries with React, TypeScript, and Tailwind CSS.

Generate a complete, reusable shadcn/ui-compatible component library.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "setupInstructions": "Step-by-step setup instructions"
}

For each component:
- Use TypeScript props interface with JSDoc comments
- Use Tailwind CSS with cn() utility from "clsx" and "tailwind-merge"
- Support dark mode via "dark:" prefix
- Be ARIA-accessible with proper roles and attributes
- Export named component and its Props type

Always generate these components:
1. components/ui/button.tsx — Button with variants (default, outline, ghost, destructive)
2. components/ui/card.tsx — Card with CardHeader, CardContent, CardFooter subcomponents
3. components/ui/input.tsx — Input with label and error state
4. components/ui/badge.tsx — Badge with color variants
5. components/ui/modal.tsx — Modal/Dialog with backdrop and close button
6. components/ui/table.tsx — Table with sortable headers
7. components/ui/dropdown.tsx — Dropdown menu with items
8. components/ui/toast.tsx — Toast notification component
9. components/ui/avatar.tsx — Avatar with image and fallback initials
10. components/ui/tabs.tsx — Tabs component with content panels
11. lib/utils.ts — cn() utility function combining clsx and tailwind-merge
12. components/ui/index.ts — Barrel export file

Return ONLY valid JSON, no markdown fences, no extra text.`;

const DEFAULT_COMPONENTS = [
  "Button", "Card", "Input", "Badge", "Modal",
  "Table", "Dropdown", "Toast", "Avatar", "Tabs",
];

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
      appName = "My App",
      style = "minimal",
      components = DEFAULT_COMPONENTS,
    }: GenerateComponentLibraryRequest = body;

    const componentList = Array.isArray(components) && components.length > 0
      ? components
      : DEFAULT_COMPONENTS;

    const styleDescriptions: Record<string, string> = {
      minimal: "Clean, minimal design with subtle borders and neutral colors",
      bold: "Bold, high-contrast design with vivid colors and thick borders",
      glassmorphism: "Glass-effect components with blur, transparency, and subtle borders",
      brutal: "Brutalist design with thick black borders, flat colors, and offset shadows",
      soft: "Soft, rounded design with pastel colors and generous padding",
    };

    const userPrompt = `Generate a complete React component library for "${appName}".

Style: ${style} — ${styleDescriptions[style] ?? styleDescriptions.minimal}

Components to generate: ${componentList.join(", ")}

Each component must:
- Have full TypeScript props interface with JSDoc
- Use Tailwind CSS classes for styling
- Support className prop for customization
- Use the cn() utility from lib/utils.ts
- Support dark mode with dark: prefix
- Be fully accessible (ARIA attributes, keyboard navigation where applicable)

Also generate:
- lib/utils.ts with the cn() helper function
- components/ui/index.ts barrel export for all components`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 12000,
      messages: [
        { role: "system", content: COMPONENT_LIBRARY_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateComponentLibraryResponse;
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
