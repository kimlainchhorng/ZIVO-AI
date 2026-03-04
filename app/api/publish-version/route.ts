import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const versionPath = body?.path;

    if (!versionPath || typeof versionPath !== "string") {
      return NextResponse.json({ error: "Path required" }, { status: 400 });
    }

    if (!versionPath.startsWith("/versions/")) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const publicDir = path.join(process.cwd(), "public");
    const sourceFile = path.join(publicDir, versionPath.replace(/^\//, ""));
    const liveFile = path.join(publicDir, "generated.html");

    // ✅ Backup current live before overwrite
    try {
      await fs.copyFile(
        liveFile,
        path.join(publicDir, `backup-${Date.now()}.html`)
      );
    } catch {
      // ignore if no live file yet
    }

    // Copy selected version to live
    await fs.copyFile(sourceFile, liveFile);

    return NextResponse.json({ ok: true, path: "/" }, { status: 200 });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Publish failed" },
      { status: 500 }
    );
  }
}