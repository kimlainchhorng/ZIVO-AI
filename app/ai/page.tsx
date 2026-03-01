"use client";

import { useEffect, useState } from "react";

interface Version {
  id: string;
  title: string;
  html: string;
  created_at: string;
}

export default function Page() {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [html, setHtml] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [preview, setPreview] = useState<Version | null>(null);

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

  async function saveVersion() {
    setSaveMsg("");
    try {
      const res = await fetch("/api/save-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, html }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Save failed");

      setSaveMsg("Saved ✅");
      setTitle("");
      setHtml("");
      await loadVersions();
    } catch (e: any) {
      setSaveMsg(e?.message || "Save error");
    }
  }

  async function deleteVer(id: string) {
    try {
      const res = await fetch("/api/delete-version", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Delete failed");
      await loadVersions();
    } catch (e: any) {
      setError(e?.message || "Delete error");
    }
  }

  useEffect(() => {
    loadVersions();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>ZIVO-AI</h1>

      <div style={{ marginBottom: 20, padding: 12, border: "1px solid #e5e7eb", borderRadius: 12 }}>
        <h3 style={{ marginTop: 0 }}>Save Version</h3>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          style={{ width: "100%", padding: 10, marginBottom: 8, boxSizing: "border-box" }}
        />

        <textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          placeholder="Paste HTML here…"
          rows={6}
          style={{ width: "100%", padding: 10, boxSizing: "border-box" }}
        />

        <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={saveVersion} disabled={!html.trim()}>
            Save
          </button>
          <span style={{ opacity: 0.8 }}>{saveMsg}</span>
        </div>
      </div>

      {preview && (
        <div style={{ marginBottom: 20, padding: 12, border: "2px solid #3b82f6", borderRadius: 12, backgroundColor: "#f0f9ff" }}>
          <h3>Preview: {preview.title}</h3>
          <div style={{ marginBottom: 8, opacity: 0.6, fontSize: 12 }}>
            {new Date(preview.created_at).toLocaleString()}
          </div>
          <div style={{ padding: 12, backgroundColor: "white", borderRadius: 8, border: "1px solid #e5e7eb", minHeight: 100 }}>
            <div dangerouslySetInnerHTML={{ __html: preview.html }} />
          </div>
          <button onClick={() => setPreview(null)} style={{ marginTop: 8 }}>
            Close Preview
          </button>
        </div>
      )}

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2>Versions</h2>
          <button onClick={loadVersions} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}

        {versions.length === 0 ? (
          <p style={{ opacity: 0.6 }}>No versions saved yet</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {versions.map((v) => (
              <li
                key={v.id}
                style={{
                  padding: 12,
                  margin: "8px 0",
                  backgroundColor: "#f5f5f5",
                  borderRadius: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong>{v.title || "Untitled"}</strong>
                  <br />
                  <small style={{ opacity: 0.7 }}>
                    {new Date(v.created_at).toLocaleString()}
                  </small>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setPreview(v)}>View</button>
                  <button onClick={() => deleteVer(v.id)} style={{ backgroundColor: "#ef4444", color: "white" }}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}