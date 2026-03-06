/**
 * runner/src/index.ts — ZIVO-AI Remote Runner
 *
 * Polls the project_jobs table for queued quality jobs and executes them
 * directly inside the runner container (execution model B).
 *
 * Logs are streamed to Supabase Storage (bucket: job-logs) and the path is
 * stored in project_jobs.logs_storage_path for the app to serve via signed URL.
 *
 * Environment variables required (see runner/.env.example):
 *   SUPABASE_URL              — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — Service role key (bypasses RLS)
 *   RUNNER_CONCURRENCY        — Max concurrent jobs (default: 2)
 *   RUNNER_POLL_INTERVAL_MS   — Poll interval in ms (default: 5000)
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { executeQualityChecks, type QualityFile } from "./quality-executor";

// ─── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const CONCURRENCY = Math.max(1, parseInt(process.env.RUNNER_CONCURRENCY ?? "2", 10));
const POLL_INTERVAL_MS = Math.max(1000, parseInt(process.env.RUNNER_POLL_INTERVAL_MS ?? "5000", 10));
const LOG_BUCKET = "job-logs";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("[runner] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  process.exit(1);
}

// ─── Supabase service-role client ─────────────────────────────────────────────

function createServiceClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

// ─── Job types ────────────────────────────────────────────────────────────────

interface ProjectJob {
  id: string;
  project_id: string;
  owner_user_id: string;
  type: "preview" | "quality" | "build";
  status: "queued" | "running" | "passed" | "failed" | "stopped";
  attempt: number;
  max_attempts: number;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  result_json: unknown;
  logs_storage_path: string | null;
}

interface ProjectFile {
  path: string;
  content: string;
}

// ─── Runner state ─────────────────────────────────────────────────────────────

let activeJobs = 0;

// ─── Core execution ───────────────────────────────────────────────────────────

async function processJob(supabase: SupabaseClient, job: ProjectJob): Promise<void> {
  activeJobs++;
  console.log(`[runner] Starting job ${job.id} (project ${job.project_id}, attempt ${job.attempt})`);

  try {
    // Mark job as running
    await supabase
      .from("project_jobs")
      .update({ status: "running", started_at: new Date().toISOString() })
      .eq("id", job.id);

    // Fetch project files
    const { data: filesData, error: filesError } = await supabase
      .from("project_files")
      .select("path, content")
      .eq("project_id", job.project_id)
      .order("path");

    if (filesError) throw new Error(`Failed to fetch project files: ${filesError.message}`);

    const files: QualityFile[] = (filesData ?? []).map((f: ProjectFile) => ({
      path: f.path,
      content: f.content,
    }));

    if (files.length === 0) {
      throw new Error("No project files found — cannot run quality checks.");
    }

    // Execute quality checks
    const result = await executeQualityChecks(files);

    // Upload logs to Supabase Storage
    const logsStoragePath = `${job.project_id}/${job.id}.log`;
    const logContent = Buffer.from(result.logs, "utf8");

    const { error: uploadError } = await supabase.storage
      .from(LOG_BUCKET)
      .upload(logsStoragePath, logContent, {
        contentType: "text/plain; charset=utf-8",
        upsert: true,
      });

    if (uploadError) {
      // Non-fatal: still update the job with results; just log the warning
      console.warn(`[runner] Failed to upload logs for job ${job.id}: ${uploadError.message}`);
    }

    // Update job with final status
    await supabase
      .from("project_jobs")
      .update({
        status: result.passed ? "passed" : "failed",
        finished_at: new Date().toISOString(),
        result_json: { passed: result.passed, checks: result.checks },
        logs_storage_path: uploadError ? null : logsStoragePath,
      })
      .eq("id", job.id);

    console.log(`[runner] Job ${job.id} finished: ${result.passed ? "PASSED" : "FAILED"}`);
  } catch (err: unknown) {
    const message = (err as Error)?.message ?? String(err);
    console.error(`[runner] Job ${job.id} error: ${message}`);

    // Upload error log to storage
    const logsStoragePath = `${job.project_id}/${job.id}.log`;
    const errorLog = `[runner error]\n${message}`;
    await supabase.storage
      .from(LOG_BUCKET)
      .upload(logsStoragePath, Buffer.from(errorLog, "utf8"), {
        contentType: "text/plain; charset=utf-8",
        upsert: true,
      })
      .catch(() => { /* best effort */ });

    await supabase
      .from("project_jobs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        result_json: { error: message },
        logs_storage_path: logsStoragePath,
      })
      .eq("id", job.id)
      .catch(() => { /* best effort */ });
  } finally {
    activeJobs--;
  }
}

// ─── Poll loop ────────────────────────────────────────────────────────────────

async function poll(supabase: SupabaseClient): Promise<void> {
  if (activeJobs >= CONCURRENCY) return;

  const slots = CONCURRENCY - activeJobs;

  // Claim queued quality jobs (oldest first, up to available slots)
  const { data: jobs, error } = await supabase
    .from("project_jobs")
    .select("*")
    .eq("status", "queued")
    .eq("type", "quality")
    .order("created_at", { ascending: true })
    .limit(slots);

  if (error) {
    console.error("[runner] Poll error:", error.message);
    return;
  }

  for (const job of jobs as ProjectJob[]) {
    if (activeJobs >= CONCURRENCY) break;
    // Fire-and-forget (tracked via activeJobs counter)
    processJob(supabase, job).catch((e: unknown) => {
      console.error("[runner] Unhandled job error:", e);
    });
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`[runner] Starting — concurrency=${CONCURRENCY}, poll=${POLL_INTERVAL_MS}ms`);
  const supabase = createServiceClient();

  // Recover any jobs left stuck in "running" state from a previous crash
  const { error: recoverError } = await supabase
    .from("project_jobs")
    .update({ status: "queued", started_at: null })
    .eq("status", "running")
    .eq("type", "quality");

  if (recoverError) {
    console.warn("[runner] Could not recover stale running jobs:", recoverError.message);
  } else {
    console.log("[runner] Stale running jobs reset to queued.");
  }

  setInterval(() => {
    poll(supabase).catch((e: unknown) => {
      console.error("[runner] Poll exception:", e);
    });
  }, POLL_INTERVAL_MS);

  // Initial poll immediately
  await poll(supabase);
}

main().catch((e) => {
  console.error("[runner] Fatal:", e);
  process.exit(1);
});
