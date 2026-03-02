// Background job queue system for long-running AI tasks.
// Provides job submission, status tracking, retry logic, and history.

export type JobStatus = "queued" | "running" | "completed" | "failed" | "retrying";

export type JobType =
  | "generate_site"
  | "architect"
  | "ui_generate"
  | "backend_generate"
  | "security_audit"
  | "performance_optimize"
  | "code_review"
  | "debug"
  | "deploy"
  | "custom";

export interface BackgroundJob {
  id: string;
  type: JobType;
  status: JobStatus;
  projectId?: string;
  input: Record<string, unknown>;
  output?: unknown;
  error?: string;
  progress: number; // 0-100
  attempts: number;
  maxRetries: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  webhookUrl?: string;
}

export interface JobSubmission {
  type: JobType;
  projectId?: string;
  input: Record<string, unknown>;
  maxRetries?: number;
  webhookUrl?: string;
}

// ── In-memory queue (replace with Redis/BullMQ in production) ────────────────

const jobs = new Map<string, BackgroundJob>();

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `job-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── Job operations ───────────────────────────────────────────────────────────

export function submitJob(submission: JobSubmission): BackgroundJob {
  const id = generateId();
  const job: BackgroundJob = {
    id,
    type: submission.type,
    status: "queued",
    projectId: submission.projectId,
    input: submission.input,
    progress: 0,
    attempts: 0,
    maxRetries: submission.maxRetries ?? 3,
    createdAt: new Date().toISOString(),
    webhookUrl: submission.webhookUrl,
  };
  jobs.set(id, job);
  return job;
}

export function getJob(id: string): BackgroundJob | undefined {
  return jobs.get(id);
}

export function listJobs(projectId?: string): BackgroundJob[] {
  const all = [...jobs.values()];
  const filtered = projectId ? all.filter((j) => j.projectId === projectId) : all;
  return filtered.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function updateJobProgress(id: string, progress: number): BackgroundJob | null {
  const job = jobs.get(id);
  if (!job) return null;
  job.progress = Math.min(100, Math.max(0, progress));
  jobs.set(id, job);
  return job;
}

export function startJob(id: string): BackgroundJob | null {
  const job = jobs.get(id);
  if (!job) return null;
  job.status = "running";
  job.startedAt = new Date().toISOString();
  job.attempts += 1;
  jobs.set(id, job);
  return job;
}

export function completeJob(id: string, output: unknown): BackgroundJob | null {
  const job = jobs.get(id);
  if (!job) return null;
  job.status = "completed";
  job.output = output;
  job.progress = 100;
  job.completedAt = new Date().toISOString();
  jobs.set(id, job);
  return job;
}

export function failJob(id: string, error: string): BackgroundJob | null {
  const job = jobs.get(id);
  if (!job) return null;

  if (job.attempts < job.maxRetries) {
    job.status = "retrying";
  } else {
    job.status = "failed";
    job.completedAt = new Date().toISOString();
  }
  job.error = error;
  jobs.set(id, job);
  return job;
}

export function getJobHistory(limit = 50): BackgroundJob[] {
  return listJobs().slice(0, limit);
}
