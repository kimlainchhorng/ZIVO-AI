import { NextResponse } from "next/server";
import { getVersions } from "../save-site/versions-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const allVersions = getVersions();
    const latest = allVersions.length > 0 ? allVersions[0] : null;
    return NextResponse.json({ item: latest });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to fetch version";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}