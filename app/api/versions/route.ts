import { NextResponse } from "next/server";
import { versionHistory } from "../../../lib/version-history";

export const runtime = "nodejs";

interface VersionFile {
  path: string;
  content: string;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId query parameter is required" }, { status: 400 });
  }

  const versions = versionHistory.getVersions(projectId);
  return NextResponse.json({ versions });
}

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { projectId, files, label } = body as {
      projectId?: string;
      files?: unknown;
      label?: string;
    };

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }
    if (!Array.isArray(files)) {
      return NextResponse.json({ error: "files must be an array" }, { status: 400 });
    }
    for (const f of files) {
      if (!f || typeof (f as VersionFile).path !== "string" || typeof (f as VersionFile).content !== "string") {
        return NextResponse.json(
          { error: "Each file must have path (string) and content (string)" },
          { status: 400 }
        );
      }
    }

    const version = versionHistory.snapshot(projectId, files as VersionFile[], label);
    return NextResponse.json({ version }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { action, projectId, versionId, v1Id, v2Id } = body as {
      action: "rollback" | "diff";
      projectId: string;
      versionId?: string;
      v1Id?: string;
      v2Id?: string;
    };

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    if (action === "rollback") {
      if (!versionId) {
        return NextResponse.json({ error: "versionId is required for rollback" }, { status: 400 });
      }
      try {
        const files = versionHistory.rollback(projectId, versionId);
        return NextResponse.json({ files });
      } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 404 });
      }
    }

    if (action === "diff") {
      if (!v1Id || !v2Id) {
        return NextResponse.json({ error: "v1Id and v2Id are required for diff" }, { status: 400 });
      }
      try {
        const diffs = versionHistory.diff(projectId, v1Id, v2Id);
        return NextResponse.json({ diffs });
      } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 404 });
      }
    }

    return NextResponse.json({ error: "action must be rollback or diff" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
