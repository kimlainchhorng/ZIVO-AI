'use client';

import { useState } from "react";
import Link from "next/link";
import type { GeneratedFile, BuilderResponse } from "@/app/api/builder/route";

const NAV_LINKS = [
  { label: "Builder", href: "/" },
  { label: "Workflow", href: "/workflow" },
  { label: "Templates", href: "/templates" },
  { label: "History", href: "/history" },
  { label: "Dashboard", href: "/dashboard" },
];

export default function BuilderPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BuilderResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [files, setFiles] = useState<GeneratedFile[]>([]);

  const handleBuild = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setFiles([]);
    setResult(null);
    setSelectedFile(null);
    try {
      const res = await fetch("/api/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data: unknown = await res.json();
      if (
        data &&
        typeof data === "object" &&
        "files" in data &&
        Array.isArray((data as { files: unknown }).files)
      ) {
        const typed = data as BuilderResponse;
        setFiles(typed.files);
        setResult(typed);
      } else if (data && typeof data === "object" && "error" in data) {
        setError(String((data as { error: unknown }).error));
      } else {
        setError("Unexpected response from server");
      }
    } catch {
      setError("Build failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const actionColor: Record<string, string> = {
    create: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    update: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    delete: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  const filteredFiles = filter === "all" ? files : files.filter((f) => f.action === filter);

  // Group files by top-level directory for a tree-style display
  const fileGroups: Record<string, GeneratedFile[]> = {};
  for (const file of filteredFiles) {
    const parts = file.path.split("/");
    const group = parts.length > 1 ? parts[0] : "root";
    if (!fileGroups[group]) fileGroups[group] = [];
    fileGroups[group].push(file);
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between px-6 py-3">
          <h1 className="text-xl font-bold tracking-tight">⚡ ZIVO AI</h1>
          <nav className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/ai"
              className="ml-2 rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              🤖 AI Tools
            </Link>
          </nav>
        </div>
        <p className="px-6 pb-3 text-sm text-zinc-500 dark:text-zinc-400">
          Describe your app and AI will generate the files
        </p>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-6 md:flex-row">
        {/* Left panel: prompt + file list */}
        <aside className="flex w-full flex-col gap-4 md:w-80">
          {/* Prompt input */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Prompt</label>
            <textarea
              className="h-40 w-full resize-none rounded-lg border border-zinc-300 bg-white p-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="e.g. Create a Next.js TODO app with Tailwind CSS and local storage"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleBuild();
              }}
            />
            <button
              onClick={handleBuild}
              disabled={loading || !prompt.trim()}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? "Building…" : "⚡ Build (⌘↵)"}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Summary */}
          {result?.summary && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {result.summary}
            </p>
          )}

          {/* File count badge + filter */}
          {files.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Files
                </span>
                <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-bold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
                  {files.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {['all', 'create', 'update', 'delete'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-full px-3 py-1 font-medium transition ${
                      filter === f
                        ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                        : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* File tree */}
          {filteredFiles.length > 0 && (
            <div className="flex flex-col gap-2 overflow-auto">
              {Object.entries(fileGroups).map(([group, groupFiles]) => (
                <div key={group}>
                  <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
                    📁 {group}
                  </p>
                  <ul className="flex flex-col gap-0.5">
                    {groupFiles.map((file) => (
                      <li key={file.path}>
                        <button
                          onClick={() => setSelectedFile(file)}
                          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                            selectedFile?.path === file.path
                              ? "bg-zinc-200 dark:bg-zinc-800"
                              : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          }`}
                        >
                          <span
                            className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold ${actionColor[file.action] ?? ""}`}
                          >
                            {file.action}
                          </span>
                          <span className="truncate font-mono text-xs">
                            {file.path.split("/").pop() ?? file.path}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Right panel: code preview + post-build actions */}
        <main className="flex flex-1 flex-col gap-4 overflow-hidden">
          {selectedFile ? (
            <>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-semibold">{selectedFile.path}</span>
                <button
                  onClick={() => handleCopy(selectedFile.content)}
                  className="rounded-lg border border-zinc-300 px-3 py-1 text-xs font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
              <pre className="flex-1 overflow-auto rounded-xl border border-zinc-200 bg-zinc-900 p-4 text-sm text-zinc-100 dark:border-zinc-700">
                <code>{selectedFile.content}</code>
              </pre>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-zinc-300 text-sm text-zinc-400 dark:border-zinc-700">
              {loading ? "Generating files…" : "Your generated files will appear here"}
            </div>
          )}

          {/* Post-build "What's Next?" section */}
          {result && !loading && (
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                🚀 What&apos;s Next?
              </h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Link
                  href="/deploy"
                  className="flex flex-col items-start gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm transition hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-500"
                >
                  <span className="text-base">🚢</span>
                  <span className="font-medium">Deploy to Vercel</span>
                </Link>
                <Link
                  href="/device-preview"
                  className="flex flex-col items-start gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm transition hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-500"
                >
                  <span className="text-base">📱</span>
                  <span className="font-medium">Mobile Preview</span>
                </Link>
                <Link
                  href="/ai"
                  className="flex flex-col items-start gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm transition hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-500"
                >
                  <span className="text-base">🖼️</span>
                  <span className="font-medium">Generate Images</span>
                </Link>
                <Link
                  href="/mobile-pipeline"
                  className="flex flex-col items-start gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm transition hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-500"
                >
                  <span className="text-base">📲</span>
                  <span className="font-medium">Build Mobile App</span>
                </Link>
                <Link
                  href="/history"
                  className="flex flex-col items-start gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm transition hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-500"
                >
                  <span className="text-base">🕑</span>
                  <span className="font-medium">View History</span>
                </Link>
                <Link
                  href="/workflow"
                  className="flex flex-col items-start gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm transition hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-500"
                >
                  <span className="text-base">⚙️</span>
                  <span className="font-medium">Workflow</span>
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}