"use client";

import { useState } from "react";

const s = {
  page: { minHeight: "100vh", background: "#0a0a0a", color: "#f0f0f0", padding: "32px" } as React.CSSProperties,
  title: { fontSize: 32, fontWeight: 900, margin: 0, color: "#fff" } as React.CSSProperties,
  subtitle: { color: "#888", marginTop: 8, fontSize: 16, marginBottom: 32 } as React.CSSProperties,
  layout: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 1100 } as React.CSSProperties,
  card: { background: "#111", borderRadius: 16, padding: 28, border: "1px solid #222" } as React.CSSProperties,
  label: { display: "block", color: "#888", fontSize: 13, marginBottom: 6, fontWeight: 600 } as React.CSSProperties,
  input: { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #333", background: "#0a0a0a", color: "#f0f0f0", fontSize: 14, boxSizing: "border-box" as const, marginBottom: 16 },
  select: { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #333", background: "#0a0a0a", color: "#f0f0f0", fontSize: 14, boxSizing: "border-box" as const, marginBottom: 16 },
  btn: { padding: "12px 28px", borderRadius: 10, border: "none", background: "#6c47ff", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" } as React.CSSProperties,
  output: { background: "#0a0a0a", borderRadius: 12, padding: 20, border: "1px solid #222", fontFamily: "monospace", fontSize: 13, color: "#ccc", whiteSpace: "pre-wrap" as const, lineHeight: 1.6, minHeight: 300, overflow: "auto" },
  sectionTitle: { fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 18 } as React.CSSProperties,
};

export default function ContentPage() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("professional");
  const [keywords, setKeywords] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) { setError("Topic is required"); return; }
    setLoading(true);
    setError("");
    setOutput("");

    const res = await fetch("/api/content/generate-blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        tone,
        keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (data.result) {
      setOutput(data.result);
    } else {
      setError(data.error || "Generation failed");
    }
  }

  return (
    <div style={s.page}>
      <h1 style={s.title}>Content Generator</h1>
      <p style={s.subtitle}>Generate blog posts and articles with AI</p>

      <div style={s.layout}>
        <div style={s.card}>
          <div style={s.sectionTitle}>Generate Blog Post</div>
          <form onSubmit={handleGenerate}>
            <label style={s.label}>Topic *</label>
            <input
              style={s.input}
              type="text"
              placeholder="e.g. The future of AI-powered development"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />

            <label style={s.label}>Tone</label>
            <select style={s.select} value={tone} onChange={(e) => setTone(e.target.value)}>
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="technical">Technical</option>
            </select>

            <label style={s.label}>Keywords (comma-separated)</label>
            <input
              style={s.input}
              type="text"
              placeholder="e.g. AI, automation, productivity"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />

            <button style={{ ...s.btn, opacity: loading ? 0.6 : 1 }} type="submit" disabled={loading}>
              {loading ? "Generating…" : "Generate Blog Post"}
            </button>
            {error && <div style={{ marginTop: 10, color: "#f44336", fontSize: 14 }}>{error}</div>}
          </form>
        </div>

        <div style={s.card}>
          <div style={s.sectionTitle}>Output</div>
          <div style={s.output}>
            {loading ? "Generating your blog post…" : output || "Your generated content will appear here."}
          </div>
        </div>
      </div>
    </div>
  );
}
