import type { JobStatus } from "./types";

// In-memory job store (per-process). In production, use Redis or a DB.
const jobStore = new Map<string, JobStatus>();

export function createJob(): JobStatus {
  const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const job: JobStatus = {
    jobId,
    status: "queued",
    progress: 0,
    createdAt: now,
    updatedAt: now,
  };
  jobStore.set(jobId, job);
  return job;
}

export function getJob(jobId: string): JobStatus | null {
  return jobStore.get(jobId) ?? null;
}

export function updateJob(
  jobId: string,
  updates: Partial<Pick<JobStatus, "status" | "progress" | "result" | "error">>
): JobStatus | null {
  const job = jobStore.get(jobId);
  if (!job) return null;

  Object.assign(job, updates, { updatedAt: new Date().toISOString() });
  return job;
}

export function listJobs(): JobStatus[] {
  return Array.from(jobStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function runInBackground<T>(
  jobId: string,
  fn: (updateProgress: (p: number) => void) => Promise<T>
): Promise<void> {
  updateJob(jobId, { status: "running", progress: 0 });

  fn((progress) => updateJob(jobId, { progress }))
    .then((result) => updateJob(jobId, { status: "completed", progress: 100, result }))
    .catch((err: unknown) => {
      const error = err instanceof Error ? err.message : String(err);
      updateJob(jobId, { status: "failed", error });
    });
}
