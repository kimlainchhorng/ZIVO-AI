import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/preview/status
 * Returns the current preview status.
 * Since previews are generated on-demand (not long-running processes),
 * this always reports "idle" — the client manages its own state.
 */
export async function GET() {
  return NextResponse.json({ status: "idle" });
}
