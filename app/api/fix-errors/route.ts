import { NextResponse } from "next/server";
import { fixFile } from "@/agents/code-fixer";

export const runtime = "nodejs";

export interface FixFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface BuildError {
  file?: string;
  line?: number;
  message: string;
  type: "typescript" | "eslint" | "runtime" | "missing-import";
}

export interface FixErrorsRequest {
  files: FixFile[];
  errors: BuildError[];
  iteration?: number;
}

export interface FixErrorsResponse {
  files: FixFile[];
  fixed: number;
  summary: string;
  iterations: number;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const files: FixFile[] = Array.isArray(body?.files) ? body.files : [];
    const errors: BuildError[] = Array.isArray(body?.errors) ? body.errors : [];
    const iteration: number = typeof body?.iteration === "number" ? body.iteration : 0;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is missing" }, { status: 500 });
    }
    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    if (!errors.length) {
      return NextResponse.json({
        files,
        fixed: 0,
        summary: "No errors to fix",
        iterations: iteration,
      });
    }

    // Group errors by file
    const errorsByFile = new Map<string, BuildError[]>();
    for (const err of errors) {
      const filePath = err.file ?? "unknown";
      if (!errorsByFile.has(filePath)) errorsByFile.set(filePath, []);
      errorsByFile.get(filePath)!.push(err);
    }

    // Build project context (truncated) for cross-file awareness
    const projectContext = files
      .slice(0, 5)
      .map((f) => `// ${f.path}\n${f.content.slice(0, 300)}`)
      .join("\n\n");

    // Fix each affected file
    const fixedFiles = [...files];
    let fixedCount = 0;

    for (const [filePath, fileErrors] of errorsByFile.entries()) {
      const fileIndex = fixedFiles.findIndex((f) => f.path === filePath);
      if (fileIndex === -1) continue;

      const file = fixedFiles[fileIndex];
      try {
        const result = await fixFile({
          file: file.path,
          content: file.content,
          issues: fileErrors.map((e) => ({
            line: e.line,
            message: e.message,
            rule: e.type,
          })),
          projectContext,
        });

        fixedFiles[fileIndex] = {
          ...file,
          content: result.fixedContent,
          action: "update",
        };
        fixedCount++;
      } catch {
        // Continue with next file if one fix fails
      }
    }

    return NextResponse.json({
      files: fixedFiles,
      fixed: fixedCount,
      summary: `Fixed ${fixedCount} file(s) with ${errors.length} error(s) in iteration ${iteration + 1}`,
      iterations: iteration + 1,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
