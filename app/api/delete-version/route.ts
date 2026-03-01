import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const versionPath = body?.path;

    if (!versionPath || typeof versionPath !== "string") {
      return NextResponse.json({ error: "Invalid path." }, { status: 400 });
    }

    const publicDir = path.join(process.cwd(), "public");
    const cleanPath = versionPath.startsWith("/")
      ? versionPath.slice(1)
      : versionPath;

    if (!cleanPath.startsWith("versions/")) {
      return NextResponse.json({ error: "Not allowed." }, { status: 403 });
    }

    await fs.unlink(path.join(publicDir, cleanPath));
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Delete failed." },
      { status: 500 }
    );
  }
}