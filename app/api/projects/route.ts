import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";
import type { AIProject } from "../../../lib/types";

export const runtime = "nodejs";

// ─── GET /api/projects ────────────────────────────────────────────────────────
export async function GET() {
  if (!supabaseAdmin) {
    // Fallback: return empty list when Supabase is not configured
    return NextResponse.json({ projects: [] });
  }
  const { data, error } = await supabaseAdmin
    .from("ai_projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ projects: data ?? [] });
}

// ─── POST /api/projects ───────────────────────────────────────────────────────
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { name, description, goals, tech_stack } = body as Partial<AIProject>;

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Project name is required" }, { status: 400 });
  }

  if (!supabaseAdmin) {
    // Return a mock project when Supabase is not configured
    const mock: Partial<AIProject> = {
      id: `local-${Date.now()}`,
      name,
      description,
      goals,
      tech_stack,
      version: "V1",
      phase: "development",
      deployment_status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return NextResponse.json({ project: mock }, { status: 201 });
  }

  const { data, error } = await supabaseAdmin
    .from("ai_projects")
    .insert({ name, description, goals, tech_stack })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ project: data }, { status: 201 });
}
