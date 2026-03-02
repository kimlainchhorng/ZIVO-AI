"use client";

import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  async function handleGenerate() {
    setLoading(true);
    setError("");
    setResult("");
    setSaveSuccess("");
    try {
      const res = await fetch("/api/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Failed to generate site.");
      } else {
        setResult(data.result);
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!result) {
      setError("Nothing to save. Generate a site first.");
      return;
    }
    setLoading(true);
    setError("");
    setSaveSuccess("");
    try {
      const res = await fetch("/api/save-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: "default", htmlContent: result }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Failed to save site.");
      } else {
        setSaveSuccess(data.message || "Site saved successfully!");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: 720,
        margin: "0 auto",
        padding: "48px 24px",
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
        ZIVO AI Builder
      </h1>
      <p style={{ color: "#555", marginBottom: 24 }}>
        Describe what you want to build and let AI generate the code for you.
      </p>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe what you want to build…"
        rows={5}
        style={{
          width: "100%",
          padding: "12px 14px",
          fontSize: 15,
          border: "1px solid #d1d5db",
          borderRadius: 8,
          resize: "vertical",
          boxSizing: "border-box",
          outline: "none",
        }}
      />

      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          style={{
            padding: "10px 22px",
            fontSize: 15,
            fontWeight: 600,
            backgroundColor: "#111",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: loading || !prompt.trim() ? "not-allowed" : "pointer",
            opacity: loading || !prompt.trim() ? 0.6 : 1,
          }}
        >
          {loading ? "Generating…" : "Generate"}
        </button>

        <button
          onClick={handleSave}
          disabled={loading || !result}
          style={{
            padding: "10px 22px",
            fontSize: 15,
            fontWeight: 600,
            backgroundColor: "#fff",
            color: "#111",
            border: "1px solid #d1d5db",
            borderRadius: 8,
            cursor: loading || !result ? "not-allowed" : "pointer",
            opacity: loading || !result ? 0.6 : 1,
          }}
        >
          Save
        </button>
      </div>

      {error && (
        <p
          style={{
            marginTop: 16,
            padding: "10px 14px",
            backgroundColor: "#fef2f2",
            color: "#b91c1c",
            borderRadius: 8,
            fontSize: 14,
          }}
        >
          {error}
        </p>
      )}

      {saveSuccess && (
        <p
          style={{
            marginTop: 16,
            padding: "10px 14px",
            backgroundColor: "#f0fdf4",
            color: "#15803d",
            borderRadius: 8,
            fontSize: 14,
          }}
        >
          {saveSuccess}
        </p>
      )}

      {result && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
            Generated Output
          </h2>
          <pre
            style={{
              backgroundColor: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "16px",
              overflowX: "auto",
              fontSize: 13,
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {result}
          </pre>
        </div>
      )}
    </main>
  );
}
