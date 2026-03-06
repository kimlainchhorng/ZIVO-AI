import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface VisualizeArchRequest {
  files: Array<{ path: string; content: string }>;
  diagramType?: "component-tree" | "data-flow" | "api-routes" | "dependency-graph" | "all";
}

export interface VisualizeArchResponse {
  diagrams: Array<{
    type: string;
    title: string;
    mermaid: string;
    description: string;
  }>;
  summary: string;
}

const VISUALIZE_ARCH_SYSTEM_PROMPT = `You are a software architecture expert specializing in Next.js and React.

Analyze the provided file structure and generate Mermaid diagrams.

Respond ONLY with a valid JSON object:
{
  "diagrams": [
    {
      "type": "component-tree" | "data-flow" | "api-routes" | "dependency-graph",
      "title": "Diagram title",
      "mermaid": "graph TD\\n  A --> B",
      "description": "What this diagram shows"
    }
  ],
  "summary": "Architecture overview"
}

Diagram types to generate:
1. component-tree: React component hierarchy (graph TD)
2. data-flow: State and props flow between components (flowchart LR)
3. api-routes: All API routes with HTTP methods (graph TD)
4. dependency-graph: Module import relationships (graph LR)

Rules for Mermaid syntax:
- Use valid Mermaid 11.x syntax
- Wrap node labels with special chars in quotes: A["label (text)"]
- Keep diagrams readable (max 20 nodes per diagram)
- Use subgraphs for grouping related components

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
    const { files = [], diagramType = "all" }: VisualizeArchRequest = body;

    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "Missing or empty files array" },
        { status: 400 }
      );
    }

    const fileContext = files
      .slice(0, 30) // Limit to avoid token overflow
      .map((f) => `// ${f.path}\n${f.content.slice(0, 300)}`)
      .join("\n\n");

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 4096,
      messages: [
        { role: "system", content: VISUALIZE_ARCH_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Generate ${diagramType === "all" ? "all diagram types" : `a ${diagramType} diagram`} for:\n\n${fileContext}`,
        },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: VisualizeArchResponse;
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

    if (!Array.isArray(parsed.diagrams)) {
      return NextResponse.json(
        { error: "Invalid response structure: missing diagrams array" },
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
