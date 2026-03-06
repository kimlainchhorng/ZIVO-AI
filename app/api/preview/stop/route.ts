/**
 * app/api/preview/stop/route.ts
 *
 * POST /api/preview/stop
 * Body: { previewId: string }
 * Headers: Authorization: Bearer <token>  (required)
 *
 * Stops the running container / process for the given preview session,
 * releases its allocated port, and marks it as "stopped".
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { extractBearerToken, getUserFromToken } from "@/lib/db/projects-db";
import { getPreviewSession } from "@/lib/preview-store";
import { stopPreview } from "@/lib/preview-runner";

export const runtime = "nodejs";

const RequestSchema = z.object({
  previewId: z.string().uuid(),
});

export async function POST(req: Request) {
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

  // ── Validate body ─────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { previewId } = parsed.data;

  // ── Look up session ───────────────────────────────────────────────────────
  const session = getPreviewSession(previewId);
  if (!session) {
    return NextResponse.json(
      { error: "Preview session not found or already expired" },
      { status: 404 }
    );
  }

  if (session.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (session.status === "stopped") {
    return NextResponse.json({ message: "Preview is already stopped", previewId });
  }

  // ── Stop container / process ──────────────────────────────────────────────
  await stopPreview(session);

  return NextResponse.json({ message: "Preview stopped", previewId });
}
