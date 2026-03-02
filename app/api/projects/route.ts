import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Project Management API
 * GET  /api/projects  – list projects for a tenant
 * POST /api/projects  – create a new project
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");

  return NextResponse.json({
    ok: true,
    tenantId,
    projects: [],
    total: 0,
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { tenantId, name, description, templateId } = body as {
    tenantId?: string;
    name?: string;
    description?: string;
    templateId?: string;
  };

  if (!tenantId || !name) {
    return NextResponse.json({ error: "tenantId and name required" }, { status: 400 });
  }

  // TODO: scaffold project from template, create initial kanban board and git repo
  return NextResponse.json({
    ok: true,
    project: {
      id: crypto.randomUUID(),
      tenantId,
      name,
      description,
      templateId,
      status: "active",
      createdAt: new Date().toISOString(),
    },
  });
}
