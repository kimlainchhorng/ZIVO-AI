import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ErrorCategory = "build" | "runtime" | "lint" | "type" | "test" | "deploy";

interface ParsedError {
  message: string;
  file_path?: string;
  line_number?: number;
  category: ErrorCategory;
  stack_trace?: string;
}

function parseErrorLogs(logs: string): ParsedError[] {
  const errors: ParsedError[] = [];
  const lines = logs.split("\n");

  for (const line of lines) {
    // Build errors: "Error: ..." or "error TS1234:"
    const tsMatch = line.match(/error TS\d+: (.+)/);
    const buildMatch = line.match(/^Error: (.+)/);
    const fileMatch = line.match(/at (.+):(\d+):\d+/);
    const nextMatch = line.match(/\.\/([\w/.-]+\.(?:ts|tsx|js|jsx))\s*\((\d+),/);

    if (tsMatch) {
      errors.push({
        message: tsMatch[1],
        category: "type",
        file_path: nextMatch?.[1],
        line_number: nextMatch ? parseInt(nextMatch[2]) : undefined,
      });
    } else if (buildMatch) {
      errors.push({
        message: buildMatch[1],
        category: "build",
        file_path: fileMatch?.[1],
        line_number: fileMatch ? parseInt(fileMatch[2]) : undefined,
      });
    }
  }

  return errors;
}

// POST /api/error-fix
// Body: { logs: string, projectContext?: object }
export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const { logs, projectContext } = body;

    if (!logs || typeof logs !== "string") {
      return NextResponse.json({ error: "logs string is required" }, { status: 400 });
    }

    const parsedErrors = parseErrorLogs(logs);

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const contextStr = projectContext
      ? `\n\nProject context:\n${JSON.stringify(projectContext, null, 2)}`
      : "";

    const r = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: `You are an expert error-fixing agent. Analyze build/runtime errors and provide:
1. Root cause analysis
2. Specific file patches to fix each error (use \`\`\`file:path format)
3. Step-by-step fix instructions
4. Verification steps

Always produce complete, working fixes.`,
        },
        {
          role: "user",
          content: `Analyze and fix these errors:\n\nRaw logs:\n${logs}\n\nParsed errors:\n${JSON.stringify(parsedErrors, null, 2)}${contextStr}`,
        },
      ],
    } as Parameters<typeof client.responses.create>[0]);

    const analysis = (r as { output_text?: string }).output_text ?? "";

    return NextResponse.json({
      ok: true,
      parsed_errors: parsedErrors,
      analysis,
      error_count: parsedErrors.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
