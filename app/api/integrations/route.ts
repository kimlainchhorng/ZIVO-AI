import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const INTEGRATIONS = [
  // Productivity
  { id: "slack", name: "Slack", category: "productivity" },
  { id: "jira", name: "Jira", category: "productivity" },
  { id: "notion", name: "Notion", category: "productivity" },
  { id: "github", name: "GitHub", category: "devtools" },
  { id: "gitlab", name: "GitLab", category: "devtools" },
  // CRM
  { id: "salesforce", name: "Salesforce", category: "crm" },
  { id: "hubspot", name: "HubSpot", category: "crm" },
  // Finance
  { id: "quickbooks", name: "QuickBooks", category: "finance" },
  { id: "xero", name: "Xero", category: "finance" },
  // HR
  { id: "workday", name: "Workday", category: "hr" },
  { id: "bamboohr", name: "BambooHR", category: "hr" },
  // Compliance
  { id: "drata", name: "Drata", category: "compliance" },
  { id: "vanta", name: "Vanta", category: "compliance" },
  // Legal
  { id: "legalzoom", name: "LegalZoom", category: "legal" },
  // Monitoring
  { id: "datadog", name: "Datadog", category: "monitoring" },
  { id: "pagerduty", name: "PagerDuty", category: "monitoring" },
  { id: "sentry", name: "Sentry", category: "monitoring" },
];

/**
 * Integrations Library API
 * GET  /api/integrations  – list available integrations
 * POST /api/integrations  – connect a new integration
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const filtered = category
    ? INTEGRATIONS.filter((i) => i.category === category)
    : INTEGRATIONS;

  return NextResponse.json({ ok: true, integrations: filtered, total: filtered.length });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { tenantId, integrationId, credentials } = body as {
    tenantId?: string;
    integrationId?: string;
    credentials?: Record<string, string>;
  };

  if (!tenantId || !integrationId) {
    return NextResponse.json({ error: "tenantId and integrationId required" }, { status: 400 });
  }

  const found = INTEGRATIONS.find((i) => i.id === integrationId);
  if (!found) {
    return NextResponse.json({ error: "Unknown integration" }, { status: 400 });
  }

  if (!credentials || Object.keys(credentials).length === 0) {
    return NextResponse.json({ error: "credentials required" }, { status: 400 });
  }

  // TODO: validate credentials, store encrypted, test connection
  return NextResponse.json({
    ok: true,
    connection: {
      id: crypto.randomUUID(),
      tenantId,
      integration: found,
      status: "connected",
      connectedAt: new Date().toISOString(),
    },
  });
}
