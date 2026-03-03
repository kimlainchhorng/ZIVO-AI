'use client';

import { useEffect, useState } from "react";
import { getAnalytics, getAverageGenerationTime, clearAnalytics, type AnalyticsData } from "@/lib/analytics";

const PROJECTS_KEY = "zivo_projects";

interface SavedProject {
  id: string;
  prompt: string;
  timestamp: string;
  fileCount: number;
  model: string;
  files: Array<{ path: string; content: string; action: string }>;
  preview_html?: string;
  summary?: string;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [restoredId, setRestoredId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROJECTS_KEY);
      const parsed = raw ? (JSON.parse(raw) as SavedProject[]) : [];
      setProjects(parsed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch {
      setProjects([]);
    }
    setAnalytics(getAnalytics());
  }, []);

  function handleRestore(project: SavedProject) {
    // Store the selected project for restoration in the AI builder
    try {
      localStorage.setItem("zivo_restore", JSON.stringify(project));
      setRestoredId(project.id);
    } catch {
      // ignore
    }
  }

  function handleDelete(id: string) {
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    try {
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  function handleClearAnalytics() {
    clearAnalytics();
    setAnalytics(getAnalytics());
  }

  const avgTime = analytics ? getAverageGenerationTime(analytics) : 0;
  const topModel = analytics
    ? Object.entries(analytics.modelUsage).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"
    : "—";

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">📊 Dashboard</h1>
          <p className="text-sm text-zinc-400">Your saved generations and usage stats</p>
        </div>
        <a href="/ai" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition">
          + New Build
        </a>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-8">
        {/* Analytics cards */}
        {analytics && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Usage Analytics</h2>
              <button
                onClick={handleClearAnalytics}
                className="text-xs text-zinc-500 hover:text-red-400 transition"
              >
                Clear stats
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Builds", value: analytics.totalBuilds },
                { label: "Avg Gen Time", value: avgTime > 0 ? `${(avgTime / 1000).toFixed(1)}s` : "—" },
                { label: "Top Model", value: topModel },
                { label: "Projects Saved", value: projects.length },
              ].map((stat) => (
                <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <p className="text-xs text-zinc-500 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects list */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Saved Projects</h2>
          {projects.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl text-zinc-500">
              <p className="text-4xl mb-3">📁</p>
              <p>No saved projects yet.</p>
              <p className="text-sm mt-1">Build something in the <a href="/ai" className="text-blue-400 hover:underline">AI Builder</a> to see it here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{project.prompt}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                      <span>{new Date(project.timestamp).toLocaleString()}</span>
                      <span>·</span>
                      <span>{project.fileCount} file{project.fileCount !== 1 ? "s" : ""}</span>
                      <span>·</span>
                      <span>{project.model}</span>
                    </div>
                    {project.summary && (
                      <p className="text-xs text-zinc-400 mt-1 truncate">{project.summary}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {restoredId === project.id ? (
                      <a
                        href="/ai"
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded-lg transition"
                      >
                        Open in Builder →
                      </a>
                    ) : (
                      <button
                        onClick={() => handleRestore(project)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition"
                      >
                        Restore
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-red-900 text-zinc-400 hover:text-red-300 text-xs font-semibold rounded-lg transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
