import { NextResponse } from "next/server";
import { getVersions } from "../save-site/versions-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const allVersions = getVersions();
    return NextResponse.json({ items: allVersions });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to fetch versions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}