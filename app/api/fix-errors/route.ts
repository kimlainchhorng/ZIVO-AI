import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { ParsedBuildError } from "../../../lib/types";

export const runtime = "nodejs";

// ─── Parse Vercel / Next.js build log ────────────────────────────────────────
function parseBuildLog(log: string): ParsedBuildError[] {
  const errors: ParsedBuildError[] = [];

  // Type errors: src/foo.ts(12,5): error TS2345: ...
  const tsErrorRegex = /([^\s(]+\.(?:ts|tsx))\((\d+),(\d+)\):\s+error\s+TS\d+:\s+(.+)/g;
  let m: RegExpExecArray | null;
  while ((m = tsErrorRegex.exec(log)) !== null) {
    errors.push({
      type: "type_error",
      file: m[1],
      line: parseInt(m[2], 10),
      column: parseInt(m[3], 10),
      message: m[4],
    });
  }

  // Syntax / import errors: Error: Cannot find module '...'
  const importRegex = /Cannot find module '([^']+)'/g;
  while ((m = importRegex.exec(log)) !== null) {
    errors.push({ type: "import_error", message: `Cannot find module '${m[1]}'` });
  }

  // Build errors: Error: Build failed...
  const buildRegex = /Error:\s+(.+)/g;
  while ((m = buildRegex.exec(log)) !== null) {
    const already = errors.some((e) => e.message === m![1]);
    if (!already) {
      errors.push({ type: "build_error", message: m[1] });
    }
  }

  return errors;
}

// ─── POST /api/fix-errors ─────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const buildLog = typeof body.build_log === "string" ? body.build_log : "";
    const fileContext = typeof body.file_context === "string" ? body.file_context : "";

    if (!buildLog) {
      return NextResponse.json({ error: "build_log is required" }, { status: 400 });
    }

    const parsedErrors = parseBuildLog(buildLog);

    if (parsedErrors.length === 0) {
      return NextResponse.json({
        ok: true,
        errors: [],
        fix_proposals: [],
        message: "No errors detected in build log.",
      });
    }

    // Ask AI to generate fix proposals
    const client = new OpenAI({ apiKey });
    const prompt = `You are a senior developer fixing production build errors.

Build errors:
${JSON.stringify(parsedErrors, null, 2)}

${fileContext ? `Relevant file content:\n${fileContext}` : ""}

For each error, provide:
1. Root cause analysis
2. Concrete fix (code snippet or explanation)
3. File path and line number if applicable

Return JSON: {
  "fixes": [
    {
      "error_index": 0,
      "root_cause": "...",
      "fix": "...",
      "patch": "unified diff or code block",
      "confidence": "high|medium|low"
    }
  ]
}`;

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 2048,
    });

    let fixes: unknown[] = [];
    try {
      const parsed = JSON.parse(response.choices[0]?.message?.content ?? "{}");
      fixes = Array.isArray(parsed.fixes) ? parsed.fixes : [];
    } catch {
      // ignore parse errors
    }

    return NextResponse.json({
      ok: true,
      errors: parsedErrors,
      fixes,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
