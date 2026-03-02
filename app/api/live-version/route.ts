import { NextResponse } from "next/server";
import { getVersions } from "../save-site/route";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const allVersions = getVersions();
    const latest = allVersions.length > 0 ? allVersions[0] : null;
    return NextResponse.json({ item: latest });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to fetch version";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}