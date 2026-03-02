"use client";

import { useEffect, useState } from "react";

export default function LocalizationPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/localization")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "system-ui, sans-serif", padding: 32 }}>
      <a href="/dashboard" style={{ color: "#888", fontSize: 13 }}>← Dashboard</a>
      <h1 style={{ fontSize: 28, fontWeight: 800, margin: "16px 0 4px" }}>🌍 Localization Manager</h1>
      <p style={{ color: "#888", marginBottom: 32 }}>100+ language support & regional customization.</p>

      <div style={{ background: "#111", borderRadius: 12, border: "1px solid #222", padding: 24 }}>
        {loading ? (
          <p style={{ color: "#555" }}>Loading…</p>
        ) : (
          <pre style={{ color: "#aaa", fontSize: 12, overflow: "auto", maxHeight: 400 }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
