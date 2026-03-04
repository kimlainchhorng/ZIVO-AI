'use client';

import { useState } from "react";
import type { GeneratedFile, BuilderResponse } from "@/app/api/builder/route";

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
    const res = await fetch("/api/generate-site", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const data = await res.json();

    if (data.files) {
      setFiles(data.files);
    } else {
      console.error(data);
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

  const filteredFiles =
    result?.files.filter((f) => filter === "all" || f.action === filter) ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-xl font-bold tracking-tight">⚡ ZIVO AI Builder</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
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

          {/* Filter */}
          {result && (
            <div className="flex gap-2 text-xs">
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
          )}

          {/* File list */}
          {filteredFiles.length > 0 && (
            <ul className="flex flex-col gap-1 overflow-auto">
              {filteredFiles.map((file) => (
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
                      className={`rounded px-1.5 py-0.5 text-xs font-semibold ${actionColor[file.action] ?? ""}`}
                    >
                      {file.action}
                    </span>
                    <span className="truncate font-mono text-xs">{file.path}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Right panel: code preview */}
        <main className="flex flex-1 flex-col gap-3 overflow-hidden">
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
          {files.map((file, index) => (
            <div key={index} className="mb-6">
              <h3 className="font-bold">{file.path}</h3>
              <pre className="bg-black text-green-400 p-4 overflow-auto text-sm">
                {file.content}
              </pre>
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}