import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // TODO: Fetch from Supabase
    // For now, return empty list

    return NextResponse.json({ items: [] });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to fetch versions" },
      { status: 500 }
    );
  }
}