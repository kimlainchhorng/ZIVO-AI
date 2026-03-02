import { NextResponse } from "next/server";
import { getProjectById } from "../projects/route";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { projectId } = body;

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    const project = getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Build the file manifest
    const manifest = Object.entries(project.files).map(([path, content]) => ({
      path,
      size: Buffer.byteLength(content, "utf8"),
    }));

    // Return project files as JSON for client-side ZIP creation
    return NextResponse.json({
      ok: true,
      projectName: project.name,
      files: project.files,
      manifest,
      totalFiles: manifest.length,
      instructions: [
        "Download the project files and create a ZIP archive.",
        "Run: npm install",
        "Copy .env.local.example to .env.local and fill in your Supabase credentials.",
        "Run: npm run dev to start the development server.",
        "Apply database migrations in the supabase/migrations folder.",
      ],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Export failed" }, { status: 500 });
  }
}
