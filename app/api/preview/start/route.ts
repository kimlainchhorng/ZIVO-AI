/**
 * app/api/preview/start/route.ts
 *
 * POST /api/preview/start
 * Body: { projectId: string }
 * Headers: Authorization: Bearer <token>  (required)
 *
 * Verifies the user owns the project, fetches its files from Supabase,
 * kicks off an async preview build in an isolated container, and returns
 * { previewId }.
 *
 * The caller should then poll GET /api/preview/status?previewId=<id> until
 * status === "running" to get the preview URL.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  extractBearerToken,
  getUserFromToken,
  getProjectById,
  getProjectFiles,
} from "@/lib/db/projects-db";
import {
  createPreviewSession,
  listUserPreviewSessions,
  updatePreviewSession,
} from "@/lib/preview-store";
import { startPreview } from "@/lib/preview-runner";

export const runtime = "nodejs";

const RequestSchema = z.object({
  projectId: z.string().uuid(),
});

/** Maximum simultaneous previews per user. */
const MAX_PREVIEWS_PER_USER = 3;

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

  const { projectId } = parsed.data;

  // ── Verify project ownership ──────────────────────────────────────────────
  const project = await getProjectById(token, projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (project.owner_user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Rate-limit: cap concurrent previews per user ──────────────────────────
  const existing = listUserPreviewSessions(user.id);
  if (existing.length >= MAX_PREVIEWS_PER_USER) {
    return NextResponse.json(
      {
        error: `You already have ${existing.length} active preview(s). Stop one before starting a new one.`,
        activePreviewIds: existing.map((s) => s.previewId),
      },
      { status: 429 }
    );
  }

  // ── Fetch project files ───────────────────────────────────────────────────
  let files: Array<{ path: string; content: string }>;
  try {
    const dbFiles = await getProjectFiles(token, projectId);
    files = dbFiles.map((f) => ({ path: f.path, content: f.content }));
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to fetch project files",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }

  if (files.length === 0) {
    return NextResponse.json(
      { error: "Project has no files. Generate the website first." },
      { status: 422 }
    );
  }

  // ── Create session & kick off async build ─────────────────────────────────
  const session = createPreviewSession(projectId, user.id);

  // Fire-and-forget: build runs in the background; client polls for status.
  void startPreview(session, files).catch((err) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[preview/start] Unhandled runner error for ${session.previewId}:`, message);
    // Ensure the session reflects the failure so the client can see it via /status.
    updatePreviewSession(session.previewId, { status: "failed", error: message });
  });

  return NextResponse.json({ previewId: session.previewId }, { status: 202 });
}
