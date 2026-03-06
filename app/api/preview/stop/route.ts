import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * POST /api/preview/stop
 * Signals the client to stop the current preview.
 * Since previews are generated on-demand (not long-running processes),
 * this is a no-op on the server — the client clears its preview state.
 */
export async function POST() {
  return NextResponse.json({ status: "stopped" });
}
