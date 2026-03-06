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
  snapshot_path: string | null;
  created_at: string;
}

export interface UpsertFileInput {
  path: string;
  content: string;
  generated_by?: string;
}

// ─── Server-side Supabase client ───────────────────────────────────────────────
// ─── Constants ────────────────────────────────────────────────────────────────

const GENERATED_BY_SNAPSHOT_RESTORE = "snapshot-restore";
const STORAGE_BUCKET_SNAPSHOTS = "project-build-snapshots";

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

/** Lists builds for a project ordered by build_number descending. */
export async function listProjectBuilds(token: string, projectId: string): Promise<DbProjectBuild[]> {
  const client = createAuthedClient(token);
  const { data, error } = await client
    .from("project_builds")
    .select("*")
    .eq("project_id", projectId)
    .order("build_number", { ascending: false });
  if (error) throw new Error(`listProjectBuilds: ${error.message}`);
  return (data ?? []) as DbProjectBuild[];
}

/**
 * Writes a build snapshot to Supabase Storage and appends a build record
 * with the snapshot_path. Falls back to storing without a snapshot if
 * Storage is not configured or the upload fails.
 */
export async function appendProjectBuildWithSnapshot(
  token: string,
  projectId: string,
  summary: string,
  files: Array<{ path: string; content: string }>,
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
  if (countError) throw new Error(`appendProjectBuildWithSnapshot count: ${countError.message}`);

  const buildNumber = ((existing as { build_number: number } | null)?.build_number ?? 0) + 1;

  // Insert the build record first so we have an ID for the snapshot path
  const { data: buildRecord, error: insertError } = await client
    .from("project_builds")
    .insert({ project_id: projectId, build_number: buildNumber, summary, issues: issues ?? null })
    .select()
    .single();
  if (insertError) throw new Error(`appendProjectBuildWithSnapshot insert: ${insertError.message}`);

  const build = buildRecord as DbProjectBuild;

  // Attempt to write snapshot to Supabase Storage
  const snapshotPath = `${STORAGE_BUCKET_SNAPSHOTS}/${projectId}/${build.id}.json`;
  try {
    const payload = JSON.stringify({ files });
    const { error: uploadError } = await client.storage
      .from(STORAGE_BUCKET_SNAPSHOTS)
      .upload(`${projectId}/${build.id}.json`, new Blob([payload], { type: "application/json" }), {
        upsert: true,
      });
    if (!uploadError) {
      // Update the record with the snapshot path
      const { data: updated, error: updateError } = await client
        .from("project_builds")
        .update({ snapshot_path: snapshotPath })
        .eq("id", build.id)
        .select()
        .single();
      if (updateError) {
        // Best-effort cleanup: remove the uploaded snapshot to avoid orphaned objects
        try {
          await client.storage
            .from(STORAGE_BUCKET_SNAPSHOTS)
            .remove([`${projectId}/${build.id}.json`]);
        } catch {
          // Swallow cleanup errors; build insert already succeeded
        }
        // Non-fatal — return the original build record without a snapshot_path
        return build;
      }
      return (updated ?? build) as DbProjectBuild;
    }
  } catch {
    // Non-fatal — the build record is still saved without a snapshot
  }

  return build;
}

/**
 * Restores a project's files from a build snapshot stored in Supabase Storage.
 * Replaces the current project_files set with the snapshot contents.
 */
export async function restoreProjectFromSnapshot(
  token: string,
  projectId: string,
  buildId: string
): Promise<void> {
  const client = createAuthedClient(token);

  // Fetch the build record to get the snapshot_path
  const { data: build, error: buildError } = await client
    .from("project_builds")
    .select("snapshot_path")
    .eq("id", buildId)
    .eq("project_id", projectId)
    .single();
  if (buildError || !build) throw new Error("Build not found");

  const snapshotPath = (build as { snapshot_path: string | null }).snapshot_path;
  if (!snapshotPath) throw new Error("No snapshot available for this build");

  // Download from storage: path after bucket name
  const storagePath = snapshotPath.replace(new RegExp(`^${STORAGE_BUCKET_SNAPSHOTS}/`), "");
  const { data: blob, error: dlError } = await client.storage
    .from(STORAGE_BUCKET_SNAPSHOTS)
    .download(storagePath);
  if (dlError || !blob) throw new Error(`Failed to download snapshot: ${dlError?.message ?? "empty"}`);

  const json = await blob.text();
  const snapshot = JSON.parse(json) as { files: Array<{ path: string; content: string }> };
  if (!Array.isArray(snapshot.files)) throw new Error("Invalid snapshot format");

  const snapshotPaths = snapshot.files.map((f) => f.path);

  // Upsert snapshot files first so we never leave the project empty if the upsert fails.
  await upsertProjectFiles(
    token,
    projectId,
    snapshot.files.map((f) => ({ path: f.path, content: f.content, generated_by: GENERATED_BY_SNAPSHOT_RESTORE }))
  );

  // Then delete any existing project files not present in the snapshot.
  if (snapshotPaths.length === 0) {
    const { error: deleteError } = await client
      .from("project_files")
      .delete()
      .eq("project_id", projectId);
    if (deleteError) throw new Error(`Failed to clear project files: ${deleteError.message}`);
  } else {
    const { error: deleteError } = await client
      .from("project_files")
      .delete()
      .eq("project_id", projectId)
      .not("path", "in", `(${snapshotPaths.map((p) => `"${p}"`).join(",")})`);
    if (deleteError) throw new Error(`Failed to delete stale project files: ${deleteError.message}`);
  }
}


