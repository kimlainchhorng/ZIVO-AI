"use client";

import { useState } from "react";

const s = {
  page: { minHeight: "100vh", background: "#0a0a0a", color: "#f0f0f0", padding: "32px" } as React.CSSProperties,
  title: { fontSize: 32, fontWeight: 900, margin: 0, color: "#fff" } as React.CSSProperties,
  subtitle: { color: "#888", marginTop: 8, fontSize: 16, marginBottom: 32 } as React.CSSProperties,
  card: { background: "#111", borderRadius: 16, padding: 28, border: "1px solid #222", marginBottom: 24, maxWidth: 700 } as React.CSSProperties,
  sectionTitle: { fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 18 } as React.CSSProperties,
  label: { display: "block", color: "#888", fontSize: 13, marginBottom: 6, fontWeight: 600 } as React.CSSProperties,
  textarea: { width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #333", background: "#0a0a0a", color: "#f0f0f0", fontSize: 14, resize: "vertical" as const, boxSizing: "border-box" as const, lineHeight: 1.5 },
  select: { width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #333", background: "#0a0a0a", color: "#f0f0f0", fontSize: 15, boxSizing: "border-box" as const },
  btn: { padding: "12px 28px", borderRadius: 10, border: "none", background: "#6c47ff", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" } as React.CSSProperties,
  fieldGroup: { marginBottom: 20 } as React.CSSProperties,
};

export default function AiTrainingPage() {
  const [brandVoice, setBrandVoice] = useState("");
  const [codeStyle, setCodeStyle] = useState("standard");
  const [customPrompt, setCustomPrompt] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    const res = await fetch("/api/ai-training/fine-tune", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandVoice, codeStyle, customPrompt }),
    });
    const data = await res.json();
    setLoading(false);

    if (data.ok) {
      setStatus(`✓ ${data.message} (Job ID: ${data.jobId})`);
    } else {
      setStatus(`Error: ${data.error}`);
    }
  }

  return (
    <div style={s.page}>
      <h1 style={s.title}>AI Training</h1>
      <p style={s.subtitle}>Customize how ZIVO AI generates code and content for your team</p>

      <form onSubmit={handleSubmit}>
        <div style={s.card}>
          <div style={s.sectionTitle}>Brand Voice</div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Describe your brand's tone and communication style</label>
            <textarea
              style={{ ...s.textarea, minHeight: 120 }}
              placeholder="e.g. Professional but approachable. We use clear, concise language. Avoid jargon. Focus on user benefits..."
              value={brandVoice}
              onChange={(e) => setBrandVoice(e.target.value)}
            />
          </div>
        </div>

        <div style={s.card}>
          <div style={s.sectionTitle}>Code Style</div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Preferred coding style guide</label>
            <select
              style={s.select}
              value={codeStyle}
              onChange={(e) => setCodeStyle(e.target.value)}
            >
              <option value="standard">Standard</option>
              <option value="airbnb">Airbnb</option>
              <option value="google">Google</option>
            </select>
          </div>
        </div>

        <div style={s.card}>
          <div style={s.sectionTitle}>Custom System Prompt</div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Additional instructions for the AI model</label>
            <textarea
              style={{ ...s.textarea, minHeight: 160 }}
              placeholder="e.g. Always use TypeScript. Prefer functional components. Include error handling. Add JSDoc comments to exported functions..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
            />
          </div>
          <button style={{ ...s.btn, opacity: loading ? 0.6 : 1 }} type="submit" disabled={loading}>
            {loading ? "Submitting…" : "Save & Fine-tune"}
          </button>
          {status && (
            <div style={{ marginTop: 14, fontSize: 14, color: status.startsWith("✓") ? "#4caf50" : "#f44336" }}>
              {status}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
