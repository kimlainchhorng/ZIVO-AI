"use client";

import { useMemo, useState } from "react";

type BuilderFile = {
  action: "create" | "update" | "delete";
  path: string;
  content?: string;
};

type BuilderRes = {
  files: BuilderFile[];
  notes?: string;
  meta?: any;
};

export default function AIPage() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<"text" | "json">("text");
  const [output, setOutput] = useState("");
  const [builder, setBuilder] = useState<BuilderRes | null>(null);
  const [activePath, setActivePath] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(
    () => prompt.trim().length >= 5 && !loading,
    [prompt, loading]
  );

  const activeFile = useMemo(() => {
    if (!builder?.files?.length) return null;
    return builder.files.find((f) => f.path === activePath) || builder.files[0];
  }, [builder, activePath]);

  async function onSubmit() {
    setLoading(true);
    setError("");
    setOutput("");
    setBuilder(null);
    setActivePath("");

    try {
      const res = await fetch("/api/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          mode, // "text" or "json"
          projectName: "ZIVO AI",
          stack: "Next.js App Router + TypeScript",
          style: "premium",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);

      if (mode === "json") {
        setBuilder(data);
        const first = data?.files?.[0]?.path || "";
        setActivePath(first);
      } else {
        setOutput(data?.result ?? "");
      }
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function copyText(text: string) {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    alert("Copied ✅");
  }

  function clearAll() {
    setPrompt("");
    setOutput("");
    setBuilder(null);
    setActivePath("");
    setError("");
  }

  async function applyToGitHub() {
    const files = builder?.files || [];
    if (!files.length) {
      alert("No files to apply yet. Use Builder mode and Build first.");
      return;
    }

    const res = await fetch("/api/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files, message: "Applied from ZIVO AI Builder" }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      alert(data?.error || "Apply failed");
      return;
    }

    alert("Applied ✅ (If GitHub push is enabled, Vercel will deploy.)");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        background: "linear-gradient(180deg, #0b0f1a 0%, #070a12 100%)",
        color: "#eaeefb",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 28, letterSpacing: 0.3 }}>
              ZIVO AI Builder
            </h1>
            <p style={{ margin: "6px 0 0", opacity: 0.75 }}>
              Text mode (simple) or Builder mode (files → GitHub).
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                display: "flex",
                gap: 6,
                padding: 6,
                borderRadius: 14,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
                fontSize: 12,
              }}
            >
              <button
                type="button"
                onClick={() => setMode("text")}
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: mode === "text" ? "#ffffff" : "transparent",
                  color: mode === "text" ? "#0b0f1a" : "#eaeefb",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Text
              </button>
              <button
                type="button"
                onClick={() => setMode("json")}
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: mode === "json" ? "#ffffff" : "transparent",
                  color: mode === "json" ? "#0b0f1a" : "#eaeefb",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Builder
              </button>
            </div>

            <div
              style={{
                padding: "10px 12px",
                borderRadius: 14,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
                fontSize: 12,
                opacity: 0.9,
              }}
            >
              Local mode
            </div>
          </div>
        </div>

        <section
          style={{
            borderRadius: 18,
            padding: 16,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          }}
        >
          <label
            style={{
              display: "block",
              fontSize: 13,
              opacity: 0.8,
              marginBottom: 8,
            }}
          >
            Prompt
          </label>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder='Example: Build a Next.js landing page for "Zivo Driver" with hero, features, pricing, FAQ.'
            style={{
              width: "100%",
              minHeight: 120,
              resize: "vertical",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(0,0,0,0.25)",
              color: "#eaeefb",
              padding: 12,
              outline: "none",
              fontSize: 14,
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginTop: 10,
            }}
          >
            <button
              onClick={onSubmit}
              disabled={!canSubmit}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: canSubmit ? "#ffffff" : "rgba(255,255,255,0.12)",
                color: canSubmit ? "#0b0f1a" : "#9aa3b2",
                fontWeight: 800,
                cursor: canSubmit ? "pointer" : "not-allowed",
              }}
            >
              {loading ? "Building..." : "Build"}
            </button>

            <button
              onClick={clearAll}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "transparent",
                color: "#eaeefb",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Clear
            </button>

            {mode === "json" && (
              <button
                onClick={applyToGitHub}
                disabled={!builder?.files?.length || loading}
                style={{
                  marginLeft: 6,
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: builder?.files?.length ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.06)",
                  color: "#eaeefb",
                  cursor: builder?.files?.length ? "pointer" : "not-allowed",
                  fontWeight: 800,
                }}
              >
                Apply to GitHub
              </button>
            )}

            <div style={{ marginLeft: "auto", opacity: 0.7, fontSize: 12 }}>
              Tip: Builder mode returns files you can copy/apply
            </div>
          </div>

          {error && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 14,
                border: "1px solid rgba(255,80,80,0.35)",
                background: "rgba(255,80,80,0.08)",
                color: "#ffb4b4",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}
        </section>

        <section
          style={{
            marginTop: 16,
            borderRadius: 18,
            padding: 16,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 14, opacity: 0.85 }}>Output</h3>

            <button
              onClick={() => copyText(mode === "json" ? (activeFile?.content || "") : output)}
              style={{
                padding: "8px 10px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.08)",
                color: "#eaeefb",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              Copy
            </button>
          </div>

          {mode === "json" && builder?.files?.length ? (
            <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 12, marginTop: 10 }}>
              <div
                style={{
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(0,0,0,0.18)",
                  padding: 10,
                  maxHeight: 420,
                  overflow: "auto",
                }}
              >
                <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 8 }}>
                  Files ({builder.files.length})
                </div>
                {builder.files.map((f, idx) => {
                  const isActive = (activeFile?.path || "") === f.path;
                  return (
                    <button
                      key={f.path + idx}
                      onClick={() => setActivePath(f.path)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 10px",
                        borderRadius: 12,
                        marginBottom: 8,
                        border: "1px solid rgba(255,255,255,0.10)",
                        background: isActive ? "rgba(255,255,255,0.10)" : "transparent",
                        color: "#eaeefb",
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      <div style={{ fontWeight: 800 }}>{f.action.toUpperCase()}</div>
                      <div style={{ opacity: 0.8, wordBreak: "break-word" }}>{f.path}</div>
                    </button>
                  );
                })}
              </div>

              <pre
                style={{
                  margin: 0,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(0,0,0,0.28)",
                  padding: 12,
                  maxHeight: 420,
                  overflow: "auto",
                  whiteSpace: "pre",
                  fontSize: 12,
                  lineHeight: 1.45,
                }}
              >
                {activeFile?.content || "Select a file to preview its content."}
              </pre>
            </div>
          ) : (
            <pre
              style={{
                marginTop: 10,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(0,0,0,0.28)",
                padding: 12,
                minHeight: 240,
                overflow: "auto",
                whiteSpace: "pre-wrap",
                fontSize: 12,
                lineHeight: 1.45,
              }}
            >
              {output || "No output yet."}
            </pre>
          )}
        </section>
      </div>
    </main>
  );
}
