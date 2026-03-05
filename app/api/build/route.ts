import { NextResponse } from "next/server";
import { runBuildLoop } from "@/lib/build/run-build";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { files, maxIterations = 5 } = body as {
      files: { path: string; content: string }[];
      maxIterations?: number;
    };

    if (!files || !Array.isArray(files)) {
      return NextResponse.json({ error: "files array required" }, { status: 400 });
    }

    const result = await runBuildLoop(files, maxIterations);

    return NextResponse.json({
      success: result.success,
      finalFiles: result.finalFiles,
      iterations: result.iterations,
      totalFixes: result.totalFixes,
      summary: result.success
        ? `Build passed after ${result.iterations.length} iteration(s) with ${result.totalFixes} auto-fixes`
        : `Build failed after ${result.iterations.length} iteration(s). ${result.iterations[result.iterations.length - 1]?.errors.length ?? 0} errors remain.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
