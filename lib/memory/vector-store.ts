import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return createClient(url, key);
}

export interface VectorEntry {
  id: string;
  projectId: string;
  content: string;
  metadata: Record<string, unknown>;
  embedding?: number[];
  createdAt: string;
}

export async function upsertVectorEntry(
  entry: Omit<VectorEntry, "id" | "createdAt">
): Promise<{ id: string } | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("project_vectors")
    .insert({
      project_id: entry.projectId,
      content: entry.content,
      metadata: entry.metadata,
    })
    .select("id")
    .single();

  if (error) {
    console.error("upsertVectorEntry error:", error.message);
    return null;
  }
  return { id: data.id as string };
}

export async function searchVectorEntries(
  projectId: string,
  query: string,
  limit = 5
): Promise<VectorEntry[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("project_vectors")
    .select("*")
    .eq("project_id", projectId)
    .textSearch("content", query)
    .limit(limit);

  if (error) {
    console.error("searchVectorEntries error:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    projectId: row.project_id as string,
    content: row.content as string,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
  }));
}

export async function deleteProjectVectors(projectId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("project_vectors")
    .delete()
    .eq("project_id", projectId);

  if (error) {
    console.error("deleteProjectVectors error:", error.message);
  }
}
