import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface StatusPageFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateStatusPageRequest {
  appName?: string;
  services?: string[];
  uptimeProvider?: "custom" | "betterstack" | "upptime";
  notifications?: Array<"email" | "sms" | "slack" | "webhook">;
  historyDays?: number;
}

export interface GenerateStatusPageResponse {
  files: StatusPageFile[];
  summary: string;
  setupInstructions: string;
  requiredEnvVars: string[];
}

const STATUS_PAGE_SYSTEM_PROMPT = `You are ZIVO AI — an expert in uptime monitoring and status page systems for Next.js.

Generate a complete public status page and health monitoring system for a Next.js App Router project.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "setupInstructions": "Step-by-step setup instructions",
  "requiredEnvVars": ["VAR_NAME=description"]
}

Always include:
- app/status/page.tsx — Public status page with service health indicators
- app/api/health/route.ts — Health check endpoint for all services
- app/api/incidents/route.ts — Incident management CRUD API
- app/api/status/subscribe/route.ts — Subscribe to status updates
- components/StatusIndicator.tsx — Service status badge (operational/degraded/down)
- components/UptimeGraph.tsx — Historical uptime visualization (90-day bar chart)
- components/IncidentTimeline.tsx — Incident history timeline
- lib/monitoring/health-checks.ts — Health check functions for DB, Redis, APIs
- lib/monitoring/uptime.ts — Uptime calculation and history

Include service health checks: database, Redis, external APIs.
Show historical uptime percentage (99.99% style) and incident history.

Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request): Promise<NextResponse> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    let body: GenerateStatusPageRequest;
    try {
      body = await req.json() as GenerateStatusPageRequest;
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }
    const {
      appName = "My App",
      services = ["API", "Database", "CDN", "Auth"],
      uptimeProvider = "custom",
      notifications = ["email", "slack"],
      historyDays = 90,
    } = body;

    const userPrompt = `Generate a public status page and health monitoring system for "${appName}".
Services to monitor: ${services.join(", ")}
Uptime provider: ${uptimeProvider}
Notification channels: ${notifications.join(", ")}
History period: ${historyDays} days

Generate:
1. Public status page (app/status/page.tsx)
2. Health check endpoint (app/api/health/route.ts) for: ${services.join(", ")}
3. Incident management API (app/api/incidents/route.ts)
4. Status update subscription (app/api/status/subscribe/route.ts)
5. StatusIndicator component (components/StatusIndicator.tsx)
6. Uptime graph (components/UptimeGraph.tsx) showing ${historyDays} days
7. Incident timeline (components/IncidentTimeline.tsx)
8. Health check functions (lib/monitoring/health-checks.ts)
9. Uptime tracking (lib/monitoring/uptime.ts)
10. Scheduled health checks (lib/monitoring/scheduler.ts)`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 8192,
      messages: [
        { role: "system", content: STATUS_PAGE_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateStatusPageResponse;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json(
          { error: "AI did not return valid JSON" },
          { status: 502 }
        );
      }
      parsed = JSON.parse(match[0]);
    }

    if (!Array.isArray(parsed.files)) {
      return NextResponse.json(
        { error: "Invalid response structure: missing files array" },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
