/**
 * app/api/preview/status/route.ts
 *
 * GET /api/preview/status?previewId=<uuid>
 * Headers: Authorization: Bearer <token>  (required)
 *
 * Returns the current status of a preview session.
 * Response: { status, url?, logs?, error? }
 *
 * Poll every 2–3 seconds until status === "running" | "failed" | "stopped".
 */

import { NextResponse } from "next/server";
import { extractBearerToken, getUserFromToken } from "@/lib/db/projects-db";
import { getPreviewSession } from "@/lib/preview-store";

export const runtime = "nodejs";

export async function GET(req: Request) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const token = extractBearerToken(req.headers.get("Authorization"));
  if (!token) {
    return NextResponse.json(
      { error: "Authorization header with Bearer token is required" },
      { status: 401 }
    );
  }

  const user = await getUserFromToken(token);
  if (!user) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  // ── Parse query params ────────────────────────────────────────────────────
  const { searchParams } = new URL(req.url);
  const previewId = searchParams.get("previewId");
  if (!previewId) {
    return NextResponse.json({ error: "previewId query parameter is required" }, { status: 400 });
  }

  // ── Look up session ───────────────────────────────────────────────────────
  const session = getPreviewSession(previewId);
  if (!session) {
    return NextResponse.json({ error: "Preview session not found or expired" }, { status: 404 });
  }

  // Ensure the requesting user owns this session
  if (session.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Build response ────────────────────────────────────────────────────────
  return NextResponse.json({
    previewId: session.previewId,
    projectId: session.projectId,
    status: session.status,
    url: session.url ?? undefined,
    logs: session.logs,
    error: session.error ?? undefined,
    startedAt: session.startedAt ?? undefined,
    createdAt: session.createdAt.toISOString(),
  });
}
