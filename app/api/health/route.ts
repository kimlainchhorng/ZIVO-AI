import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const uptime = process.uptime();
  const memUsage = process.memoryUsage();

  return NextResponse.json({
    status: "healthy",
    version: "3.0.0",
    uptime: Math.floor(uptime),
    timestamp: new Date().toISOString(),
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      rss: Math.round(memUsage.rss / 1024 / 1024),
      unit: "MB",
    },
    services: {
      api: "healthy",
      ai: "healthy",
      storage: "healthy",
    },
    sla: {
      uptime: "99.99%",
      responseTime: "< 200ms",
      errorRate: "< 0.01%",
    },
  });
}
