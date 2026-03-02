import { getSupabaseAdmin } from "./supabase";
import type { AIProject, ChangeRecord } from "./types";

/** In-memory fallback for when Supabase is not configured */
const inMemoryProjects: Map<string, AIProject> = new Map();

function generateId(): string {
  return `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function createProject(
  data: Omit<AIProject, "id" | "created_at" | "updated_at">
): Promise<AIProject> {
  const project: AIProject = {
    ...data,
    id: generateId(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const db = getSupabaseAdmin();
  if (db) {
    const { data: row, error } = await db
      .from("ai_projects")
      .insert(project)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as AIProject;
  }

  inMemoryProjects.set(project.id, project);
  return project;
}

export async function getProject(id: string): Promise<AIProject | null> {
  const db = getSupabaseAdmin();
  if (db) {
    const { data, error } = await db
      .from("ai_projects")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return null;
    return data as AIProject;
  }
  return inMemoryProjects.get(id) ?? null;
}

export async function updateProject(
  id: string,
  patch: Partial<AIProject>
): Promise<AIProject | null> {
  const db = getSupabaseAdmin();
  if (db) {
    const { data, error } = await db
      .from("ai_projects")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) return null;
    return data as AIProject;
  }

  const existing = inMemoryProjects.get(id);
  if (!existing) return null;
  const updated = { ...existing, ...patch, updated_at: new Date().toISOString() };
  inMemoryProjects.set(id, updated);
  return updated;
}

export async function listProjects(): Promise<AIProject[]> {
  const db = getSupabaseAdmin();
  if (db) {
    const { data } = await db
      .from("ai_projects")
      .select("*")
      .order("updated_at", { ascending: false });
    return (data as AIProject[]) ?? [];
  }
  return Array.from(inMemoryProjects.values()).sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

export async function deleteProject(id: string): Promise<boolean> {
  const db = getSupabaseAdmin();
  if (db) {
    const { error } = await db.from("ai_projects").delete().eq("id", id);
    return !error;
  }
  return inMemoryProjects.delete(id);
}

export async function addChangeRecord(
  projectId: string,
  change: Omit<ChangeRecord, "id">
): Promise<void> {
  const project = await getProject(projectId);
  if (!project) return;

  const record: ChangeRecord = {
    ...change,
    id: `chg-${Date.now()}`,
  };

  const recent_changes = [record, ...project.recent_changes].slice(0, 50);
  await updateProject(projectId, { recent_changes });
}

export async function bumpVersion(projectId: string): Promise<string> {
  const project = await getProject(projectId);
  if (!project) throw new Error("Project not found");

  const [major, minor, patch] = project.version.split(".").map(Number);
  const newVersion = `${major}.${minor}.${(patch ?? 0) + 1}`;
  await updateProject(projectId, { version: newVersion });
  return newVersion;
}
