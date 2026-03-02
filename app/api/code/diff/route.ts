import { NextResponse } from "next/server";

export const runtime = "nodejs";

type DiffLine = { type: "same" | "add" | "del"; text: string };

function diffLines(a: string, b: string): DiffLine[] {
  const A = a.split(/\r?\n/);
  const B = b.split(/\r?\n/);
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;

  while (i < A.length && j < B.length) {
    if (A[i] === B[j]) {
      out.push({ type: "same", text: A[i] });
      i++;
      j++;
    } else {
      out.push({ type: "del", text: A[i] });
      out.push({ type: "add", text: B[j] });
      i++;
      j++;
    }
  }
  while (i < A.length) out.push({ type: "del", text: A[i++] });
  while (j < B.length) out.push({ type: "add", text: B[j++] });

  return out;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { original, modified } = body;

    if (typeof original !== "string") {
      return NextResponse.json({ error: "original is required" }, { status: 400 });
    }
    if (typeof modified !== "string") {
      return NextResponse.json({ error: "modified is required" }, { status: 400 });
    }

    const diff = diffLines(original, modified);
    const additions = diff.filter((l) => l.type === "add").length;
    const deletions = diff.filter((l) => l.type === "del").length;

    return NextResponse.json({ ok: true, diff, stats: { additions, deletions } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
