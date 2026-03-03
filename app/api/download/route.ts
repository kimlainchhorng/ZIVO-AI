import { NextResponse } from "next/server";
import JSZip from "jszip";

export const runtime = "nodejs";

export interface DownloadFile {
  path: string;
  content: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const files: DownloadFile[] = body?.files;

    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "files array is required and must not be empty" },
        { status: 400 }
      );
    }

    const zip = new JSZip();

    for (const file of files) {
      if (file.path && typeof file.content === "string") {
        // Prevent path traversal attacks by stripping all .. and absolute path segments
        const safePath = file.path
          .split(/[/\\]+/)
          .filter((seg) => seg !== ".." && seg !== "." && seg !== "")
          .join("/");
        if (safePath) {
          zip.file(safePath, file.content);
        }
      }
    }

    const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });

    return new Response(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="zivo-app.zip"',
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
