import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Documentation System API
 * GET  /api/docs  – list generated documentation artifacts
 * POST /api/docs  – trigger auto-generation for a project
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  return NextResponse.json({
    ok: true,
    projectId,
    docs: [],
    total: 0,
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { projectId, types } = body as {
    projectId?: string;
    types?: string[];
  };

  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const requestedTypes = types ?? ["api", "architecture", "deployment", "changelog"];

  // TODO: run documentation generation pipeline (JSDoc, OpenAPI, Mermaid diagrams)
  return NextResponse.json({
    ok: true,
    job: {
      id: crypto.randomUUID(),
      projectId,
      types: requestedTypes,
      status: "queued",
      createdAt: new Date().toISOString(),
    },
  });
}
