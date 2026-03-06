/**
 * GET /api/projects/[id]/export.zip
 *
 * Streams a ZIP archive of all current project_files.
 *
 * Auth: Bearer token required. Caller must own the project.
 *
 * Returns: application/zip binary stream
 */

import { NextResponse } from "next/server";
import JSZip from "jszip";
import {
  extractBearerToken,
  getUserFromToken,
  getProjectById,
  getProjectFiles,
} from "@/lib/db/projects-db";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  const { id: projectId } = await params;

  // ── Auth ──────────────────────────────────────────────────────────────────
  const token = extractBearerToken(req.headers.get("Authorization"));
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await getUserFromToken(token);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Ownership check ────────────────────────────────────────────────────────
  const project = await getProjectById(token, projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (project.owner_user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Load files ─────────────────────────────────────────────────────────────
  const files = await getProjectFiles(token, projectId);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files to export" }, { status: 422 });
  }

  // ── Build ZIP ──────────────────────────────────────────────────────────────
  const zip = new JSZip();
  for (const file of files) {
    // Normalise path: strip leading slash if any
    const normalised = file.path.replace(/^\/+/, "");
    zip.file(normalised, file.content, { binary: false });
  }

  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const slug = project.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "project";

  return new Response(new Uint8Array(zipBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${slug}.zip"`,
      "Content-Length": String(zipBuffer.length),
    },
  });
}
