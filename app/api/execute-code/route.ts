import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Safe code execution sandbox using Node.js vm module
// No file system or network access — only standard JS execution

export interface ExecuteCodeRequest {
  code: string;
  language: "javascript" | "typescript";
  timeout?: number;
}

export interface ExecuteCodeResponse {
  output: string;
  error?: string;
  executionTime: number;
  success: boolean;
}

const MAX_TIMEOUT_MS = 10_000;
const DEFAULT_TIMEOUT_MS = 5_000;

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      code,
      language = "javascript",
      timeout = DEFAULT_TIMEOUT_MS,
    }: ExecuteCodeRequest = body;

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json(
        { error: "Missing or empty code" },
        { status: 400 }
      );
    }

    if (language !== "javascript" && language !== "typescript") {
      return NextResponse.json(
        { error: "Unsupported language. Use 'javascript' or 'typescript'" },
        { status: 400 }
      );
    }

    const safeTimeout = Math.min(Math.max(100, timeout), MAX_TIMEOUT_MS);

    // Dynamically import vm to avoid bundling issues
    const { runInNewContext } = await import("vm");

    const logs: string[] = [];
    const sandbox = {
      console: {
        log: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
        error: (...args: unknown[]) => logs.push(`[error] ${args.map(String).join(" ")}`),
        warn: (...args: unknown[]) => logs.push(`[warn] ${args.map(String).join(" ")}`),
        info: (...args: unknown[]) => logs.push(`[info] ${args.map(String).join(" ")}`),
      },
      Math,
      Date,
      JSON,
      Array,
      Object,
      String,
      Number,
      Boolean,
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
      setTimeout: undefined,
      setInterval: undefined,
      fetch: undefined,
      process: undefined,
      require: undefined,
      __dirname: undefined,
      __filename: undefined,
    };

    const startTime = Date.now();
    let output = "";
    let error: string | undefined;
    let success = false;

    try {
      // Strip TypeScript type annotations for basic TS support
      let execCode = code;
      if (language === "typescript") {
        // Remove type annotations (basic stripping — not a full TS compiler)
        execCode = code
          .replace(/:\s*\w+(\[\])?(\s*\|[^=,\);\n]+)*/g, "")
          .replace(/<[^>]+>/g, "")
          .replace(/^(export\s+)?(interface|type)\s+[^{]+\{[^}]*\}/gm, "");
      }

      const result = runInNewContext(execCode, sandbox, {
        timeout: safeTimeout,
        displayErrors: true,
      });

      output = logs.join("\n");
      if (result !== undefined) {
        output = output ? `${output}\n${String(result)}` : String(result);
      }
      success = true;
    } catch (err: unknown) {
      error = (err as Error)?.message ?? "Runtime error";
      output = logs.join("\n");
    }

    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      output: output || "",
      error,
      executionTime,
      success,
    } satisfies ExecuteCodeResponse);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
