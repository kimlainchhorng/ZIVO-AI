import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface SaasFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateSaasRequest {
  appName: string;
  description?: string;
  features?: string[];
  multiTenant?: boolean;
  tenantIsolation?: "rls" | "schema" | "database";
  authProvider?: "supabase" | "next-auth" | "clerk";
}

export interface GenerateSaasResponse {
  files: SaasFile[];
  summary: string;
  setupInstructions: string;
  requiredEnvVars: string[];
}

const SAAS_SYSTEM_PROMPT = `You are ZIVO AI — an expert full-stack SaaS developer specializing in multi-tenant architectures.

Generate a complete, production-ready multi-tenant SaaS application for a Next.js App Router project.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "setupInstructions": "Step-by-step setup instructions",
  "requiredEnvVars": ["VAR_NAME=description"]
}

Always include for multi-tenant SaaS:
- lib/tenant/context.ts — Tenant context provider and hooks
- lib/tenant/middleware.ts — Tenant resolution from subdomain/header/query
- app/[tenant]/dashboard/page.tsx — Tenant-scoped dashboard
- app/api/tenant/route.ts — CRUD API for tenant management
- supabase/migrations/001_rls_policies.sql — Row-level security policies
- app/onboarding/page.tsx — Tenant onboarding wizard
- components/TenantSwitcher.tsx — Organization/workspace switcher
- middleware.ts — Subdomain routing and tenant resolution

For tenant isolation, use Row-Level Security (RLS) in Postgres/Supabase.
Include subdomain routing ({tenant}.yoursaas.com) and tenant onboarding flow.
Add role management: owner, admin, member, viewer.

Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request): Promise<NextResponse> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    let body: GenerateSaasRequest;
    try {
      body = await req.json() as GenerateSaasRequest;
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    if (!body.appName) {
      return NextResponse.json({ error: "appName is required" }, { status: 400 });
    }

    const {
      appName,
      description = "",
      features = [],
      multiTenant = true,
      tenantIsolation = "rls",
      authProvider = "supabase",
    } = body;

    const userPrompt = `Generate a complete multi-tenant SaaS application named "${appName}".
${description ? `Description: ${description}` : ""}
${features.length ? `Features: ${features.join(", ")}` : ""}
Multi-tenant: ${multiTenant}
Tenant isolation strategy: ${tenantIsolation}
Auth provider: ${authProvider}

Include:
1. Tenant context provider (lib/tenant/context.ts)
2. Tenant middleware for subdomain routing (lib/tenant/middleware.ts)
3. Tenant dashboard page (app/[tenant]/dashboard/page.tsx)
4. Tenant API routes with CRUD (app/api/tenant/route.ts)
5. Supabase RLS migration (supabase/migrations/001_rls_policies.sql)
6. Tenant onboarding wizard (app/onboarding/page.tsx)
7. Next.js middleware for subdomain resolution (middleware.ts)
8. Landing page with pricing (app/page.tsx)`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 8192,
      messages: [
        { role: "system", content: SAAS_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateSaasResponse;
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
