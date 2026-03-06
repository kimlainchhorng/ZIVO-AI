// app/api/visual-to-code/route.ts — Convert VisualEditor canvas elements to React code

import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { CanvasElement } from "@/components/VisualEditor/types";

export const runtime = "nodejs";

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function GET() {
  return NextResponse.json({
    description: "Visual to Code — POST { elements: CanvasElement[] } to generate a React component",
  });
}

export async function POST(req: Request): Promise<Response> {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { elements } = body as { elements?: CanvasElement[] };

  if (!Array.isArray(elements) || elements.length === 0) {
    return NextResponse.json({ error: "elements array is required" }, { status: 400 });
  }

  const systemPrompt = `You are a React/Tailwind CSS expert. Convert a visual canvas element tree into a single, fully working React functional component.

Return ONLY a valid JSON object (no markdown fences):
{
  "code": "full React component code string",
  "filename": "MyComponent.tsx"
}

Rules:
- Use TypeScript
- Use Tailwind CSS for all styling
- Map element types: button→<button>, card→<div className="rounded-xl border">, navbar→<nav>, etc.
- Use the label as text content
- Apply styles from the element's styles object as Tailwind classes where possible
- Export as default function`;

  const elementsJson = JSON.stringify(elements, null, 2);

  try {
    const client = getClient();
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 4096,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Convert these canvas elements to a React component:\n${elementsJson}` },
      ],
    });

    const rawText = response.choices?.[0]?.message?.content ?? "";
    let parsed: { code: string; filename: string };
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText) as { code: string; filename: string };
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    return NextResponse.json({ code: parsed.code ?? "", filename: parsed.filename ?? "Component.tsx" });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message ?? "Failed to generate code" },
      { status: 500 }
    );
  }
}
