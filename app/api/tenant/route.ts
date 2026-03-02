import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Tenant Management API – Multi-Tenant SaaS
 * GET  /api/tenant  – list tenants (admin only)
 * POST /api/tenant  – create a new tenant
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    tenants: [],
    total: 0,
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { name, subdomain, plan, adminEmail } = body as {
    name?: string;
    subdomain?: string;
    plan?: string;
    adminEmail?: string;
  };

  if (!name || !subdomain || !adminEmail) {
    return NextResponse.json(
      { error: "name, subdomain and adminEmail are required" },
      { status: 400 }
    );
  }

  // TODO: provision isolated database, configure subdomain, send onboarding email
  return NextResponse.json({
    ok: true,
    tenant: {
      id: crypto.randomUUID(),
      name,
      subdomain,
      plan: plan ?? "starter",
      adminEmail,
      status: "provisioning",
      createdAt: new Date().toISOString(),
    },
  });
}
