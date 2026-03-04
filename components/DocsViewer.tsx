"use client";

import { useState } from "react";

interface DocsViewerProps {
  code?: string;
  projectName?: string;
}

type DocTab = "README" | "Architecture" | "API" | "Changelog";

interface DocsResponse {
  readme?: string;
  architecture?: string;
  api?: string;
  changelog?: string;
  summary?: string;
}

const TABS: DocTab[] = ["README", "Architecture", "API", "Changelog"];

const TAB_KEYS: Record<DocTab, keyof Omit<DocsResponse, "summary">> = {
  README: "readme",
  Architecture: "architecture",
  API: "api",
  Changelog: "changelog",
};

export default function DocsViewer({ code, projectName }: DocsViewerProps) {
  const [activeTab, setActiveTab] = useState<DocTab>("README");
  const [loading, setLoading] = useState<boolean>(false);
  const [docs, setDocs] = useState<DocsResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [copiedTab, setCopiedTab] = useState<DocTab | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError("");
    setDocs(null);
    try {
      const res = await fetch("/api/generate-docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, projectName }),
      });
      const data: DocsResponse = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Failed to generate docs");
      setDocs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(tab: DocTab) {
    const key = TAB_KEYS[tab];
    const content = docs?.[key];
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopiedTab(tab);
    setTimeout(() => setCopiedTab(null), 2000);
  }

  const activeContent = docs ? docs[TAB_KEYS[activeTab]] : undefined;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">📚</span>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Documentation Generator
            {projectName && (
              <span className="ml-2 text-sm font-normal text-zinc-500 dark:text-zinc-400">— {projectName}</span>
            )}
          </h2>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
        >
          {loading ? (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Generating…
            </span>
          ) : (
            "Generate Docs"
          )}
        </button>
      </div>

      {error && <p className="text-xs text-red-500">❌ {error}</p>}

      {/* Summary */}
      {docs?.summary && (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-3">
          <p className="text-sm text-blue-800 dark:text-blue-300">{docs.summary}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-700">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors focus:outline-none ${
              activeTab === tab
                ? "bg-white dark:bg-zinc-900 border border-b-white dark:border-zinc-700 dark:border-b-zinc-900 -mb-px text-blue-600 dark:text-blue-400"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-2">
        {/* Architecture hint */}
        {activeTab === "Architecture" && activeContent && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">
            Mermaid diagram source:
          </p>
        )}

        {/* Copy button */}
        {activeContent && (
          <div className="flex justify-end">
            <button
              onClick={() => handleCopy(activeTab)}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              {copiedTab === activeTab ? "Copied!" : "Copy"}
            </button>
          </div>
        )}

        {/* Content block */}
        {docs ? (
          activeContent ? (
            <pre
              className="rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs p-4 overflow-x-auto"
              style={{ whiteSpace: "pre-wrap" }}
            >
              {activeContent}
            </pre>
          ) : (
            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-4">
              <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">No {activeTab} content generated.</p>
            </div>
          )
        ) : (
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-8 flex items-center justify-center">
            <p className="text-sm text-zinc-400 dark:text-zinc-500">
              {loading ? "Generating documentation..." : 'Click "Generate Docs" to get started.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
