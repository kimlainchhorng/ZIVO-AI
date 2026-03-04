"use client";

import { useState } from "react";

export interface SiteFile {
  path: string;
  content: string;
  action?: "create" | "update" | "delete";
}

interface WebsiteUpdaterProps {
  currentFiles: SiteFile[];
  onFilesUpdated: (updatedFiles: SiteFile[], previewHtml?: string) => void;
}

export default function WebsiteUpdater({ currentFiles, onFilesUpdated }: WebsiteUpdaterProps) {
  const [updateRequest, setUpdateRequest] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSummary, setLastSummary] = useState<string | null>(null);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!updateRequest.trim() || loading) return;

    setLoading(true);
    setError(null);
    setLastSummary(null);

    try {
      const res = await fetch("/api/update-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentFiles, updateRequest: updateRequest.trim() }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Update failed. Please try again.");
        return;
      }

      // Merge the updated files into the current files
      const updatedMap = new Map<string, SiteFile>(
        (data.files as SiteFile[]).map((f) => [f.path, f])
      );
      const merged = currentFiles
        .filter((f) => {
          const updated = updatedMap.get(f.path);
          return !updated || updated.action !== "delete";
        })
        .map((f) => updatedMap.get(f.path) ?? f);

      // Add new files that weren't in the original set
      for (const [path, file] of updatedMap.entries()) {
        if (!currentFiles.find((f) => f.path === path) && file.action !== "delete") {
          merged.push(file);
        }
      }

      onFilesUpdated(merged, data.preview_html);
      setLastSummary(data.summary || "Update applied.");
      setUpdateRequest("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="website-updater">
      <form onSubmit={handleUpdate} className="website-updater__form">
        <input
          type="text"
          value={updateRequest}
          onChange={(e) => setUpdateRequest(e.target.value)}
          placeholder='Describe a change, e.g. "change the hero background to blue"'
          disabled={loading}
          className="website-updater__input"
          aria-label="Update request"
        />
        <button
          type="submit"
          disabled={loading || !updateRequest.trim()}
          className="website-updater__button"
        >
          {loading ? "Updating…" : "Apply Update"}
        </button>
      </form>

      {error && (
        <p className="website-updater__error" role="alert">
          {error}
        </p>
      )}

      {lastSummary && !error && (
        <p className="website-updater__success" role="status">
          ✓ {lastSummary}
        </p>
      )}

      <style>{`
        .website-updater {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: #0f172a;
          border-top: 1px solid #1e293b;
        }
        .website-updater__form {
          display: flex;
          gap: 0.5rem;
        }
        .website-updater__input {
          flex: 1;
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          border: 1px solid #334155;
          background: #1e293b;
          color: #f1f5f9;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .website-updater__input:focus {
          border-color: #6366f1;
        }
        .website-updater__input::placeholder {
          color: #64748b;
        }
        .website-updater__button {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          border: none;
          background: #6366f1;
          color: #fff;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
          white-space: nowrap;
        }
        .website-updater__button:hover:not(:disabled) {
          background: #4f46e5;
        }
        .website-updater__button:disabled {
          background: #334155;
          color: #64748b;
          cursor: not-allowed;
        }
        .website-updater__error {
          color: #f87171;
          font-size: 0.8rem;
          margin: 0;
        }
        .website-updater__success {
          color: #4ade80;
          font-size: 0.8rem;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
