"use client";

import { useEffect, useState, useCallback } from "react";
import React from "react";
import type { ExtendedProjectMemory, MemoryDecision, MemoryChange } from "@/lib/memory/project-memory";

interface ProjectMemoryPanelProps {
  projectId: string;
}

const STACK_COLORS: Record<string, string> = {
  react: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  next: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  typescript: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  tailwind: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  supabase: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  default: "bg-violet-500/20 text-violet-300 border-violet-500/30",
};

function stackColor(tech: string): string {
  const key = tech.toLowerCase();
  for (const prefix of Object.keys(STACK_COLORS)) {
    if (key.includes(prefix)) return STACK_COLORS[prefix]!;
  }
  return STACK_COLORS.default!;
}

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ProjectMemoryPanel({ projectId }: ProjectMemoryPanelProps): React.JSX.Element {
  const [memory, setMemory] = useState<ExtendedProjectMemory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [expandedDecisions, setExpandedDecisions] = useState(false);

  const fetchMemory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/memory/${projectId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as ExtendedProjectMemory;
      setMemory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load memory");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchMemory();
  }, [fetchMemory]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/memory/${projectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "recall", query: searchQuery }),
      });
      const data = (await res.json()) as { results?: string[] };
      setSearchResults(data.results ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-white/10 bg-neutral-900 p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
        <span className="ml-3 text-sm text-neutral-400">Loading memory…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-6 text-sm text-red-400">
        <strong>Error:</strong> {error}
        <button
          onClick={() => void fetchMemory()}
          className="ml-4 underline hover:text-red-300"
        >
          Retry
        </button>
      </div>
    );
  }

  const isEmpty =
    !memory ||
    (memory.techStack.length === 0 &&
      memory.conventions.length === 0 &&
      memory.decisions.length === 0 &&
      memory.recentChanges.length === 0);

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-white/10 bg-neutral-900 p-5 text-sm text-neutral-100">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Project Memory</h2>
        <button
          onClick={() => void fetchMemory()}
          title="Refresh"
          className="rounded-md p-1 text-neutral-400 transition hover:bg-white/5 hover:text-white"
        >
          ↺
        </button>
      </div>

      {isEmpty && (
        <p className="text-center text-neutral-500">No memory recorded yet.</p>
      )}

      {/* Tech Stack */}
      {memory && memory.techStack.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-widest text-neutral-500">
            Tech Stack
          </h3>
          <div className="flex flex-wrap gap-2">
            {memory.techStack.map((tech) => (
              <span
                key={tech}
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${stackColor(tech)}`}
              >
                {tech}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Decisions */}
      {memory && memory.decisions.length > 0 && (
        <section>
          <button
            className="flex w-full items-center justify-between text-xs font-medium uppercase tracking-widest text-neutral-500 hover:text-neutral-300"
            onClick={() => setExpandedDecisions((v) => !v)}
          >
            <span>Decisions ({memory.decisions.length})</span>
            <span>{expandedDecisions ? "▲" : "▼"}</span>
          </button>
          {expandedDecisions && (
            <ul className="mt-2 space-y-2">
              {memory.decisions.map((d: MemoryDecision, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-white/5 bg-neutral-800/60 px-3 py-2"
                >
                  <p className="font-medium text-neutral-100">{d.decision}</p>
                  <p className="mt-0.5 text-neutral-400">{d.reason}</p>
                  <p className="mt-1 text-[11px] text-neutral-600">
                    {formatDate(d.timestamp)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Recent Changes */}
      {memory && memory.recentChanges.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-widest text-neutral-500">
            What Changed?
          </h3>
          <ul className="space-y-2">
            {memory.recentChanges
              .slice()
              .reverse()
              .slice(0, 5)
              .map((c: MemoryChange, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-white/5 bg-neutral-800/60 px-3 py-2"
                >
                  <p className="text-neutral-200">{c.summary}</p>
                  {c.files.length > 0 && (
                    <p className="mt-0.5 truncate text-[11px] text-neutral-500">
                      {c.files.join(", ")}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-neutral-600">
                    {formatDate(c.timestamp)}
                  </p>
                </li>
              ))}
          </ul>
        </section>
      )}

      {/* Search */}
      <section>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-widest text-neutral-500">
          Search Memory
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void handleSearch()}
            placeholder="Search decisions, conventions…"
            className="flex-1 rounded-md border border-white/10 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-violet-500"
          />
          <button
            onClick={() => void handleSearch()}
            disabled={searching}
            className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
          >
            {searching ? "…" : "Search"}
          </button>
        </div>

        {searchResults !== null && (
          <div className="mt-3">
            {searchResults.length === 0 ? (
              <p className="text-neutral-500">No results found.</p>
            ) : (
              <ul className="space-y-1.5">
                {searchResults.map((result, i) => (
                  <li
                    key={i}
                    className="rounded-md border border-white/5 bg-neutral-800/60 px-3 py-2 text-neutral-300"
                  >
                    {result}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
