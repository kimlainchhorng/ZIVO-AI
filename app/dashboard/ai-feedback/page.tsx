"use client";

import React, { useEffect, useState } from "react";

export default function AIFeedbackPage() {
  const [feedback, setFeedback] = useState<{ total: number; positive: number; negative: number; corrections: number } | null>(null);
  const [generationId, setGenerationId] = useState("");
  const [rating, setRating] = useState<"positive" | "negative">("positive");
  const [correction, setCorrection] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/ai/feedback")
      .then((r) => r.json())
      .then((d) => setFeedback(d.stats))
      .catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Submitting…");
    const res = await fetch("/api/ai/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generationId, rating, correction }),
    });
    const data = await res.json();
    setStatus(data.ok ? "Feedback submitted ✓" : `Error: ${data.error}`);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "system-ui, sans-serif", padding: 32 }}>
      <a href="/dashboard" style={{ color: "#888", fontSize: 13 }}>← Dashboard</a>
      <h1 style={{ fontSize: 28, fontWeight: 800, margin: "16px 0 4px" }}>🤖 AI Feedback</h1>
      <p style={{ color: "#888", marginBottom: 32 }}>Human-in-the-Loop refinement &amp; continuous learning.</p>

      {feedback && (
        <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
          {(["total", "positive", "negative", "corrections"] as const).map((k) => (
            <div key={k} style={{ flex: 1, padding: 20, background: "#111", borderRadius: 10, border: "1px solid #222", textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{feedback[k]}</div>
              <div style={{ color: "#888", fontSize: 12, textTransform: "capitalize" }}>{k}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: "#111", borderRadius: 12, border: "1px solid #222", padding: 24, maxWidth: 520 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Submit Feedback</h2>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            value={generationId}
            onChange={(e) => setGenerationId(e.target.value)}
            placeholder="Generation ID"
            required
            style={{ padding: 10, borderRadius: 8, border: "1px solid #333", background: "#0a0a0a", color: "#fff" }}
          />
          <select
            value={rating}
            onChange={(e) => setRating(e.target.value as "positive" | "negative")}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #333", background: "#0a0a0a", color: "#fff" }}
          >
            <option value="positive">👍 Positive</option>
            <option value="negative">👎 Negative</option>
          </select>
          <textarea
            value={correction}
            onChange={(e) => setCorrection(e.target.value)}
            placeholder="Correction or comment (optional)"
            rows={3}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #333", background: "#0a0a0a", color: "#fff", resize: "vertical" }}
          />
          <button type="submit" style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "#fff", color: "#000", fontWeight: 700, cursor: "pointer" }}>
            Submit
          </button>
          {status && <p style={{ color: "#aaa", fontSize: 13 }}>{status}</p>}
        </form>
      </div>
    </div>
  );
}
