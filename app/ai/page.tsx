"use client";

import { useEffect, useState } from "react";

export default function Page() {
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadVersions() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/backup-list");
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to load versions");
      }

      setVersions(data?.items || []);
    } catch (e: any) {
      setError(e?.message || "Error loading versions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVersions();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>ZIVO-AI</h1>

      <button onClick={loadVersions} disabled={loading}>
        {loading ? "Loading..." : "Refresh Versions"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <ul>
        {versions.map((v: any, i: number) => (
          <li key={v.id || i}>
            {v.title || "Untitled"} - {v.created_at || ""}
          </li>
        ))}
      </ul>
    </div>
  );
}