// ─── Project Quality Runs ──────────────────────────────────────────────────────

export type QualityRunStatus = "queued" | "running" | "passed" | "failed";

export interface DbQualityRun {
  id: string;
  project_id: string;
  build_id: string | null;
  status: QualityRunStatus;
  logs: string;
  checks: unknown | null;
  fix_attempts: number;
  max_retries: number;
  patches: unknown | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

/** Creates a new queued quality run record. */
export async function createQualityRun(
  token: string,
  projectId: string,
  maxRetries = 3
): Promise<DbQualityRun> {
  const client = createAuthedClient(token);
  const { data, error } = await client
    .from("project_quality_runs")
    .insert({ project_id: projectId, max_retries: maxRetries })
    .select()
    .single();
  if (error) throw new Error(`createQualityRun: ${error.message}`);
  return data as DbQualityRun;
}

/** Updates fields on an existing quality run (e.g. status, logs). */
export async function updateQualityRun(
  token: string,
  runId: string,
  updates: Partial<Pick<DbQualityRun, "status" | "logs" | "checks" | "fix_attempts" | "patches" | "started_at" | "finished_at" | "build_id">>
): Promise<DbQualityRun> {
  const client = createAuthedClient(token);
  const { data, error } = await client
    .from("project_quality_runs")
    .update(updates)
    .eq("id", runId)
    .select()
    .single();
  if (error) throw new Error(`updateQualityRun: ${error.message}`);
  return data as DbQualityRun;
}

/** Fetches a single quality run by ID. */
export async function getQualityRun(token: string, runId: string): Promise<DbQualityRun | null> {
  const client = createAuthedClient(token);
  const { data, error } = await client
    .from("project_quality_runs")
    .select("*")
    .eq("id", runId)
    .maybeSingle();
  if (error) throw new Error(`getQualityRun: ${error.message}`);
  return data as DbQualityRun | null;
}

/** Lists quality runs for a project (newest first). */
export async function listQualityRuns(token: string, projectId: string, limit = 20): Promise<DbQualityRun[]> {
  const client = createAuthedClient(token);
  const { data, error } = await client
    .from("project_quality_runs")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`listQualityRuns: ${error.message}`);
  return (data ?? []) as DbQualityRun[];
}

/** Alias for getProject — fetches a single project by ID. */
export async function getProjectById(token: string, projectId: string): Promise<DbProject | null> {
  return getProject(token, projectId);
}

// ─── Project Jobs (DB-backed queue) ───────────────────────────────────────────

export type JobType = "preview" | "quality" | "build";
export type JobStatus = "queued" | "running" | "passed" | "failed" | "stopped";

export interface DbProjectJob {
  id: string;
  project_id: string;
  owner_user_id: string;
  type: JobType;
  status: JobStatus;
  attempt: number;
  max_attempts: number;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  result_json: unknown | null;
  logs_storage_path: string | null;
}

/** Creates a new queued job row. */
export async function createProjectJob(
  token: string,
  projectId: string,
  ownerUserId: string,
  type: JobType,
  attempt = 1,
  maxAttempts = 1
): Promise<DbProjectJob> {
  const client = createAuthedClient(token);
  const { data, error } = await client
    .from("project_jobs")
    .insert({ project_id: projectId, owner_user_id: ownerUserId, type, attempt, max_attempts: maxAttempts })
    .select()
    .single();
  if (error) throw new Error(`createProjectJob: ${error.message}`);
  return data as DbProjectJob;
}

/** Updates fields on a job (status, result, etc.). */
export async function updateProjectJob(
  token: string,
  jobId: string,
  updates: Partial<Pick<DbProjectJob, "status" | "started_at" | "finished_at" | "result_json" | "logs_storage_path">>
): Promise<DbProjectJob> {
  const client = createAuthedClient(token);
  const { data, error } = await client
    .from("project_jobs")
    .update(updates)
    .eq("id", jobId)
    .select()
    .single();
  if (error) throw new Error(`updateProjectJob: ${error.message}`);
  return data as DbProjectJob;
}

/** Fetches a single job by ID. */
export async function getProjectJob(token: string, jobId: string): Promise<DbProjectJob | null> {
  const client = createAuthedClient(token);
  const { data, error } = await client
    .from("project_jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();
  if (error) throw new Error(`getProjectJob: ${error.message}`);
  return data as DbProjectJob | null;
}

/** Lists jobs for a project (newest first). */
export async function listProjectJobs(
  token: string,
  projectId: string,
  type?: JobType,
  limit = 20
): Promise<DbProjectJob[]> {
  const client = createAuthedClient(token);
  let query = client
    .from("project_jobs")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (type) query = query.eq("type", type);
  const { data, error } = await query;
  if (error) throw new Error(`listProjectJobs: ${error.message}`);
  return (data ?? []) as DbProjectJob[];
}

/** Generates a short-lived signed URL for a log file in the job-logs bucket. */
export async function getJobLogSignedUrl(
  token: string,
  storagePath: string,
  expiresInSeconds = 3600
): Promise<string | null> {
  const client = createAuthedClient(token);
  const { data, error } = await client.storage
    .from("job-logs")
    .createSignedUrl(storagePath, expiresInSeconds);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
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
