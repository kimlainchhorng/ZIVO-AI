import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Cache Management API
 * GET  /api/cache  – fetch cache statistics
 * DELETE /api/cache  – invalidate cache keys
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const namespace = searchParams.get("namespace");

  return NextResponse.json({
    ok: true,
    namespace,
    stats: {
      hits: 0,
      misses: 0,
      hitRate: 0,
      memoryUsedMb: 0,
      keys: 0,
    },
  });
}

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { namespace, pattern } = body as { namespace?: string; pattern?: string };

  if (!namespace && !pattern) {
    return NextResponse.json({ error: "namespace or pattern required" }, { status: 400 });
  }

  // TODO: run cache invalidation against Redis cluster
  return NextResponse.json({
    ok: true,
    invalidated: { namespace, pattern, keysDeleted: 0, at: new Date().toISOString() },
  });
}
