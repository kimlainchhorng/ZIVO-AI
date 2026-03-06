import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    description:
      "SLA management API. Accepts { service: string, uptime: number, responseTime: number } and returns a structured SLA configuration document.",
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      service?: string;
      uptime?: number;
      responseTime?: number;
    };

    const { service, uptime, responseTime } = body;

    if (!service || uptime === undefined || responseTime === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: service, uptime, and responseTime" },
        { status: 400 }
      );
    }

    if (typeof uptime !== "number" || uptime < 0 || uptime > 100) {
      return NextResponse.json(
        { error: "uptime must be a number between 0 and 100" },
        { status: 400 }
      );
    }

    if (typeof responseTime !== "number" || responseTime < 0) {
      return NextResponse.json(
        { error: "responseTime must be a non-negative number (milliseconds)" },
        { status: 400 }
      );
    }

    const downtimeMinutesPerMonth = ((100 - uptime) / 100) * 30 * 24 * 60;

    const slaConfig = {
      service,
      slo: {
        uptime: {
          target: uptime,
          unit: "percent",
          measurementWindow: "30d",
          allowedDowntimeMinutesPerMonth: Math.round(downtimeMinutesPerMonth * 100) / 100,
        },
        responseTime: {
          target: responseTime,
          unit: "milliseconds",
          percentile: "p99",
        },
      },
      penalties: {
        uptimeBelow99: "10% service credit",
        uptimeBelow95: "25% service credit",
        uptimeBelow90: "50% service credit",
      },
      monitoring: {
        checkInterval: "60s",
        alertThreshold: uptime - 1,
        notificationChannels: ["email", "slack", "pagerduty"],
      },
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ slaConfig });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
