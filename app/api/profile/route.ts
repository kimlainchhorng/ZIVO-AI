import { NextResponse } from "next/server";
import OpenAI from "openai";
import { stripMarkdownFences } from "../../../lib/code-parser";

export const runtime = "nodejs";

interface GeneratedFile {
  path: string;
  content: string;
}

interface PerformanceIssue {
  file: string;
  type: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  line?: number;
}

interface ProfileResult {
  issues: PerformanceIssue[];
  recommendations: string[];
  estimatedImpact: string;
}

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { files, type = "rendering" } = body as {
      files?: unknown;
      type?: "bundle-size" | "rendering" | "database" | "api";
    };

    if (!Array.isArray(files)) {
      return NextResponse.json({ error: "files must be an array" }, { status: 400 });
    }
    for (const f of files) {
      if (!f || typeof (f as GeneratedFile).path !== "string" || typeof (f as GeneratedFile).content !== "string") {
        return NextResponse.json(
          { error: "Each file must have path (string) and content (string)" },
          { status: 400 }
        );
      }
    }

    const fileArray = files as GeneratedFile[];
    const filesSummary = fileArray
      .slice(0, 6)
      .map((f) => `// ${f.path}\n${f.content.slice(0, 800)}`)
      .join("\n\n---\n\n");

    const typeGuide: Record<string, string> = {
      "bundle-size": "Focus on: large imports, missing tree-shaking, barrel exports, synchronous imports that should be dynamic.",
      "rendering": "Focus on: unnecessary re-renders, missing React.memo/useMemo/useCallback, layout thrashing, blocking operations in render.",
      "database": "Focus on: N+1 queries, missing indexes, full table scans, unoptimized joins, missing pagination.",
      "api": "Focus on: slow endpoints, missing caching, synchronous bottlenecks, missing parallel fetching, over-fetching.",
    };

    const prompt = `Analyze these files for ${type} performance issues.
${typeGuide[type] ?? ""}

Return a JSON object:
{
  "issues": [{"file":"...","type":"...","description":"...","severity":"critical|high|medium|low","line":null}],
  "recommendations": ["recommendation1", ...],
  "estimatedImpact": "Summary of estimated performance improvement"
}

Files:\n${filesSummary}\n\nRespond ONLY with the JSON object.`;

    const completion = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 2048,
      messages: [
        { role: "system", content: "You are a performance optimization expert. Identify concrete, actionable performance bottlenecks." },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let result: ProfileResult = { issues: [], recommendations: [], estimatedImpact: "" };
    try {
      result = JSON.parse(stripMarkdownFences(raw)) as ProfileResult;
    } catch {
      result.recommendations = [raw];
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
