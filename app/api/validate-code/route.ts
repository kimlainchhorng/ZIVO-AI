import { getOpenAIClient } from "@/lib/openai-client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";


const SYSTEM_PROMPT = `You are a senior code reviewer and security expert. Analyze the provided code for:
1. Syntax errors and TypeScript type errors
2. Security vulnerabilities (SQL injection, XSS, CSRF, insecure dependencies)
3. Performance issues
4. React best practices violations
5. Supabase security issues (missing RLS, exposed keys)
6. Accessibility issues

Return a JSON object:
{
  "valid": true/false,
  "score": 0-100,
  "issues": [
    {
      "severity": "error|warning|info",
      "category": "security|performance|accessibility|style|logic",
      "file": "string",
      "line": null,
      "message": "string",
      "suggestion": "string"
    }
  ],
  "summary": "string"
}`;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { code, filename } = body;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY in .env.local" }, { status: 500 });
    }
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Missing code to validate" }, { status: 400 });
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
      parsed = { raw: text, valid: false };
    }

    return NextResponse.json({ ok: true, result: parsed });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Validation failed" }, { status: 500 });
  }
}
