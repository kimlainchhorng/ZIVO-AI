import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

/** GET /api/public/projects/[id] — fetch a public project by ID (no auth required). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  // Use the anon client — RLS will allow reading public projects
  const supabase = createClient(url, anonKey);

  try {
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .eq("visibility", "public")
      .maybeSingle();

    if (projectError) throw new Error(projectError.message);
    if (!project) return NextResponse.json({ error: "Project not found or not public" }, { status: 404 });

    const { data: files, error: filesError } = await supabase
      .from("project_files")
      .select("path, content, updated_at")
      .eq("project_id", id)
      .order("path");

    if (filesError) throw new Error(filesError.message);

    return NextResponse.json({ project, files: files ?? [] });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message ?? "Failed to fetch project" },
      { status: 500 }
    );
  }
}
