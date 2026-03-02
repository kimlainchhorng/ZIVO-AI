import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Plugin System v2 API
 * GET  /api/plugins-v2  – browse the plugin marketplace
 * POST /api/plugins-v2  – register / publish a new plugin
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const query = searchParams.get("q");

  // TODO: query plugin registry database
  return NextResponse.json({
    ok: true,
    plugins: [],
    total: 0,
    filters: { category, query },
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { name, description, version, entrypoint, authorId } = body as {
    name?: string;
    description?: string;
    version?: string;
    entrypoint?: string;
    authorId?: string;
  };

  if (!name || !version || !entrypoint || !authorId) {
    return NextResponse.json(
      { error: "name, version, entrypoint and authorId required" },
      { status: 400 }
    );
  }

  // TODO: run security scan, store in registry, trigger review workflow
  return NextResponse.json({
    ok: true,
    plugin: {
      id: crypto.randomUUID(),
      name,
      description,
      version,
      entrypoint,
      authorId,
      status: "pending_review",
      publishedAt: null,
      createdAt: new Date().toISOString(),
    },
  });
}
