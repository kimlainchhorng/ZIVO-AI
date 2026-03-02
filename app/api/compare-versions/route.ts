import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

function safePath(urlPath: string) {
  if (urlPath === "/generated.html") {
    return path.join(process.cwd(), "public", "generated.html");
  }

  if (urlPath.startsWith("/versions/")) {
    const file = urlPath.replace("/versions/", "");

    if (file.includes("..") || file.includes("/") || file.includes("\\")) {
      throw new Error("Invalid version path");
    }

    return path.join(process.cwd(), "public", "versions", file);
  }

  throw new Error("Invalid path");
}

function diffLines(a: string, b: string) {
  const A = a.split(/\r?\n/);
  const B = b.split(/\r?\n/);

  const out: { type: "same" | "add" | "del"; text: string }[] = [];

  let i = 0, j = 0;

  while (i < A.length && j < B.length) {
    if (A[i] === B[j]) {
      out.push({ type: "same", text: A[i] });
      i++; j++;
    } else {
      out.push({ type: "del", text: A[i] });
      out.push({ type: "add", text: B[j] });
      i++; j++;
    }
  }

  while (i < A.length) {
    out.push({ type: "del", text: A[i++] });
  }

  while (j < B.length) {
    out.push({ type: "add", text: B[j++] });
  }

  return out;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const a = String(body?.a || "");
    const b = String(body?.b || "");

    const fileA = safePath(a);
    const fileB = safePath(b);

    const [htmlA, htmlB] = await Promise.all([
      fs.readFile(fileA, "utf8"),
      fs.readFile(fileB, "utf8"),
    ]);

    const diff = diffLines(htmlA, htmlB);

    return NextResponse.json({ ok: true, diff }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Compare failed";
    return NextResponse.json(
      { error: msg },
      { status: 400 }
    );
  }
}
