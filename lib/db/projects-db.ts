// lib/db/projects-db.ts — Supabase helpers for project workspace persistence
// Uses an authenticated Supabase client so RLS policies are enforced.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { getPlanTierForUser, defaultVisibilityForPlan } from "@/lib/billing/plan-provider";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface DbProject {
  id: string;
  owner_user_id: string;
  title: string;
  mode: "code" | "website_v2" | "mobile_v2";
  template: string | null;
  visibility: "public" | "private";
  client_idea: string | null;
  blueprint: unknown | null;
  manifest: unknown | null;
  created_at: string;
  updated_at: string;
}

export interface DbProjectFile {
  id: string;
  project_id: string;
  path: string;
  content: string;
  sha: string | null;
  generated_by: string | null;
  updated_at: string;
}

export interface DbProjectBuild {
  id: string;
  project_id: string;
  build_number: number;
  summary: string | null;
  issues: unknown | null;
  created_at: string;
}

export interface UpsertFileInput {
  path: string;
  content: string;
  generated_by?: string;
}

// ─── Server-side Supabase client ───────────────────────────────────────────────

/**
 * Creates a Supabase client authenticated as the given user via their JWT.
 * RLS policies are enforced based on auth.uid().
 */
export function createAuthedClient(userToken: string): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Supabase env vars (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY) are not set");
  }
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${userToken}` } },
    auth: { persistSession: false },
  });
}

/**
 * Extracts the bearer token from an Authorization header value.
 * Returns null if the header is absent or malformed.
 */
export function extractBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader?.startsWith("Bearer ")) return null;
  return authorizationHeader.slice(7).trim() || null;
}

/**
 * Verifies a bearer token and returns the authenticated user.
 * Returns null if the token is invalid.
 */
export async function getUserFromToken(token: string): Promise<{ id: string; email?: string } | null> {
  try {
    const client = createAuthedClient(token);
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) return null;
    return { id: user.id, email: user.email };
  } catch {
    return null;
  }
}

// ─── Project CRUD ──────────────────────────────────────────────────────────────

/** Lists all projects owned by the current user. */
export async function listUserProjects(token: string): Promise<DbProject[]> {
  const client = createAuthedClient(token);
  const { data, error } = await client
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`listUserProjects: ${error.message}`);
  return (data ?? []) as DbProject[];
}

/** Creates a new project for the authenticated user. */
export async function createProject(
  token: string,
  userId: string,
  input: {
    title?: string;
    mode?: DbProject["mode"];
    template?: string;
    client_idea?: string;
  }
): Promise<DbProject> {
  const tier = await getPlanTierForUser(userId);
  const visibility = defaultVisibilityForPlan(tier);

  const client = createAuthedClient(token);
  const { data, error } = await client
    .from("projects")
    .insert({
      owner_user_id: userId,
      title: input.title ?? "Untitled Project",
      mode: input.mode ?? "code",
      template: input.template ?? null,
      visibility,
      client_idea: input.client_idea ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(`createProject: ${error.message}`);
  return data as DbProject;
}

/** Retrieves a single project by ID. */
export async function getProject(token: string, projectId: string): Promise<DbProject | null> {
  const client = createAuthedClient(token);
  const { data, error } = await client
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();
  if (error) throw new Error(`getProject: ${error.message}`);
  return data as DbProject | null;
}

/** Updates project metadata. */
export async function updateProject(
  token: string,
  projectId: string,
  updates: Partial<Pick<DbProject, "title" | "mode" | "visibility" | "client_idea" | "blueprint" | "manifest">>
): Promise<DbProject> {
  const client = createAuthedClient(token);
  const { data, error } = await client
    .from("projects")
    .update(updates)
    .eq("id", projectId)
    .select()
    .single();
  if (error) throw new Error(`updateProject: ${error.message}`);
  return data as DbProject;
}

// ─── Project Files ─────────────────────────────────────────────────────────────

/** Returns all files for a project (path + metadata only, no content). */
export async function listProjectFiles(token: string, projectId: string): Promise<Omit<DbProjectFile, "content">[]> {
  const client = createAuthedClient(token);
  const { data, error } = await client
    .from("project_files")
    .select("id, project_id, path, sha, generated_by, updated_at")
    .eq("project_id", projectId)
    .order("path");
  if (error) throw new Error(`listProjectFiles: ${error.message}`);
  return (data ?? []) as Omit<DbProjectFile, "content">[];
}

/** Returns all files with full content for a project. */
export async function getProjectFiles(token: string, projectId: string): Promise<DbProjectFile[]> {
  const client = createAuthedClient(token);
  const { data, error } = await client
    .from("project_files")
    .select("*")
    .eq("project_id", projectId)
    .order("path");
  if (error) throw new Error(`getProjectFiles: ${error.message}`);
  return (data ?? []) as DbProjectFile[];
}

/** Upserts (inserts or updates) a batch of files for a project. */
export async function upsertProjectFiles(
  token: string,
  projectId: string,
  files: UpsertFileInput[]
): Promise<void> {
  if (files.length === 0) return;
  const client = createAuthedClient(token);
  const rows = files.map((f) => ({
    project_id: projectId,
    path: f.path,
    content: f.content,
    sha: createHash("sha256").update(f.content).digest("hex"),
    generated_by: f.generated_by ?? null,
    // updated_at is managed by the database trigger (update_project_files_updated_at)
  }));
  const { error } = await client
    .from("project_files")
    .upsert(rows, { onConflict: "project_id,path" });
  if (error) throw new Error(`upsertProjectFiles: ${error.message}`);
}

// ─── Project Builds ────────────────────────────────────────────────────────────

/** Appends a build record and returns the next build number. */
export async function appendProjectBuild(
  token: string,
  projectId: string,
  summary: string,
  issues?: unknown
): Promise<DbProjectBuild> {
  const client = createAuthedClient(token);

  // Determine the next build number
  const { data: existing, error: countError } = await client
    .from("project_builds")
    .select("build_number")
    .eq("project_id", projectId)
    .order("build_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (countError) throw new Error(`appendProjectBuild count: ${countError.message}`);

  const buildNumber = ((existing as { build_number: number } | null)?.build_number ?? 0) + 1;

  const { data, error } = await client
    .from("project_builds")
    .insert({ project_id: projectId, build_number: buildNumber, summary, issues: issues ?? null })
    .select()
    .single();
  if (error) throw new Error(`appendProjectBuild insert: ${error.message}`);
  return data as DbProjectBuild;
}


/** Alias for getProject — fetches a single project by ID. */
export async function getProjectById(token: string, projectId: string): Promise<DbProject | null> {
  return getProject(token, projectId);
}

// ─── Project Messages ──────────────────────────────────────────────────────────

export interface DbProjectMessage {
  id: string;
  project_id: string;
  owner_user_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

/** Returns all messages for a project in chronological order. */
export async function getProjectMessages(token: string, projectId: string): Promise<DbProjectMessage[]> {
  const client = createAuthedClient(token);
  const { data, error } = await client
    .from("project_messages")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`getProjectMessages: ${error.message}`);
  return (data ?? []) as DbProjectMessage[];
}

/** Appends a single message to the project conversation thread. */
export async function appendProjectMessage(
  token: string,
  projectId: string,
  userId: string,
  role: DbProjectMessage["role"],
  content: string
): Promise<DbProjectMessage> {
  const client = createAuthedClient(token);
  const { data, error } = await client
    .from("project_messages")
    .insert({ project_id: projectId, owner_user_id: userId, role, content })
    .select()
    .single();
  if (error) throw new Error(`appendProjectMessage: ${error.message}`);
  return data as DbProjectMessage;
}

/** Deletes a project by ID (RLS ensures only the owner can delete). */
export async function deleteProject(token: string, projectId: string): Promise<void> {
  const client = createAuthedClient(token);
  const { error } = await client.from("projects").delete().eq("id", projectId);
  if (error) throw new Error(`deleteProject: ${error.message}`);
}
