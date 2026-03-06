import { NextResponse } from "next/server";
import { indexFiles, getFileGraph, type GeneratedFile } from "../../../lib/repo-indexer";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { files } = body as { files: unknown };

    if (!Array.isArray(files)) {
      return NextResponse.json({ error: "files must be an array" }, { status: 400 });
    }
    for (const f of files) {
      if (!f || typeof (f as GeneratedFile).path !== "string" || typeof (f as GeneratedFile).content !== "string") {
        return NextResponse.json(
          { error: "Each file must have path (string) and content (string)" },
          { status: 400 }
        );
      }
    }

    const index = indexFiles(files as GeneratedFile[]);
    const fileGraph = getFileGraph(index);

    // Convert Maps to plain objects for JSON serialization
    const symbols: Record<string, unknown> = {};
    index.symbols.forEach((v, k) => { symbols[k] = v; });
    const importsObj: Record<string, string[]> = {};
    index.imports.forEach((v, k) => { importsObj[k] = v; });
    const exportsObj: Record<string, string[]> = {};
    index.exports.forEach((v, k) => { exportsObj[k] = v; });

    return NextResponse.json({
      index: { symbols, imports: importsObj, exports: exportsObj },
      fileGraph,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
