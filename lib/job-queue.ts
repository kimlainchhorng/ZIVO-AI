// lib/job-queue.ts — In-memory async job queue with configurable concurrency

export type JobStatus = "pending" | "running" | "completed" | "failed";

export interface Job {
  id: string;
  type: string;
  payload: unknown;
  status: JobStatus;
  result?: unknown;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export type JobHandler = (payload: unknown) => Promise<unknown>;

let idCounter = 0;
function nextId(): string {
  return `job_${Date.now()}_${++idCounter}`;
}

/**
 * In-memory async job queue with configurable max concurrency (default 3).
 */
export class JobQueue {
  private readonly queue: Job[] = [];
  private readonly store = new Map<string, Job>();
  private readonly handlers = new Map<string, JobHandler>();
  private running = 0;
  private readonly maxConcurrency: number;

  constructor(maxConcurrency = 3) {
    this.maxConcurrency = maxConcurrency;
  }

  /** Registers a handler for a job type. */
  registerHandler(type: string, handler: JobHandler): void {
    this.handlers.set(type, handler);
  }

  /** Enqueues a new job and returns its ID. */
  enqueue(type: string, payload: unknown): string {
    const job: Job = {
      id: nextId(),
      type,
      payload,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    this.queue.push(job);
    this.store.set(job.id, job);
    // Trigger processing in next tick to avoid blocking
    setImmediate(() => this._process());
    return job.id;
  }

  /** Dequeues the next pending job without processing it (for manual use). */
  async dequeue(): Promise<Job | null> {
    const idx = this.queue.findIndex((j) => j.status === "pending");
    if (idx === -1) return null;
    const [job] = this.queue.splice(idx, 1);
    return job ?? null;
  }

  /** Returns the current status of a job by ID. */
  getStatus(jobId: string): JobStatus | "not_found" {
    return this.store.get(jobId)?.status ?? "not_found";
  }

  /** Returns a job by ID. */
  getJob(jobId: string): Job | undefined {
    return this.store.get(jobId);
  }

  /** Returns all jobs. */
  getAll(): Job[] {
    return Array.from(this.store.values());
  }

  private async _process(): Promise<void> {
    if (this.running >= this.maxConcurrency) return;

    const job = this.queue.find((j) => j.status === "pending");
    if (!job) return;

    job.status = "running";
    job.startedAt = new Date().toISOString();
    this.running++;

    const handler = this.handlers.get(job.type);
    try {
      if (handler) {
        job.result = await handler(job.payload);
      }
      job.status = "completed";
    } catch (err) {
      job.status = "failed";
      job.error = err instanceof Error ? err.message : String(err);
    } finally {
      job.completedAt = new Date().toISOString();
      this.running--;
      // Process next job
      setImmediate(() => this._process());
    }
  }
}

/** Default shared job queue instance. */
export const defaultQueue = new JobQueue(3);
