use client;

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

      <div style={{ marginTop: 16 }}>
        <h2>Versions</h2>
        {versions.length === 0 ? (
          <p style={{ opacity: 0.6 }}>No versions saved yet</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {versions.map((v: any, i: number) => (
              <li
                key={v.id || i}
                style={{
                  padding: 8,
                  margin: "4px 0",
                  backgroundColor: "#f5f5f5",
                  borderRadius: 4,
                }}
              >
                <strong>{v.title || "Untitled"}</strong>
                <br />
                <small style={{ opacity: 0.7 }}>
                  {v.created_at ? new Date(v.created_at).toLocaleString() : ""}
                </small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}