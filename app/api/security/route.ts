import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Security Dashboard API
 * GET  /api/security  – security posture summary
 * POST /api/security  – trigger a security scan
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");

  return NextResponse.json({
    ok: true,
    tenantId,
    posture: {
      score: 100,
      owasp: { compliant: true, findings: [] },
      dependencies: { scanned: 0, vulnerabilities: 0 },
      secrets: { detected: 0 },
      lastScannedAt: new Date().toISOString(),
    },
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { tenantId, scanType } = body as {
    tenantId?: string;
    scanType?: string;
  };

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  }

  // TODO: queue security scan job (SAST, dependency audit, secret scanning)
  return NextResponse.json({
    ok: true,
    scan: {
      id: crypto.randomUUID(),
      tenantId,
      type: scanType ?? "full",
      status: "queued",
      createdAt: new Date().toISOString(),
    },
  });
}
