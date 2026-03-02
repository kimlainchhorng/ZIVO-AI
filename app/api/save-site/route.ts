import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Define the shape of our project data
interface ProjectVersion {
  id: string;
  projectId: string;
  htmlContent: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// Memory storage for versions (in production, use a database)
const versions: ProjectVersion[] = [];

const PROJECTS_DIR = path.join(process.cwd(), "projects");

// Helper function to ensure directory exists
async function ensureProjectsDir() {
  try {
    await fs.mkdir(PROJECTS_DIR, { recursive: true });
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
  }
}

// Get all versions
export function getVersions(): ProjectVersion[] {
  return [...versions].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// Delete a version
export function deleteVersion(id: string): boolean {
  const index = versions.findIndex(v => v.id === id);
  if (index !== -1) {
    versions.splice(index, 1);
    return true;
  }
  return false;
}

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
    const version: ProjectVersion = {
      id: versionId,
      projectId,
      htmlContent,
      metadata,
      createdAt: new Date().toISOString(),
    };

    // Add to versions array
    versions.push(version);

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
      err instanceof Error
        ? err.message
        : "Failed to save project";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}