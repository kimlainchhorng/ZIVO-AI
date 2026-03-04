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

// Memory storage for versions (fallback when Supabase is not configured)
const versions: ProjectVersion[] = [];

const PROJECTS_DIR = path.join(process.cwd(), "projects");
const MAX_VERSIONS_PER_PROJECT = 50;

// Helper function to ensure directory exists
async function ensureProjectsDir() {
  try {
    await fs.mkdir(PROJECTS_DIR, { recursive: true });
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
  }
}

// ─── Supabase helpers ──────────────────────────────────────────────────────────

function getSupabaseConfig(): { url: string; key: string } | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

async function supabaseInsert(
  config: { url: string; key: string },
  version: ProjectVersion
): Promise<void> {
  const res = await fetch(`${config.url}/rest/v1/project_versions`, {
    method: "POST",
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      id: version.id,
      project_id: version.projectId,
      html_content: version.htmlContent,
      metadata: version.metadata ?? null,
      created_at: version.createdAt,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase insert failed: ${text}`);
  }
}

async function supabaseListVersions(
  config: { url: string; key: string },
  projectId: string
): Promise<ProjectVersion[]> {
  const url = new URL(`${config.url}/rest/v1/project_versions`);
  url.searchParams.set("project_id", `eq.${projectId}`);
  url.searchParams.set("order", "created_at.desc");
  url.searchParams.set("limit", String(MAX_VERSIONS_PER_PROJECT));

  const res = await fetch(url.toString(), {
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
    },
  });
  if (!res.ok) return [];
  const rows = await res.json().catch(() => []);
  return (rows as Array<Record<string, unknown>>).map((r) => ({
    id: String(r.id),
    projectId: String(r.project_id),
    htmlContent: String(r.html_content),
    metadata: r.metadata as Record<string, unknown> | undefined,
    createdAt: String(r.created_at),
  }));
}

async function supabaseDeleteVersion(
  config: { url: string; key: string },
  id: string
): Promise<boolean> {
  const res = await fetch(`${config.url}/rest/v1/project_versions?id=eq.${id}`, {
    method: "DELETE",
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
    },
  });
  return res.ok;
}

async function supabaseCountVersions(
  config: { url: string; key: string },
  projectId: string
): Promise<number> {
  const url = new URL(`${config.url}/rest/v1/project_versions`);
  url.searchParams.set("project_id", `eq.${projectId}`);
  url.searchParams.set("select", "id");

  const res = await fetch(url.toString(), {
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      Prefer: "count=exact",
    },
  });
  if (!res.ok) return 0;
  const countHeader = res.headers.get("Content-Range");
  if (countHeader) {
    const match = countHeader.match(/\/(\d+)$/);
    if (match) return parseInt(match[1], 10);
  }
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows.length : 0;
}

async function supabaseDeleteOldestVersions(
  config: { url: string; key: string },
  projectId: string,
  keepCount: number
): Promise<void> {
  // Fetch all versions ordered by created_at asc (oldest first)
  const url = new URL(`${config.url}/rest/v1/project_versions`);
  url.searchParams.set("project_id", `eq.${projectId}`);
  url.searchParams.set("order", "created_at.asc");
  url.searchParams.set("select", "id");

  const res = await fetch(url.toString(), {
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
    },
  });
  if (!res.ok) return;
  const rows = await res.json().catch(() => []) as Array<{ id: string }>;
  const toDelete = rows.slice(0, Math.max(0, rows.length - keepCount + 1));
  for (const row of toDelete) {
    await supabaseDeleteVersion(config, row.id);
  }
}

// ─── In-memory helpers (fallback) ──────────────────────────────────────────────

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

// ─── GET — list versions for a project ────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId query parameter" }, { status: 400 });
    }

    const sbConfig = getSupabaseConfig();
    if (sbConfig) {
      const list = await supabaseListVersions(sbConfig, projectId);
      return NextResponse.json({ versions: list });
    }

    // Fallback: in-memory
    const list = getVersions().filter((v) => v.projectId === projectId);
    return NextResponse.json({ versions: list });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Failed to list versions" },
      { status: 500 }
    );
  }
}

// ─── POST — save a new version ─────────────────────────────────────────────────

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

    const versionId = `${projectId}-${Date.now()}`;
    const version: ProjectVersion = {
      id: versionId,
      projectId,
      htmlContent,
      metadata,
      createdAt: new Date().toISOString(),
    };

    const sbConfig = getSupabaseConfig();

    if (sbConfig) {
      // Enforce version limit in Supabase
      const count = await supabaseCountVersions(sbConfig, projectId);
      if (count >= MAX_VERSIONS_PER_PROJECT) {
        await supabaseDeleteOldestVersions(sbConfig, projectId, MAX_VERSIONS_PER_PROJECT);
      }
      await supabaseInsert(sbConfig, version);
    } else {
      // Fallback: in-memory + local file system
      await ensureProjectsDir();

      // Enforce version limit in memory
      const projectVersions = versions.filter((v) => v.projectId === projectId);
      if (projectVersions.length >= MAX_VERSIONS_PER_PROJECT) {
        // Sort by oldest first and remove excess
        projectVersions.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        const toRemove = projectVersions.slice(0, projectVersions.length - MAX_VERSIONS_PER_PROJECT + 1);
        for (const v of toRemove) {
          deleteVersion(v.id);
        }
      }

      versions.push(version);

      // Save HTML file
      const filePath = path.join(PROJECTS_DIR, `${versionId}.html`);
      await fs.writeFile(filePath, htmlContent, "utf8");
    }

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
      typeof (err as Error)?.message === "string"
        ? (err as Error).message
        : "Failed to save project";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── DELETE — delete a version by ID ──────────────────────────────────────────

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id query parameter" }, { status: 400 });
    }

    const sbConfig = getSupabaseConfig();
    if (sbConfig) {
      const ok = await supabaseDeleteVersion(sbConfig, id);
      if (!ok) {
        return NextResponse.json({ error: "Version not found or delete failed" }, { status: 404 });
      }
    } else {
      const ok = deleteVersion(id);
      if (!ok) {
        return NextResponse.json({ error: "Version not found" }, { status: 404 });
      }
      // Also delete the file if it exists
      try {
        await fs.unlink(path.join(PROJECTS_DIR, `${id}.html`));
      } catch {
        // File may not exist — non-fatal
      }
    }

    return NextResponse.json({ ok: true, message: "Version deleted" });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Failed to delete version" },
      { status: 500 }
    );
  }
}