import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const LIVE_FILE = path.join(process.cwd(), "public", "live.json");

export async function GET() {
  try {
    const raw = await fs.readFile(LIVE_FILE, "utf8").catch(() => "");
    if (!raw) return NextResponse.json({ ok: true, path: "" }, { status: 200 });

    const data = JSON.parse(raw);
    return NextResponse.json(
      { ok: true, path: typeof data?.path === "string" ? data.path : "" },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to read live version." },
      { status: 500 }
    );
  }
}