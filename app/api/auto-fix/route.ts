import { NextResponse } from "next/server";
import { validateFiles, type ValidationIssue } from "../../../agents/validator";
import { fixFile } from "../../../agents/code-fixer";

export const runtime = "nodejs";

interface AutoFixFile {
  path: string;
  content: string;
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

    const { files, maxIterations = 5 } = body as {
      files: unknown;
      maxIterations?: number;
    };

    if (!Array.isArray(files)) {
      return NextResponse.json({ error: "files must be an array" }, { status: 400 });
    }
    for (const f of files) {
      if (!f || typeof (f as AutoFixFile).path !== "string" || typeof (f as AutoFixFile).content !== "string") {
        return NextResponse.json(
          { error: "Each file must have path (string) and content (string)" },
          { status: 400 }
        );
      }
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const currentFiles: AutoFixFile[] = (files as AutoFixFile[]).map((f) => ({ ...f }));
        let iteration = 0;
        const clampedMax = Math.min(Math.max(1, maxIterations as number), 10);

        while (iteration < clampedMax) {
          iteration++;
          const validation = validateFiles(currentFiles);

          // Emit iteration event
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                iteration,
                valid: validation.valid,
                issueCount: validation.issues.length,
                summary: validation.summary,
              }) + "\n"
            )
          );

          if (validation.valid) break;

          // Fix files with errors
          const fileIssues = new Map<string, ValidationIssue[]>();
          for (const issue of validation.issues) {
            if (!fileIssues.has(issue.file)) fileIssues.set(issue.file, []);
            fileIssues.get(issue.file)!.push(issue);
          }

          for (const [filePath, issues] of fileIssues) {
            const file = currentFiles.find((f) => f.path === filePath);
            if (!file) continue;
            try {
              const fixResult = await fixFile({
                file: filePath,
                content: file.content,
                issues: issues.map((i) => ({ line: i.line, message: i.message, rule: i.rule })),
              });
              file.content = fixResult.fixedContent;
            } catch {
              // Continue fixing other files even if one fails
            }
          }
        }

        const finalValidation = validateFiles(currentFiles);
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              done: true,
              fixedFiles: currentFiles,
              iterations: iteration,
              remainingIssues: finalValidation.issues,
            }) + "\n"
          )
        );
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
