"use client";

import { useState } from "react";

type Tab = "docker" | "kubernetes" | "terraform" | "cicd";

const s = {
  page: { minHeight: "100vh", background: "#0a0a0a", color: "#f0f0f0", padding: "32px" } as React.CSSProperties,
  title: { fontSize: 32, fontWeight: 900, margin: 0, color: "#fff" } as React.CSSProperties,
  subtitle: { color: "#888", marginTop: 8, fontSize: 16, marginBottom: 32 } as React.CSSProperties,
  tabs: { display: "flex", gap: 8, marginBottom: 28 } as React.CSSProperties,
  tab: { padding: "10px 20px", borderRadius: 10, border: "1px solid #333", background: "transparent", color: "#888", fontWeight: 700, cursor: "pointer", fontSize: 14 } as React.CSSProperties,
  tabActive: { background: "#6c47ff", color: "#fff", border: "1px solid #6c47ff" } as React.CSSProperties,
  layout: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 1100 } as React.CSSProperties,
  card: { background: "#111", borderRadius: 16, padding: 28, border: "1px solid #222" } as React.CSSProperties,
  label: { display: "block", color: "#888", fontSize: 13, marginBottom: 6, fontWeight: 600 } as React.CSSProperties,
  input: { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #333", background: "#0a0a0a", color: "#f0f0f0", fontSize: 14, boxSizing: "border-box" as const, marginBottom: 16 },
  select: { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #333", background: "#0a0a0a", color: "#f0f0f0", fontSize: 14, boxSizing: "border-box" as const, marginBottom: 16 },
  textarea: { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #333", background: "#0a0a0a", color: "#f0f0f0", fontSize: 14, boxSizing: "border-box" as const, marginBottom: 16, resize: "vertical" as const },
  btn: { padding: "12px 28px", borderRadius: 10, border: "none", background: "#6c47ff", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" } as React.CSSProperties,
  output: { background: "#0a0a0a", borderRadius: 12, padding: 20, border: "1px solid #222", fontFamily: "monospace", fontSize: 12, color: "#ccc", whiteSpace: "pre-wrap" as const, lineHeight: 1.6, minHeight: 340, overflow: "auto" },
  sectionTitle: { fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 18 } as React.CSSProperties,
  comingSoon: { color: "#555", textAlign: "center" as const, padding: "80px 0", fontSize: 16 } as React.CSSProperties,
};

export default function DevOpsPage() {
  const [tab, setTab] = useState<Tab>("docker");
  const [framework, setFramework] = useState("nodejs");
  const [appName, setAppName] = useState("");
  const [port, setPort] = useState("3000");
  const [replicas, setReplicas] = useState("2");
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) { setError("Description is required"); return; }
    setLoading(true);
    setError("");
    setOutput("");

    const endpoint = tab === "docker" ? "/api/devops/generate-docker" : "/api/devops/generate-k8s";
    const body: Record<string, unknown> = { prompt };

    if (tab === "docker") {
      body.framework = framework;
      body.port = parseInt(port) || 3000;
    } else {
      body.appName = appName || "my-app";
      body.replicas = parseInt(replicas) || 2;
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
      <h1 style={s.title}>DevOps Manager</h1>
      <p style={s.subtitle}>Generate infrastructure configuration with AI</p>

      <div style={s.tabs}>
        {(["docker", "kubernetes", "terraform", "cicd"] as Tab[]).map((t) => (
          <button
            key={t}
            style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }}
            onClick={() => { setTab(t); setOutput(""); setError(""); }}
          >
            {t === "cicd" ? "CI/CD" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {(tab === "terraform" || tab === "cicd") ? (
        <div style={{ ...s.card, maxWidth: 700 }}>
          <div style={s.comingSoon}>🚧 {tab === "terraform" ? "Terraform" : "CI/CD"} generator coming soon</div>
        </div>
      ) : (
        <div style={s.layout}>
          <div style={s.card}>
            <div style={s.sectionTitle}>
              {tab === "docker" ? "Docker Configuration" : "Kubernetes Manifests"}
            </div>
            <form onSubmit={handleGenerate}>
              {tab === "docker" ? (
                <>
                  <label style={s.label}>Framework</label>
                  <select style={s.select} value={framework} onChange={(e) => setFramework(e.target.value)}>
                    <option value="nodejs">Node.js</option>
                    <option value="nextjs">Next.js</option>
                    <option value="python">Python</option>
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                  </select>
                  <label style={s.label}>Port</label>
                  <input style={s.input} type="number" value={port} onChange={(e) => setPort(e.target.value)} placeholder="3000" />
                </>
              ) : (
                <>
                  <label style={s.label}>App Name</label>
                  <input style={s.input} type="text" value={appName} onChange={(e) => setAppName(e.target.value)} placeholder="my-app" />
                  <label style={s.label}>Replicas</label>
                  <input style={s.input} type="number" value={replicas} onChange={(e) => setReplicas(e.target.value)} placeholder="2" />
                </>
              )}
              <label style={s.label}>Describe your application *</label>
              <textarea
                style={{ ...s.textarea, minHeight: 100 }}
                placeholder="e.g. A REST API server with Redis caching and PostgreSQL database"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <button style={{ ...s.btn, opacity: loading ? 0.6 : 1 }} type="submit" disabled={loading}>
                {loading ? "Generating…" : "Generate"}
              </button>
              {error && <div style={{ marginTop: 10, color: "#f44336", fontSize: 14 }}>{error}</div>}
            </form>
          </div>

          <div style={s.card}>
            <div style={s.sectionTitle}>Output</div>
            <div style={s.output}>
              {loading ? "Generating configuration…" : output || "Your generated configuration will appear here."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
