import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Metrics & Monitoring API
 * GET  /api/metrics  – real-time platform metrics
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");
  const period = searchParams.get("period") ?? "1h";

  return NextResponse.json({
    ok: true,
    tenantId,
    period,
    metrics: {
      requests: { total: 0, errored: 0, p50Ms: 0, p99Ms: 0 },
      generations: { total: 0, succeeded: 0, failed: 0, avgDurationMs: 0 },
      activeUsers: 0,
      cpuPercent: 0,
      memoryPercent: 0,
    },
    collectedAt: new Date().toISOString(),
  });
}
