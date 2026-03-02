import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";
import type { AIDeployment, AIVersion, CheckResult } from "../../../lib/types";

export const runtime = "nodejs";

function nextVersionNumber(current: string): string {
  const match = current.match(/^V(\d+)$/);
  if (match) return `V${parseInt(match[1], 10) + 1}`;
  return "V2";
}

// ─── POST /api/deploy ─────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const project_id  = typeof body.project_id  === "string" ? body.project_id  : "";
    const environment = body.environment === "production" ? "production" : "preview";
    const snapshot    = body.snapshot ?? null;
    const changelog   = typeof body.changelog === "string" ? body.changelog : "";

    if (!project_id) {
      return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    }

    // Pre-deployment checks
    const preChecks: CheckResult[] = [
      { name: "project_id_present", passed: true },
      { name: "environment_valid",  passed: true },
    ];

    if (!supabaseAdmin) {
      // Return mock deployment when Supabase not configured
      const mock: Partial<AIDeployment> = {
        id: `deploy-${Date.now()}`,
        project_id,
        status: "deployed",
        environment,
        pre_checks: preChecks,
        post_checks: [{ name: "deploy_ok", passed: true }],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return NextResponse.json({ ok: true, deployment: mock, version: "V1" });
    }

    // Get current project version
    const { data: project } = await supabaseAdmin
      .from("ai_projects")
      .select("version")
      .eq("id", project_id)
      .single();

    const currentVersion = (project as { version: string } | null)?.version ?? "V1";
    const newVersion = nextVersionNumber(currentVersion);

    // Create version record
    const { data: version } = await supabaseAdmin
      .from("ai_versions")
      .insert({
        project_id,
        version_number: newVersion,
        changelog,
        snapshot,
        deployed: true,
      })
      .select()
      .single();

    const versionData = version as AIVersion | null;

    // Create deployment record
    const { data: deployment } = await supabaseAdmin
      .from("ai_deployments")
      .insert({
        project_id,
        version_id: versionData?.id,
        status: "deployed",
        environment,
        pre_checks: preChecks,
        post_checks: [{ name: "deploy_ok", passed: true }],
      })
      .select()
      .single();

    // Update project version and deployment status
    await supabaseAdmin
      .from("ai_projects")
      .update({ version: newVersion, deployment_status: "deployed" })
      .eq("id", project_id);

    return NextResponse.json({ ok: true, deployment, version: versionData });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Deploy failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── GET /api/deploy?project_id=... ──────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const project_id = searchParams.get("project_id");

    if (!supabaseAdmin) {
      return NextResponse.json({ deployments: [] });
    }

    let query = supabaseAdmin
      .from("ai_deployments")
      .select("*")
      .order("created_at", { ascending: false });

    if (project_id) {
      query = query.eq("project_id", project_id);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ deployments: data ?? [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
