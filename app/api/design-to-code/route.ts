import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

interface CanvasElement {
  id: string;
  type: string;
  label: string;
  styles: Record<string, string>;
  children?: CanvasElement[];
  props?: Record<string, string>;
}

interface DesignToCodeBody {
  elements: CanvasElement[];
  framework?: "nextjs" | "react" | "vue" | "html";
}

interface DesignToCodeResult {
  code: string;
  framework: string;
  tailwindClasses: string[];
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
  }

  const body: DesignToCodeBody = await req.json().catch(() => ({} as DesignToCodeBody));
  const { elements = [], framework = "nextjs" } = body;

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are an expert React/TypeScript developer. Convert visual design JSON to production-ready code. Return JSON with: code (the generated code string), framework (target framework), tailwindClasses (array of Tailwind classes used).",
      },
      {
        role: "user",
        content: `Convert the following design JSON to ${framework} code:\n\n${JSON.stringify(elements, null, 2)}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const result: DesignToCodeResult = JSON.parse(raw);

  return NextResponse.json({
    code: result.code ?? "",
    framework: result.framework ?? framework,
    tailwindClasses: result.tailwindClasses ?? [],
  });
}
