use client;
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
  const [viewingId, setViewingId] = useState<string | null>(null);

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
        headers: {
          "Content-Type": "application/json",
        },
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

  async function deleteVersionItem(id: string) {
    try {
      const res = await fetch("/api/delete-version", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Delete failed");
      await loadVersions();
    } catch (e: any) {
      alert(e?.message || "Delete failed");
    }
  }

  useEffect(() => {
    loadVersions();
  }, []);

  const viewing = versions.find((v) => v.id === viewingId);

  return (
    <div style={{ padding: 20 }}>
      <h1>ZIVO-AI</h1>
      <button onClick={loadVersions} disabled={loading}>
        {loading ? "Loading..." : "Refresh Versions"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div style={{ marginTop: 16, padding: 12, border: "1px solid #e5e7eb", borderRadius: 12 }}>
        <h3 style={{ marginTop: 0 }}>Save Version</h3>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" style={{ width: "100%", padding: 10, marginBottom: 8, boxSizing: "border-box" }} />
        <textarea value={html} onChange={(e) => setHtml(e.target.value)} placeholder="Paste HTML here..." rows={6} style={{ width: "100%", padding: 10, boxSizing: "border-box" }} />
        <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={saveVersion} disabled={!html.trim()}> Save </button>
          <span style={{ opacity: 0.8 }}>{saveMsg}</span>
        </div>
      </div>
      {viewing && (
        <div style={{ marginTop: 16, padding: 12, border: "1px solid #3b82f6", borderRadius: 12 }}>
          <h3>Preview: {viewing.title}</h3>
          <button onClick={() => setViewingId(null)}>Close Preview</button>
          <div style={{ marginTop: 12, padding: 12, backgroundColor: "#f9fafb", borderRadius: 8, maxHeight: 400, overflow: "auto", }} dangerouslySetInnerHTML={{ __html: viewing.html }} />
        </div>
      )}
      <div style={{ marginTop: 16 }}>
        <h2>Versions</h2>
        {versions.length === 0 ? (
          <p style={{ opacity: 0.6 }}>No versions saved yet</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {versions.map((v) => (
              <li key={v.id} style={{ padding: 8, margin: "4px 0", backgroundColor: "#f5f5f5", borderRadius: 4, display: "flex", justifyContent: "space-between", alignItems: "center", }}>
                <div>
                  <strong>{v.title || "Untitled"}</strong>
                  <br />
                  <small style={{ opacity: 0.7 }}> {v.created_at ? new Date(v.created_at).toLocaleString() : ""} </small>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setViewingId(v.id)}>View</button>
                  <button onClick={() => deleteVersionItem(v.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}