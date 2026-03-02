import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { addVersion, getVersions, deleteVersion } from "@/lib/versions";

export type { ProjectVersion } from "@/lib/versions";

const PROJECTS_DIR = path.join(process.cwd(), "projects");

// Helper function to ensure directory exists
async function ensureProjectsDir() {
  try {
    await fs.mkdir(PROJECTS_DIR, { recursive: true });
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
  }
}

// Re-export for backward compatibility with existing routes
export { getVersions, deleteVersion };

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    // Destructure parameters
    const { projectId, htmlContent, metadata } = body || {};

    // Validation
    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        { error: "Project ID is required and must be a string" },
        { status: 400 }
      );
    }

    if (!htmlContent || typeof htmlContent !== "string") {
      return NextResponse.json(
        { error: "HTML content is required and must be a string" },
        { status: 400 }
      );
    }

    // Ensure directory exists
    await ensureProjectsDir();

    // Create version entry
    const versionId = `${projectId}-${Date.now()}`;
    const version = {
      id: versionId,
      projectId,
      htmlContent,
      metadata,
      createdAt: new Date().toISOString(),
    };

    // Add to shared version store
    addVersion(version);

    // Save HTML file
    const filePath = path.join(PROJECTS_DIR, `${versionId}.html`);
    await fs.writeFile(filePath, htmlContent, "utf8");

    return NextResponse.json(
      {
        ok: true,
        versionId,
        message: "Site saved successfully!",
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Failed to save project";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}