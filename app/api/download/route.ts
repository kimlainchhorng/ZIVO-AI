import { NextResponse } from "next/server";
import JSZip from "jszip";

export const runtime = "nodejs";

interface FileEntry {
  path: string;
  content: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const files: FileEntry[] = body?.files;

    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "files array is required" },
        { status: 400 }
      );
    }

    for (const f of files) {
      if (!f.path || typeof f.path !== "string" || typeof f.content !== "string") {
        return NextResponse.json(
          { error: "Each file must have path (string) and content (string)" },
          { status: 400 }
        );
      }
    }

    const zip = new JSZip();

    for (const file of files) {
      zip.file(file.path, file.content);
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    const uint8 = new Uint8Array(zipBuffer);

    return new Response(uint8, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="zivo-generated.zip"',
        "Content-Length": String(uint8.byteLength),
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
