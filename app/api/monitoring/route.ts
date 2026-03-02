import { NextResponse } from "next/server";

const SERVICES = [
  { name: "AI Engine", baseUptime: 99.98, baseResponse: 42 },
  { name: "Search Index", baseUptime: 99.95, baseResponse: 18 },
  { name: "ML Pipeline", baseUptime: 99.87, baseResponse: 210 },
  { name: "Database", baseUptime: 99.99, baseResponse: 8 },
  { name: "CDN", baseUptime: 100.0, baseResponse: 3 },
  { name: "API Gateway", baseUptime: 99.96, baseResponse: 12 },
];

function jitter(base: number, pct = 0.1): number {
  return Math.round(base * (1 + (Math.random() - 0.5) * pct * 2) * 10) / 10;
}

function serviceStatus(uptime: number): "healthy" | "degraded" | "down" {
  if (uptime >= 99.9) return "healthy";
  if (uptime >= 99.0) return "degraded";
  return "down";
}

export async function GET() {
  const services = SERVICES.map((svc) => {
    const uptime = parseFloat(jitter(svc.baseUptime, 0.001).toFixed(2));
    return {
      name: svc.name,
      status: serviceStatus(uptime),
      uptime,
      responseTime: Math.round(jitter(svc.baseResponse, 0.3)),
    };
  });

  return NextResponse.json({
    cpu: Math.round(jitter(42, 0.4)),
    memory: Math.round(jitter(67, 0.2)),
    apiLatency: Math.round(jitter(38, 0.5)),
    errorRate: parseFloat(jitter(0.12, 0.5).toFixed(2)),
    services,
  });
}
