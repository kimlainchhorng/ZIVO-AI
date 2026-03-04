import { NextResponse } from "next/server";
import { getVersions } from "../save-site/route";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const allVersions = getVersions();
    return NextResponse.json({ items: allVersions });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to fetch versions" }, { status: 500 });
  }
}