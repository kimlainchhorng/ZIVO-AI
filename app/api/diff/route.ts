import { NextResponse } from "next/server";
import { computeDiff, applyPatch, summarizeChanges } from "../../../lib/diff";

export const runtime = "nodejs";

// POST /api/diff
// Body: { action: "diff"|"patch"|"summary", before?, after?, patch?, files? }
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    if (action === "diff") {
      const { before, after, path: filePath = "file" } = body;
      if (typeof before !== "string" || typeof after !== "string") {
        return NextResponse.json(
          { error: "before and after strings are required" },
          { status: 400 }
        );
      }
      const diff = computeDiff(before, after, filePath);
      return NextResponse.json({ ok: true, diff });
    }

    if (action === "patch") {
      const { source, patch } = body;
      if (typeof source !== "string" || typeof patch !== "string") {
        return NextResponse.json(
          { error: "source and patch strings are required" },
          { status: 400 }
        );
      }
      const result = applyPatch(source, patch);
      return NextResponse.json({ ok: true, result });
    }

    if (action === "summary") {
      const { files } = body;
      if (!Array.isArray(files)) {
        return NextResponse.json({ error: "files array is required" }, { status: 400 });
      }
      const summary = summarizeChanges(files);
      return NextResponse.json({ ok: true, summary });
    }

    return NextResponse.json(
      { error: "action must be 'diff', 'patch', or 'summary'" },
      { status: 400 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
