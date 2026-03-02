import { NextResponse } from "next/server";
import type { DiffLine, PatchFile, PatchHunk } from "../../../lib/types";

export const runtime = "nodejs";

// ─── Line diff ───────────────────────────────────────────────────────────────
function diffLines(a: string, b: string): DiffLine[] {
  const linesA = a.split(/\r?\n/);
  const linesB = b.split(/\r?\n/);
  const out: DiffLine[] = [];
  let i = 0, j = 0;

  while (i < linesA.length && j < linesB.length) {
    if (linesA[i] === linesB[j]) {
      out.push({ type: "same", text: linesA[i], line_a: i + 1, line_b: j + 1 });
      i++; j++;
    } else {
      out.push({ type: "del", text: linesA[i], line_a: i + 1 });
      out.push({ type: "add", text: linesB[j], line_b: j + 1 });
      i++; j++;
    }
  }
  while (i < linesA.length) out.push({ type: "del", text: linesA[i++], line_a: i });
  while (j < linesB.length) out.push({ type: "add", text: linesB[j++], line_b: j });

  return out;
}

// ─── Unified patch ───────────────────────────────────────────────────────────
function buildPatch(path: string, before: string, after: string): PatchFile {
  const diffResult = diffLines(before, after);
  const hunks: PatchHunk[] = [];
  let hunk: PatchHunk | null = null;
  let lineA = 0, lineB = 0;

  for (const line of diffResult) {
    if (line.type !== "same") {
      if (!hunk) {
        hunk = { start_a: lineA + 1, count_a: 0, start_b: lineB + 1, count_b: 0, lines: [] };
      }
      hunk.lines.push(line);
      if (line.type === "del") hunk.count_a++;
      else hunk.count_b++;
    } else {
      if (hunk) {
        hunks.push(hunk);
        hunk = null;
      }
    }
    if (line.type !== "add") lineA++;
    if (line.type !== "del") lineB++;
  }
  if (hunk) hunks.push(hunk);

  return { path, hunks };
}

// ─── POST /api/diff ───────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const before = typeof body.before === "string" ? body.before : "";
    const after  = typeof body.after  === "string" ? body.after  : "";
    const path   = typeof body.path   === "string" ? body.path   : "file";

    const diff  = diffLines(before, after);
    const patch = buildPatch(path, before, after);

    const added   = diff.filter((l) => l.type === "add").length;
    const deleted = diff.filter((l) => l.type === "del").length;

    return NextResponse.json({ ok: true, diff, patch, stats: { added, deleted } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Diff failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
