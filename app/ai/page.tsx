"use client";

import { useMemo, useState } from "react";

type GeneratedFile = {
  path: string;
  content?: string;
  language?: string;
};

type BuilderRes = {
  files: GeneratedFile[];
  preview_html?: string;
  summary?: string;
};

export default function AIPage() {
  const [prompt, setPrompt] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [builder, setBuilder] = useState<BuilderRes | null>(null);
  const [activePath, setActivePath] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rightTab, setRightTab] = useState<"preview" | "code">("preview");

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
    setPreviewHtml("");
    setBuilder(null);
    setActivePath("");

    try {
      const res = await fetch("/api/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);

      setBuilder(data);
      setPreviewHtml(data?.preview_html ?? "");
      const first = data?.files?.[0]?.path || "";
      setActivePath(first);
      setRightTab("preview");
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function clearAll() {
    setPrompt("");
    setPreviewHtml("");
    setBuilder(null);
    setActivePath("");
    setError("");
  }

  const styles = {
    root: {
      display: "flex" as const,
      height: "100vh",
      overflow: "hidden",
      background: "#0f0f11",
      color: "#f0f0f5",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
    },
    leftPanel: {
      width: "40%",
      minWidth: 320,
      maxWidth: 520,
      display: "flex" as const,
      flexDirection: "column" as const,
      borderRight: "1px solid #2a2a35",
      background: "#1a1a1f",
      overflow: "hidden",
    },
    leftHeader: {
      padding: "20px 20px 16px",
      borderBottom: "1px solid #2a2a35",
    },
    logoRow: {
      display: "flex" as const,
      alignItems: "center",
      gap: 10,
      marginBottom: 4,
    },
    logoIcon: {
      width: 28,
      height: 28,
      borderRadius: 8,
      background: "linear-gradient(135deg, #22c55e, #16a34a)",
      display: "flex" as const,
      alignItems: "center",
      justifyContent: "center",
      fontSize: 14,
      fontWeight: 800,
      color: "#fff",
    },
    title: {
      margin: 0,
      fontSize: 18,
      fontWeight: 700,
      color: "#f0f0f5",
    },
    subtitle: {
      margin: 0,
      fontSize: 12,
      color: "#888899",
    },
    leftBody: {
      flex: 1,
      display: "flex" as const,
      flexDirection: "column" as const,
      padding: 16,
      gap: 12,
      overflow: "hidden",
    },
    textarea: (hasError: boolean) => ({
      width: "100%",
      flex: 1,
      minHeight: 120,
      maxHeight: 200,
      resize: "none" as const,
      borderRadius: 12,
      border: hasError ? "1px solid rgba(239,68,68,0.7)" : "1px solid #2a2a35",
      background: "#0f0f11",
      color: "#f0f0f5",
      padding: "12px 14px",
      outline: "none",
      fontSize: 14,
      lineHeight: 1.55,
      boxSizing: "border-box" as const,
    }),
    errorMsg: {
      fontSize: 12,
      color: "#f87171",
      padding: "8px 12px",
      borderRadius: 8,
      background: "rgba(239,68,68,0.1)",
      border: "1px solid rgba(239,68,68,0.25)",
    },
    buttonRow: {
      display: "flex" as const,
      gap: 8,
    },
    buildBtn: (enabled: boolean) => ({
      flex: 1,
      padding: "11px 0",
      borderRadius: 10,
      border: "none",
      background: enabled ? "#22c55e" : "#1a3d27",
      color: enabled ? "#fff" : "#4a7a5a",
      fontWeight: 700,
      fontSize: 14,
      cursor: enabled ? "pointer" : "not-allowed",
      transition: "background 0.15s",
    }),
    clearBtn: {
      padding: "11px 16px",
      borderRadius: 10,
      border: "1px solid #2a2a35",
      background: "transparent",
      color: "#888899",
      fontWeight: 600,
      fontSize: 14,
      cursor: "pointer",
    },
    fileTreeHeader: {
      fontSize: 11,
      fontWeight: 700,
      color: "#888899",
      textTransform: "uppercase" as const,
      letterSpacing: 0.8,
      marginBottom: 6,
    },
    fileTree: {
      flex: 1,
      overflow: "auto" as const,
      display: "flex" as const,
      flexDirection: "column" as const,
      gap: 2,
    },
    fileItem: (isActive: boolean) => ({
      display: "flex" as const,
      alignItems: "center",
      gap: 8,
      padding: "8px 10px",
      borderRadius: 8,
      border: "none",
      background: isActive ? "rgba(34,197,94,0.12)" : "transparent",
      color: isActive ? "#22c55e" : "#c0c0cc",
      cursor: "pointer" as const,
      fontSize: 12,
      fontWeight: isActive ? 600 : 400,
      textAlign: "left" as const,
      width: "100%",
      transition: "background 0.1s",
    }),
    skeleton: (opacity: number) => ({
      borderRadius: 8,
      background: "linear-gradient(90deg, #1a1a1f 25%, #2a2a35 50%, #1a1a1f 75%)",
      backgroundSize: "200% 100%",
      animation: "skeletonPulse 1.5s infinite",
      height: 32,
      marginBottom: 4,
      opacity,
    }),
    rightPanel: {
      flex: 1,
      display: "flex" as const,
      flexDirection: "column" as const,
      background: "#0f0f11",
      overflow: "hidden",
    },
    rightHeader: {
      display: "flex" as const,
      alignItems: "center",
      padding: "0 20px",
      borderBottom: "1px solid #2a2a35",
      background: "#1a1a1f",
      height: 48,
      flexShrink: 0,
    },
    tab: (isActive: boolean) => ({
      padding: "0 18px",
      height: "100%",
      display: "flex" as const,
      alignItems: "center",
      fontSize: 13,
      fontWeight: isActive ? 600 : 400,
      color: isActive ? "#f0f0f5" : "#888899",
      cursor: "pointer" as const,
      background: "transparent",
      border: "none",
      borderBottom: isActive ? "2px solid #22c55e" : "2px solid transparent",
    }),
    rightBody: {
      flex: 1,
      overflow: "hidden",
      position: "relative" as const,
    },
    iframe: {
      width: "100%",
      height: "100%",
      border: "none",
      background: "#fff",
    },
    placeholder: {
      position: "absolute" as const,
      inset: 0,
      display: "flex" as const,
      flexDirection: "column" as const,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      color: "#888899",
    },
    placeholderText: {
      fontSize: 14,
      opacity: 0.6,
    },
    codeBlock: {
      position: "absolute" as const,
      inset: 0,
      overflow: "auto" as const,
      padding: 20,
    },
    pre: {
      margin: 0,
      padding: 20,
      borderRadius: 12,
      background: "#0a0a0c",
      border: "1px solid #2a2a35",
      fontSize: 12,
      lineHeight: 1.6,
      color: "#c9d1d9",
      whiteSpace: "pre" as const,
      overflow: "auto" as const,
      fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
    },
  };

  return (
    <>
      <style>{`
        @keyframes skeletonPulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes dotPulse {
          0% { opacity: 0.3; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1.2); }
        }
        * { box-sizing: border-box; }
        body { margin: 0; }
        textarea::placeholder { color: #555566; }
      `}</style>
      <div style={styles.root}>
        {/* LEFT PANEL */}
        <div style={styles.leftPanel}>
          <div style={styles.leftHeader}>
            <div style={styles.logoRow}>
              <div style={styles.logoIcon}>Z</div>
              <h1 style={styles.title}>ZIVO AI Builder</h1>
            </div>
            <p style={styles.subtitle}>Describe your app and watch it come to life</p>
          </div>

          <div style={styles.leftBody}>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to build..."
              style={styles.textarea(!!error)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && canSubmit) {
                  onSubmit();
                }
              }}
            />

            {error && <div style={styles.errorMsg}>{error}</div>}

            <div style={styles.buttonRow}>
              <button onClick={onSubmit} disabled={!canSubmit} style={styles.buildBtn(canSubmit)}>
                {loading ? "Building..." : "Build"}
              </button>
              <button onClick={clearAll} style={styles.clearBtn}>Clear</button>
            </div>

            {loading && (
              <div>
                <div style={styles.fileTreeHeader}>Generating files…</div>
                {[1, 0.7, 0.4].map((op, i) => (
                  <div key={i} style={styles.skeleton(op)} />
                ))}
              </div>
            )}

            {!loading && builder?.files?.length ? (
              <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
                <div style={styles.fileTreeHeader}>
                  Files ({builder.files.length})
                </div>
                <div style={styles.fileTree}>
                  {builder.files.map((f, idx) => {
                    const isActive = activeFile?.path === f.path;
                    const ext = f.path.split(".").pop() || "";
                    const icon =
                      ext === "html" ? "🌐"
                      : ext === "tsx" || ext === "ts" ? "⚛️"
                      : ext === "css" ? "🎨"
                      : ext === "json" ? "📋"
                      : "📄";
                    return (
                      <button
                        key={f.path + idx}
                        onClick={() => {
                          setActivePath(f.path);
                          setRightTab("code");
                        }}
                        style={styles.fileItem(isActive)}
                      >
                        <span>{icon}</span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {f.path}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {builder.summary && (
                  <div style={{ fontSize: 11, color: "#888899", padding: "8px 0", borderTop: "1px solid #2a2a35", marginTop: 8 }}>
                    {builder.summary}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={styles.rightPanel}>
          <div style={styles.rightHeader}>
            <button
              style={styles.tab(rightTab === "preview")}
              onClick={() => setRightTab("preview")}
            >
              Preview
            </button>
            <button
              style={styles.tab(rightTab === "code")}
              onClick={() => setRightTab("code")}
            >
              Code
            </button>
            {activeFile && rightTab === "code" && (
              <span style={{ marginLeft: 12, fontSize: 12, color: "#888899" }}>
                {activeFile.path}
              </span>
            )}
          </div>

          <div style={styles.rightBody}>
            {rightTab === "preview" ? (
              previewHtml ? (
                <iframe
                  style={styles.iframe}
                  srcDoc={previewHtml}
                  sandbox="allow-scripts"
                  title="Live Preview"
                />
              ) : (
                <div style={styles.placeholder}>
                  <span style={{ fontSize: 40, opacity: 0.4 }}>🖥️</span>
                  <div style={styles.placeholderText}>
                    {loading ? "Generating your app..." : "Your app will appear here"}
                  </div>
                  {loading && (
                    <div style={{ display: "flex", gap: 6 }}>
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "#22c55e",
                            animation: `dotPulse ${0.6 + i * 0.2}s ease-in-out infinite alternate`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            ) : (
              <div style={styles.codeBlock}>
                <pre style={styles.pre}>
                  <code>{activeFile?.content || "Select a file from the left panel to view its code."}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
