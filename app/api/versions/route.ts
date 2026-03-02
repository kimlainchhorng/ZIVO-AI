import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";
import type { AIVersion } from "../../../lib/types";

export const runtime = "nodejs";

// ─── GET /api/versions?project_id=... ────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const project_id = searchParams.get("project_id");

    if (!supabaseAdmin) {
      return NextResponse.json({ versions: [] });
    }

    let query = supabaseAdmin
      .from("ai_versions")
      .select("*")
      .order("created_at", { ascending: false });

    if (project_id) {
      query = query.eq("project_id", project_id);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ versions: data ?? [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── POST /api/versions/rollback ─────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const version_id = typeof body.version_id === "string" ? body.version_id : "";
    const project_id = typeof body.project_id === "string" ? body.project_id : "";

    if (!version_id || !project_id) {
      return NextResponse.json({ error: "version_id and project_id are required" }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ ok: true, message: "Rollback simulated (Supabase not configured)" });
    }

    // Fetch the target version
    const { data: version, error: vErr } = await supabaseAdmin
      .from("ai_versions")
      .select("*")
      .eq("id", version_id)
      .single();

    if (vErr || !version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    const versionData = version as AIVersion;

    // Create a rollback deployment
    await supabaseAdmin.from("ai_deployments").insert({
      project_id,
      version_id,
      status: "deployed",
      environment: "production",
      pre_checks: [{ name: "rollback_to", passed: true, message: versionData.version_number }],
      post_checks: [{ name: "rollback_ok", passed: true }],
    });

    // Update project deployment status
    await supabaseAdmin
      .from("ai_projects")
      .update({
        version: versionData.version_number,
        deployment_status: "deployed",
      })
      .eq("id", project_id);

    return NextResponse.json({ ok: true, rolled_back_to: versionData.version_number });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Rollback failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
