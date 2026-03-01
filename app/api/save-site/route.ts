import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const html = body?.html;

    if (!html || typeof html !== "string") {
      return NextResponse.json(
        { error: "Invalid HTML content" },
        { status: 400 }
      );
    }

    const publicDir = path.join(process.cwd(), "public");
    const versionsDir = path.join(publicDir, "versions");

    await fs.mkdir(publicDir, { recursive: true });
    await fs.mkdir(versionsDir, { recursive: true });

    // Save main generated file
    const mainPath = path.join(publicDir, "generated.html");
    await fs.writeFile(mainPath, html, "utf8");

    // Save version copy
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-");

    const versionFile = `backup-${timestamp}.html`;
    const versionPath = path.join(versionsDir, versionFile);

    await fs.writeFile(versionPath, html, "utf8");

    // ✅ CLEANUP OLD VERSIONS (keep 10 newest)
    const files = await fs.readdir(versionsDir);

    const full = await Promise.all(
      files.map(async (f) => ({
        name: f,
        full: path.join(versionsDir, f),
        stat: await fs.stat(path.join(versionsDir, f)),
      }))
    );

    full.sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);

    if (full.length > 10) {
      const toDelete = full.slice(10);
      for (const f of toDelete) {
        await fs.unlink(f.full);
      }
    }

    return NextResponse.json(
      { ok: true, path: "/generated.html" },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Save failed" },
      { status: 500 }
    );
  }
}
}