"use client";

import { useState } from "react";

interface GeneratedFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

interface UpdateSiteResponse {
  files: GeneratedFile[];
  preview_html?: string;
  summary: string;
}

interface WebsiteUpdaterProps {
  currentFiles: GeneratedFile[];
  onUpdate: (updatedFiles: GeneratedFile[], previewHtml?: string) => void;
}

export default function WebsiteUpdater({ currentFiles, onUpdate }: WebsiteUpdaterProps) {
  const [updateRequest, setUpdateRequest] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSummary, setLastSummary] = useState<string | null>(null);

  async function handleUpdate() {
    if (!updateRequest.trim()) return;
    setLoading(true);
    setError(null);
    setLastSummary(null);

    try {
      const res = await fetch("/api/update-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentFiles, updateRequest }),
      });

      const data: unknown = await res.json();

      if (!res.ok || (data && typeof data === "object" && "error" in data)) {
        setError(
          (data as { error?: string })?.error ||
            `Server error (${res.status})`
        );
        return;
      }

      const typed = data as UpdateSiteResponse;

      // Merge updated files into current files
      const updatedMap = new Map<string, GeneratedFile>(
        currentFiles.map((f) => [f.path, f])
      );

      for (const file of typed.files) {
        if (file.action === "delete") {
          updatedMap.delete(file.path);
        } else {
          updatedMap.set(file.path, file);
        }
      }

      const mergedFiles = Array.from(updatedMap.values());
      setLastSummary(typed.summary);
      setUpdateRequest("");
      onUpdate(mergedFiles, typed.preview_html);
    } catch (err) {
      setError((err as Error)?.message || "Failed to apply update. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleUpdate();
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t pt-3">
      <label className="text-sm font-medium text-gray-700">Edit website with AI</label>
      <div className="flex gap-2">
        <textarea
          value={updateRequest}
          onChange={(e) => setUpdateRequest(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Change the hero headline to 'Build Faster', add a pricing section, make the navbar sticky…"
          rows={2}
          className="flex-1 border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleUpdate}
          disabled={loading || !updateRequest.trim()}
          className="self-end bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {loading ? "Updating…" : "Apply Changes"}
        </button>
      </div>
      <p className="text-xs text-gray-400">Tip: Press ⌘+Enter to apply changes</p>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>
      )}

      {lastSummary && (
        <p className="text-xs text-green-700 bg-green-50 px-3 py-2 rounded">
          ✓ {lastSummary}
        </p>
      )}
    </div>
  );
}
