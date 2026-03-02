import { getOpenAIClient } from "@/lib/openai-client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";


const SYSTEM_PROMPT = `You are an expert React + TypeScript + Tailwind CSS developer. Generate reusable, accessible UI components.

Return a JSON object with this structure:
{
  "components": [
    {
      "name": "string",
      "filename": "string",
      "description": "string",
      "code": "// Full TypeScript React component code",
      "props": [{ "name": "string", "type": "string", "required": false, "description": "string" }],
      "usage": "// Example usage"
    }
  ]
}

Always:
- Use TypeScript interfaces for all props
- Apply Tailwind CSS for styling
- Follow WCAG accessibility guidelines (aria labels, roles, keyboard navigation)
- Include dark mode support with dark: Tailwind variants
- Make components responsive with mobile-first approach
- Export as named exports`;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { prompt, componentTypes } = body;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY in .env.local" }, { status: 500 });
    }
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const userMessage = [
      `Generate React UI components for: ${prompt}`,
      componentTypes?.length ? `Component types needed: ${componentTypes.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const r = await getOpenAIClient().responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    });

    const text = (r as any).output_text ?? "";

    let parsed: any = null;
    try {
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\})/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[1] : text);
    } catch {
      parsed = { raw: text };
    }

    return NextResponse.json({ ok: true, result: parsed });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Component generation failed" }, { status: 500 });
  }
}
