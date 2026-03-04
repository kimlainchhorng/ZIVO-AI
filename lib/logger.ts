// lib/logger.ts — Structured logger with ring buffer (last 1000 entries)

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

const RING_BUFFER_SIZE = 1000;
let logCounter = 0;

/** Ring buffer storing the last 1000 log entries. */
const logBuffer: LogEntry[] = [];

function nextLogId(): string {
  return `log_${Date.now()}_${++logCounter}`;
}

function append(entry: LogEntry): void {
  if (logBuffer.length >= RING_BUFFER_SIZE) {
    logBuffer.shift(); // evict oldest entry
  }
  logBuffer.push(entry);
}

/** Structured logger with levels. */
export const logger = {
  debug(message: string, metadata?: Record<string, unknown>): void {
    append({ id: nextLogId(), level: "debug", message, timestamp: new Date().toISOString(), metadata });
  },
  info(message: string, metadata?: Record<string, unknown>): void {
    append({ id: nextLogId(), level: "info", message, timestamp: new Date().toISOString(), metadata });
  },
  warn(message: string, metadata?: Record<string, unknown>): void {
    append({ id: nextLogId(), level: "warn", message, timestamp: new Date().toISOString(), metadata });
  },
  error(message: string, metadata?: Record<string, unknown>): void {
    append({ id: nextLogId(), level: "error", message, timestamp: new Date().toISOString(), metadata });
  },
};

export interface LogQuery {
  level?: LogLevel;
  limit?: number;
  since?: string; // ISO date string
}

/**
 * Queries the log buffer with optional level, limit, and since filters.
 */
export function queryLogs(query: LogQuery = {}): LogEntry[] {
  let entries = [...logBuffer];

  if (query.level) {
    entries = entries.filter((e) => e.level === query.level);
  }

  if (query.since) {
    const sinceMs = new Date(query.since).getTime();
    entries = entries.filter((e) => new Date(e.timestamp).getTime() >= sinceMs);
  }

  // Return most recent first
  entries = entries.reverse();

  if (query.limit && query.limit > 0) {
    entries = entries.slice(0, query.limit);
  }

  return entries;
}

/**
 * Clears all entries from the log buffer.
 */
export function clearLogs(): void {
  logBuffer.length = 0;
}

/**
 * Returns the total count of entries currently in the buffer.
 */
export function getLogCount(): number {
  return logBuffer.length;
}
