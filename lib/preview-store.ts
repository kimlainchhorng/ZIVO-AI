/**
 * lib/preview-store.ts
 *
 * In-memory store for live preview sessions.
 * On a single-process Node.js server (Docker deployment) this is the
 * canonical source of truth; a persistent Supabase table (`preview_sessions`)
 * is written as well so that multi-instance deployments and audit logs work.
 *
 * TTL: sessions idle for longer than PREVIEW_TTL_MS are considered expired and
 * cleaned up by the background reaper.
 */

import { randomUUID } from "crypto";

// ── Types ──────────────────────────────────────────────────────────────────────

export type PreviewStatus = "queued" | "building" | "running" | "failed" | "stopped";

export interface PreviewSession {
  previewId: string;
  projectId: string;
  userId: string;
  status: PreviewStatus;
  /** Public preview URL once the container is running. */
  url: string | null;
  /** Rolling build/runtime log lines. */
  logs: string[];
  /** Container / process identifier (Docker container ID, child PID, etc.). */
  containerId: string | null;
  /** Ephemeral host port allocated for this session. */
  port: number | null;
  createdAt: Date;
  /** Updated whenever status or logs change — used for TTL eviction. */
  lastActiveAt: Date;
  /** ISO timestamp of when the preview became `running`. */
  startedAt: string | null;
  error: string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** Sessions idle longer than 30 minutes are eligible for reaping. */
const PREVIEW_TTL_MS = 30 * 60 * 1000;

/** Maximum number of log lines retained per session. */
const MAX_LOG_LINES = 500;

// ── In-memory map ─────────────────────────────────────────────────────────────

// Use a module-level variable so it survives hot-reloads in development (via
// globalThis caching) but doesn't leak between test runs.
const _global = globalThis as typeof globalThis & {
  __zivoPreviewStore?: Map<string, PreviewSession>;
  __zivoPreviewReaper?: ReturnType<typeof setInterval>;
};

if (!_global.__zivoPreviewStore) {
  _global.__zivoPreviewStore = new Map<string, PreviewSession>();
}
const store: Map<string, PreviewSession> = _global.__zivoPreviewStore;

// ── Background reaper ─────────────────────────────────────────────────────────

function startReaper() {
  if (_global.__zivoPreviewReaper) return;
  _global.__zivoPreviewReaper = setInterval(() => {
    const now = Date.now();
    for (const [id, session] of store.entries()) {
      if (now - session.lastActiveAt.getTime() > PREVIEW_TTL_MS) {
        store.delete(id);
      }
    }
  }, 5 * 60 * 1000); // run every 5 minutes
}

// Only start the reaper in non-test environments.
if (typeof process !== "undefined" && process.env.NODE_ENV !== "test") {
  startReaper();
}

// ── CRUD helpers ──────────────────────────────────────────────────────────────

/** Creates a new preview session and returns it. */
export function createPreviewSession(
  projectId: string,
  userId: string
): PreviewSession {
  const previewId = randomUUID();
  const now = new Date();
  const session: PreviewSession = {
    previewId,
    projectId,
    userId,
    status: "queued",
    url: null,
    logs: [],
    containerId: null,
    port: null,
    createdAt: now,
    lastActiveAt: now,
    startedAt: null,
    error: null,
  };
  store.set(previewId, session);
  return session;
}

/** Retrieves a session by ID. Returns null if not found or expired. */
export function getPreviewSession(previewId: string): PreviewSession | null {
  return store.get(previewId) ?? null;
}

/** Updates fields on a session and bumps lastActiveAt. */
export function updatePreviewSession(
  previewId: string,
  updates: Partial<Omit<PreviewSession, "previewId" | "createdAt">>
): PreviewSession | null {
  const session = store.get(previewId);
  if (!session) return null;
  Object.assign(session, updates, { lastActiveAt: new Date() });
  return session;
}

/** Appends a log line to a session (capped at MAX_LOG_LINES). */
export function appendPreviewLog(previewId: string, line: string): void {
  const session = store.get(previewId);
  if (!session) return;
  session.logs.push(line);
  if (session.logs.length > MAX_LOG_LINES) {
    session.logs.splice(0, session.logs.length - MAX_LOG_LINES);
  }
  session.lastActiveAt = new Date();
}

/** Deletes a session from the store. */
export function deletePreviewSession(previewId: string): boolean {
  return store.delete(previewId);
}

/** Returns all active (non-stopped) sessions for a user. */
export function listUserPreviewSessions(userId: string): PreviewSession[] {
  return Array.from(store.values()).filter(
    (s) => s.userId === userId && s.status !== "stopped"
  );
}
