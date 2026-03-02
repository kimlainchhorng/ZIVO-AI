import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Reporting Engine API
 * GET  /api/reporting  – list saved reports
 * POST /api/reporting  – generate a new report
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");

  return NextResponse.json({
    ok: true,
    tenantId,
    reports: [],
    total: 0,
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { tenantId, name, type, filters, format, schedule } = body as {
    tenantId?: string;
    name?: string;
    type?: string;
    filters?: Record<string, unknown>;
    format?: string;
    schedule?: string;
  };

  if (!tenantId || !name || !type) {
    return NextResponse.json({ error: "tenantId, name and type required" }, { status: 400 });
  }

  // TODO: enqueue report generation job, deliver via email/Slack on completion
  return NextResponse.json({
    ok: true,
    report: {
      id: crypto.randomUUID(),
      tenantId,
      name,
      type,
      filters,
      format: format ?? "json",
      schedule,
      status: "generating",
      createdAt: new Date().toISOString(),
    },
  });
}
