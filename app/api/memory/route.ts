import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  createDefaultMemory,
  mergeMemory,
  type ProjectMemory,
} from "@/lib/memory/project-memory";

export const runtime = "nodejs";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("project_memory")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const memory: ProjectMemory = data
    ? (data.memory as ProjectMemory)
    : createDefaultMemory(projectId);

  return NextResponse.json(memory);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as {
    projectId?: string;
    updates?: Partial<ProjectMemory>;
  };

  const { projectId, updates } = body;

  if (!projectId) {
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from("project_memory")
    .select("memory")
    .eq("project_id", projectId)
    .maybeSingle();

  const current: ProjectMemory = existing
    ? (existing.memory as ProjectMemory)
    : createDefaultMemory(projectId);

  const updated = updates ? mergeMemory(current, updates) : current;

  const { error } = await supabase.from("project_memory").upsert({
    project_id: projectId,
    memory: updated,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from("project_memory")
    .delete()
    .eq("project_id", projectId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
