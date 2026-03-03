'use client';

import { useCallback, useEffect, useRef, useState } from "react";

interface GeneratedFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

interface GenerateSiteResponse {
  files?: GeneratedFile[];
  preview_html?: string;
  summary?: string;
  notes?: string;
  error?: string;
}

interface DeployResult {
  url: string;
  deploymentId: string;
}

export default function AIPage() {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState<GenerateSiteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [visualEdit, setVisualEdit] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<DeployResult | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [popover, setPopover] = useState<{ x: number; y: number; text: string } | null>(null);
  const [popoverInput, setPopoverInput] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  async function handleBuild() {
    if (!prompt.trim()) return;

    setLoading(true);
    setOutput(null);
    setDeployResult(null);
    setDeployError(null);

    try {
      const res = await fetch("/api/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data: GenerateSiteResponse = await res.json();
      setOutput(data);
    } catch {
      setOutput({ error: "Request failed" });
    }

    setLoading(false);
  }

  // Inject/remove visual-edit overlay on the preview iframe
  const applyVisualEditOverlay = useCallback((active: boolean) => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument;
      if (!doc) return;
      const existing = doc.getElementById("__zivo_overlay__");
      if (active && !existing) {
        const overlay = doc.createElement("div");
        overlay.id = "__zivo_overlay__";
        overlay.style.cssText =
          "position:fixed;inset:0;z-index:9999;cursor:crosshair;";
        overlay.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const target = e.target as HTMLElement;
          const text = target.textContent?.trim() ?? "";
          setPopover({ x: e.clientX, y: e.clientY, text });
          setPopoverInput(text);
        });
        doc.body.appendChild(overlay);
      } else if (!active && existing) {
        existing.remove();
        setPopover(null);
      }
    } catch {
      // cross-origin iframe; overlay unavailable
    }
  }, []);

  useEffect(() => {
    applyVisualEditOverlay(visualEdit);
  }, [visualEdit, output, applyVisualEditOverlay]);

  async function handleDeploy(platform: "vercel" | "netlify") {
    if (!output?.files?.length) return;
    setDeploying(true);
    setDeployError(null);
    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, files: output.files }),
      });
      const data = await res.json();
      if (data.error) {
        setDeployError(data.error);
      } else {
        setDeployResult(data as DeployResult);
      }
    } catch {
      setDeployError("Deploy request failed");
    }
    setDeploying(false);
  }

  const previewSrc = output?.preview_html
    ? `data:text/html;charset=utf-8,${encodeURIComponent(output.preview_html)}`
    : null;

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif" }}>
      {/* Left panel */}
      <div style={{ width: "40%", padding: "1.5rem", overflowY: "auto", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>ZIVO AI Builder</h1>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the app you want to build…"
          style={{ width: "100%", minHeight: "120px", border: "1px solid #d1d5db", borderRadius: "6px", padding: "0.5rem", resize: "vertical" }}
        />

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            onClick={handleBuild}
            disabled={loading}
            style={{ padding: "0.5rem 1.25rem", background: "#2563eb", color: "#fff", borderRadius: "6px", border: "none", cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Building…" : "Build"}
          </button>

          <button
            onClick={() => setVisualEdit((v) => !v)}
            style={{ padding: "0.5rem 1.25rem", background: visualEdit ? "#7c3aed" : "#6b7280", color: "#fff", borderRadius: "6px", border: "none", cursor: "pointer" }}
          >
            {visualEdit ? "✏️ Visual Edit ON" : "Visual Edit"}
          </button>

          {output?.files && output.files.length > 0 && (
            <>
              <button
                onClick={() => handleDeploy("vercel")}
                disabled={deploying}
                style={{ padding: "0.5rem 1.25rem", background: "#000", color: "#fff", borderRadius: "6px", border: "none", cursor: deploying ? "not-allowed" : "pointer" }}
              >
                {deploying ? "Deploying…" : "Deploy to Vercel"}
              </button>
              <button
                onClick={() => handleDeploy("netlify")}
                disabled={deploying}
                style={{ padding: "0.5rem 1.25rem", background: "#00c7b7", color: "#fff", borderRadius: "6px", border: "none", cursor: deploying ? "not-allowed" : "pointer" }}
              >
                {deploying ? "Deploying…" : "Deploy to Netlify"}
              </button>
            </>
          )}
        </div>

        {deployResult && (
          <div style={{ background: "#d1fae5", padding: "0.75rem", borderRadius: "6px" }}>
            ✅ Deployed:{" "}
            <a href={deployResult.url} target="_blank" rel="noreferrer" style={{ color: "#065f46" }}>
              {deployResult.url}
            </a>{" "}
            (ID: {deployResult.deploymentId})
          </div>
        )}

        {deployError && (
          <div style={{ background: "#fee2e2", color: "#991b1b", padding: "0.75rem", borderRadius: "6px" }}>
            ⚠️ {deployError}
          </div>
        )}

        {output?.summary && (
          <div style={{ background: "#f3f4f6", padding: "0.75rem", borderRadius: "6px" }}>
            <strong>Summary:</strong> {output.summary}
          </div>
        )}

        {output?.notes && (
          <div style={{ background: "#fffbeb", padding: "0.75rem", borderRadius: "6px" }}>
            <strong>Notes:</strong> {output.notes}
          </div>
        )}

        {output?.error && (
          <div style={{ background: "#fee2e2", color: "#991b1b", padding: "0.75rem", borderRadius: "6px" }}>
            ⚠️ {output.error}
          </div>
        )}

        {output?.files && output.files.length > 0 && (
          <div>
            <h2 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Generated Files</h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {output.files.map((f, i) => (
                <li key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
                  <span style={{ background: f.action === "create" ? "#d1fae5" : f.action === "delete" ? "#fee2e2" : "#dbeafe", color: "#374151", padding: "0 0.4rem", borderRadius: "4px", fontFamily: "monospace" }}>
                    {f.action}
                  </span>
                  <code>{f.path}</code>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Right panel — Live Preview */}
      <div style={{ flex: 1, position: "relative", background: "#f9fafb" }}>
        {previewSrc ? (
          <>
            <iframe
              ref={iframeRef}
              src={previewSrc}
              title="Live Preview"
              style={{ width: "100%", height: "100%", border: "none" }}
              sandbox="allow-scripts allow-same-origin"
              onLoad={() => applyVisualEditOverlay(visualEdit)}
            />
            {popover && (
              <div
                style={{
                  position: "absolute",
                  top: popover.y,
                  left: popover.x,
                  background: "#fff",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  padding: "0.75rem",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  zIndex: 10000,
                  minWidth: "200px",
                }}
              >
                <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", color: "#6b7280" }}>Edit element text:</p>
                <input
                  value={popoverInput}
                  onChange={(e) => setPopoverInput(e.target.value)}
                  style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "4px", padding: "0.25rem 0.5rem" }}
                />
                <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => {
                      // Update the preview HTML by replacing the original text
                      if (output?.preview_html && popover) {
                        const updated = output.preview_html.replace(popover.text, popoverInput);
                        setOutput((prev) => prev ? { ...prev, preview_html: updated } : prev);
                      }
                      setPopover(null);
                    }}
                    style={{ flex: 1, padding: "0.25rem", background: "#2563eb", color: "#fff", borderRadius: "4px", border: "none", cursor: "pointer", fontSize: "0.75rem" }}
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => setPopover(null)}
                    style={{ flex: 1, padding: "0.25rem", background: "#6b7280", color: "#fff", borderRadius: "4px", border: "none", cursor: "pointer", fontSize: "0.75rem" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#9ca3af", flexDirection: "column", gap: "0.5rem" }}>
            <span style={{ fontSize: "3rem" }}>🖥️</span>
            <span>Live preview will appear here after generation.</span>
          </div>
        )}
      </div>
    </div>
  );
}