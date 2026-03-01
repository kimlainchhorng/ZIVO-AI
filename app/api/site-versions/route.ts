import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET() {
  try {
    const versionsDir = path.join(process.cwd(), "public", "versions");

    let files: string[] = [];
    try {
      files = await fs.readdir(versionsDir);
    } catch {
      return NextResponse.json({ ok: true, versions: [] }, { status: 200 });
    }

    const items = await Promise.all(
      files
        .filter((f) => f.endsWith(".html"))
        .map(async (f) => {
          const full = path.join(versionsDir, f);
          const stat = await fs.stat(full);

          return {
            name: f,
            path: `/versions/${f}`,
            mtime: stat.mtimeMs,
            size: stat.size,
          };
        })
    );

    // newest first
    items.sort((a, b) => b.mtime - a.mtime);

    return NextResponse.json({ ok: true, versions: items }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load versions." },
      { status: 500 }
    );
  }
}