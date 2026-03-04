import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface AdminFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateAdminRequest {
  appName?: string;
  features?: Array<
    | "user-management"
    | "content-management"
    | "audit-log"
    | "feature-flags"
    | "analytics"
    | "revenue"
    | "email-templates"
    | "all"
  >;
  authProvider?: "supabase" | "next-auth" | "clerk";
}

export interface GenerateAdminResponse {
  files: AdminFile[];
  summary: string;
  setupInstructions: string;
  requiredEnvVars: string[];
}

const ADMIN_SYSTEM_PROMPT = `You are ZIVO AI — an expert in building admin panels and back-office tools for Next.js.

Generate a complete, full-featured admin panel for a Next.js App Router project.

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
- app/admin/page.tsx — Admin overview/dashboard
- app/admin/users/page.tsx — User management (list, ban, delete, impersonate)
- app/admin/content/page.tsx — Content management (CRUD for all DB models)
- app/admin/settings/page.tsx — System settings
- app/admin/audit-log/page.tsx — Audit log viewer with filters
- app/admin/feature-flags/page.tsx — Feature flag toggle controls
- app/admin/analytics/page.tsx — Analytics overview
- app/admin/revenue/page.tsx — Revenue and subscription dashboard
- middleware.ts — Admin role protection (admin-only routes)
- lib/admin/permissions.ts — Role-based access control helpers

Protect all /admin/* routes with role-based middleware.
Include impersonation, user banning, and audit logging.

Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request): Promise<NextResponse> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    let body: GenerateAdminRequest;
    try {
      body = await req.json() as GenerateAdminRequest;
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }
    const {
      appName = "My App",
      features = ["all"],
      authProvider = "supabase",
    } = body;

    const selectedFeatures = features.includes("all")
      ? ["user-management", "content-management", "audit-log", "feature-flags", "analytics", "revenue", "email-templates"]
      : features;

    const userPrompt = `Generate a full-featured admin panel for "${appName}".
Auth provider: ${authProvider}
Features: ${selectedFeatures.join(", ")}

Generate:
1. Admin overview dashboard (app/admin/page.tsx)
2. User management with ban/delete/impersonate (app/admin/users/page.tsx)
3. Content management CRUD (app/admin/content/page.tsx)
4. System settings (app/admin/settings/page.tsx)
5. Audit log viewer (app/admin/audit-log/page.tsx)
6. Feature flag controls (app/admin/feature-flags/page.tsx)
7. Analytics overview (app/admin/analytics/page.tsx)
8. Revenue dashboard (app/admin/revenue/page.tsx)
9. Admin role middleware protection (middleware.ts)
10. RBAC permission helpers (lib/admin/permissions.ts)`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 8192,
      messages: [
        { role: "system", content: ADMIN_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateAdminResponse;
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
