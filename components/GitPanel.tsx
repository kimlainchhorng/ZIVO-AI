"use client";

import { useState } from "react";

interface GitFile {
  path: string;
  content: string;
}

interface GitPanelProps {
  files?: GitFile[];
  repoName?: string;
  token?: string;
}

interface GitResult {
  repoUrl?: string;
  commitSha?: string;
  prUrl?: string;
  message?: string;
}

type ActionStatus = "idle" | "loading" | "success" | "error";

export default function GitPanel({ files = [], repoName: initialRepo = "", token: initialToken = "" }: GitPanelProps) {
  const [repo, setRepo] = useState<string>(initialRepo);
  const [token, setToken] = useState<string>(initialToken);
  const [prTitle, setPrTitle] = useState<string>("");
  const [prBody, setPrBody] = useState<string>("");
  const [showPrForm, setShowPrForm] = useState<boolean>(false);

  const [createStatus, setCreateStatus] = useState<ActionStatus>("idle");
  const [pushStatus, setPushStatus] = useState<ActionStatus>("idle");
  const [prStatus, setPrStatus] = useState<ActionStatus>("idle");

  const [createResult, setCreateResult] = useState<GitResult | null>(null);
  const [pushResult, setPushResult] = useState<GitResult | null>(null);
  const [prResult, setPrResult] = useState<GitResult | null>(null);

  const [createError, setCreateError] = useState<string>("");
  const [pushError, setPushError] = useState<string>("");
  const [prError, setPrError] = useState<string>("");

  async function handleCreateRepo() {
    setCreateStatus("loading");
    setCreateError("");
    setCreateResult(null);
    try {
      const res = await fetch("/api/git", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create-repo", repoName: repo, token }),
      });
      const data: GitResult = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Failed to create repo");
      setCreateResult(data);
      setCreateStatus("success");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Unknown error");
      setCreateStatus("error");
    }
  }

  async function handlePushFiles() {
    setPushStatus("loading");
    setPushError("");
    setPushResult(null);
    try {
      const res = await fetch("/api/git", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "push-files", repoName: repo, token, files }),
      });
      const data: GitResult = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Failed to push files");
      setPushResult(data);
      setPushStatus("success");
    } catch (err) {
      setPushError(err instanceof Error ? err.message : "Unknown error");
      setPushStatus("error");
    }
  }

  async function handleCreatePR() {
    setPrStatus("loading");
    setPrError("");
    setPrResult(null);
    try {
      const res = await fetch("/api/git", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create-pr", repoName: repo, token, title: prTitle, body: prBody }),
      });
      const data: GitResult = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Failed to create PR");
      setPrResult(data);
      setPrStatus("success");
    } catch (err) {
      setPrError(err instanceof Error ? err.message : "Unknown error");
      setPrStatus("error");
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-xl">📦</span>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Git Integration</h2>
      </div>

      {/* Inputs */}
      <div className="space-y-2">
        <div>
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">Repository (owner/repo)</label>
          <input
            type="text"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder="owner/repo-name"
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">Personal Access Token</label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxx"
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleCreateRepo}
          disabled={createStatus === "loading" || !repo}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
        >
          {createStatus === "loading" ? "Creating…" : "Create Repo"}
        </button>

        <button
          onClick={handlePushFiles}
          disabled={pushStatus === "loading" || !repo}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
        >
          {pushStatus === "loading" ? "Pushing…" : "Push Files"}
        </button>

        <button
          onClick={() => setShowPrForm((v) => !v)}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-colors"
        >
          Create PR
        </button>
      </div>

      {/* PR Form */}
      {showPrForm && (
        <div className="space-y-2 rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 bg-zinc-50 dark:bg-zinc-800">
          <input
            type="text"
            value={prTitle}
            onChange={(e) => setPrTitle(e.target.value)}
            placeholder="PR Title"
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <textarea
            value={prBody}
            onChange={(e) => setPrBody(e.target.value)}
            placeholder="PR description…"
            rows={3}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
          />
          <button
            onClick={handleCreatePR}
            disabled={prStatus === "loading" || !repo || !prTitle}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
          >
            {prStatus === "loading" ? "Submitting…" : "Submit PR"}
          </button>
          {prError && <p className="text-xs text-red-500">{prError}</p>}
          {prResult && (
            <div className="text-xs text-emerald-600 dark:text-emerald-400 space-y-1">
              <p>✅ PR created successfully!</p>
              {prResult.prUrl && (
                <a href={prResult.prUrl} target="_blank" rel="noreferrer" className="underline break-all">
                  {prResult.prUrl}
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Repo result */}
      {createError && <p className="text-xs text-red-500">❌ {createError}</p>}
      {createResult && (
        <div className="text-xs text-emerald-600 dark:text-emerald-400 space-y-1">
          <p>✅ Repository created!</p>
          {createResult.repoUrl && (
            <a href={createResult.repoUrl} target="_blank" rel="noreferrer" className="underline break-all">
              {createResult.repoUrl}
            </a>
          )}
        </div>
      )}

      {/* Push Files result */}
      {pushError && <p className="text-xs text-red-500">❌ {pushError}</p>}
      {pushResult && (
        <div className="text-xs text-emerald-600 dark:text-emerald-400 space-y-1">
          <p>✅ Files pushed successfully!</p>
          {pushResult.commitSha && (
            <p className="font-mono">Commit: {pushResult.commitSha}</p>
          )}
        </div>
      )}
    </div>
  );
}
