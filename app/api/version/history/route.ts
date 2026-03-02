import { NextResponse } from "next/server";
import { getVersions } from "../../save-site/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const versions = getVersions();
    return NextResponse.json({ ok: true, versions });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
