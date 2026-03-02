import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface Alert {
  id: string;
  severity: "info" | "warning" | "critical";
  message: string;
  service: string;
  triggeredAt: string;
  resolved: boolean;
}

export async function GET() {
  return NextResponse.json({
    uptime: {
      last24h: 99.98,
      last7d: 99.95,
      last30d: 99.91,
      currentStatus: "operational",
    },
    performance: {
      avgResponseTimeMs: 142,
      p95ResponseTimeMs: 380,
      p99ResponseTimeMs: 720,
      requestsPerMinute: 4200,
    },
    errors: {
      rate: 0.12,
      total24h: 302,
      top: [
        { code: 500, count: 18, endpoint: "/api/generate-site" },
        { code: 429, count: 142, endpoint: "/api/chat" },
        { code: 404, count: 142, endpoint: "various" },
      ],
    },
    alerts: [
      {
        id: "AL-001",
        severity: "warning",
        message: "Elevated p99 latency on /api/chat",
        service: "api",
        triggeredAt: "2025-07-10T11:05:00.000Z",
        resolved: false,
      },
      {
        id: "AL-002",
        severity: "info",
        message: "Scheduled maintenance in 48 hours",
        service: "infrastructure",
        triggeredAt: "2025-07-10T09:00:00.000Z",
        resolved: false,
      },
      {
        id: "AL-003",
        severity: "critical",
        message: "Database connection pool exhausted",
        service: "database",
        triggeredAt: "2025-07-09T22:15:00.000Z",
        resolved: true,
      },
    ] satisfies Alert[],
    services: [
      { name: "API", status: "operational" },
      { name: "Database", status: "operational" },
      { name: "Auth", status: "operational" },
      { name: "Storage", status: "degraded" },
    ],
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { severity, message, service } = body as {
      severity?: Alert["severity"];
      message?: string;
      service?: string;
    };
    if (!message || !service) {
      return NextResponse.json(
        { error: "Missing required fields: message, service" },
        { status: 400 }
      );
    }
    const alert: Alert = {
      id: `AL-${Date.now()}`,
      severity: severity ?? "info",
      message,
      service,
      triggeredAt: new Date().toISOString(),
      resolved: false,
    };
    return NextResponse.json(alert, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
