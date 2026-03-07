// Shared history store utilities for the ZIVO build history.
// Extracted into its own module so they can be imported without
// conflicting with Next.js Page export validation.

export interface BuildHistoryEntry {
  id: string;
  prompt: string;
  model: string;
  files: Array<{ path: string; action: string }>;
  buildTimeMs: number;
  createdAt: number; // timestamp ms
}

const HISTORY_KEY = "zivo_build_history";

export function loadHistory(): BuildHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveHistory(entries: BuildHistoryEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
}

export function addHistoryEntry(entry: Omit<BuildHistoryEntry, "id">): void {
  const entries = loadHistory();
  const newEntry: BuildHistoryEntry = { ...entry, id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}` };
  entries.unshift(newEntry);
  saveHistory(entries.slice(0, 100)); // keep last 100
}
