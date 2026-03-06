import { NextResponse } from "next/server";
import { fixFile } from "@/agents/code-fixer";
import { FixErrorsRequestSchema, BuildError } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const parsed = FixErrorsRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const { files, errors, iteration, broadFix } = parsed.data;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is missing" }, { status: 500 });
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
          broadFix,
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
