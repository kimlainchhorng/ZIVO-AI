import { getOpenAIClient } from "@/lib/openai-client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";


const SYSTEM_PROMPT = `You are a performance optimization expert for React and Next.js applications. Analyze the provided code and suggest optimizations.

Return a JSON object:
{
  "optimizedCode": "string (the improved code)",
  "changes": [
    {
      "type": "code-splitting|lazy-loading|memoization|query-optimization|bundle-size|rendering",
      "description": "string",
      "impact": "high|medium|low"
    }
  ],
  "estimatedImprovement": "string",
  "summary": "string"
}

Focus on:
- React.memo, useMemo, useCallback for preventing re-renders
- Code splitting with React.lazy and Suspense
- Image optimization
- Bundle size reduction
- Database query optimization
- Caching strategies
- Removing unused imports and dead code`;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { code, filename } = body;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY in .env.local" }, { status: 500 });
    }
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Missing code to optimize" }, { status: 400 });
    }

    const userMessage = [
      filename ? `File: ${filename}` : "",
      `Code:\n\`\`\`\n${code}\n\`\`\``,
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
    return NextResponse.json({ error: err?.message || "Optimization failed" }, { status: 500 });
  }
}
