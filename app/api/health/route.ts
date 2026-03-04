export const runtime = "nodejs";

import { NextResponse } from "next/server";

interface ServiceStatus {
  name: string;
  status: "up" | "degraded" | "down";
  latencyMs: number;
  lastChecked: string;
}

interface HealthResponse {
  status: "healthy" | "degraded";
  services: ServiceStatus[];
  uptime: number;
  version: string;
  timestamp: string;
}

const PROCESS_START = Date.now();

export async function GET() {
  try {
    const now = new Date().toISOString();

    const services: ServiceStatus[] = [
      { name: "api", status: "up", latencyMs: 12, lastChecked: now },
      { name: "database", status: "up", latencyMs: 34, lastChecked: now },
      { name: "ai_service", status: "degraded", latencyMs: 1850, lastChecked: now },
      { name: "storage", status: "up", latencyMs: 21, lastChecked: now },
      { name: "cache", status: "up", latencyMs: 4, lastChecked: now },
    ];

    const overallStatus: "healthy" | "degraded" = services.some(
      (s) => s.status === "degraded" || s.status === "down"
    )
      ? "degraded"
      : "healthy";

    const response: HealthResponse = {
      status: overallStatus,
      services,
      uptime: Math.floor((Date.now() - PROCESS_START) / 1000),
      version: "2.4.1",
      timestamp: now,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "Health check failed" }, { status: 500 });
  }
}
