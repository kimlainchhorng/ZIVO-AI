'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { recordBuild } from "@/lib/analytics";

// Minimal SpeechRecognition types for browsers that support the Web Speech API
interface SpeechRecognitionResult {
  readonly 0: { readonly transcript: string };
}
interface SpeechRecognitionResultList {
  readonly 0: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

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

type AIModel = "gpt-4.1-mini" | "gpt-4o" | "gpt-4o-mini";

const MODELS: { id: AIModel; label: string }[] = [
  { id: "gpt-4.1-mini", label: "GPT-4.1 Mini (fast)" },
  { id: "gpt-4o", label: "GPT-4o (powerful)" },
  { id: "gpt-4o-mini", label: "GPT-4o Mini (balanced)" },
];

type BuildStep = "idle" | "thinking" | "generating" | "done";

const PROJECTS_KEY = "zivo_projects";

function getLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    tsx: "tsx",
    ts: "typescript",
    jsx: "jsx",
    js: "javascript",
    css: "css",
    html: "html",
    json: "json",
    md: "markdown",
    py: "python",
    sh: "bash",
    yml: "yaml",
    yaml: "yaml",
  };
  return map[ext] ?? "text";
}

function saveProject(
  prompt: string,
  output: GenerateSiteResponse,
  model: AIModel
): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    const existing = raw ? (JSON.parse(raw) as object[]) : [];
    const newProject = {
      id: Date.now().toString(),
      prompt,
      timestamp: new Date().toISOString(),
      fileCount: output.files?.length ?? 0,
      model,
      files: output.files ?? [],
      preview_html: output.preview_html,
      summary: output.summary,
    };
    const updated = [newProject, ...existing].slice(0, 50);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(updated));
  } catch {
    // storage quota exceeded — ignore
  }
}

export default function AIPage() {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState<GenerateSiteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [buildStep, setBuildStep] = useState<BuildStep>("idle");
  const [visualEdit, setVisualEdit] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<DeployResult | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [popover, setPopover] = useState<{ x: number; y: number; text: string } | null>(null);
  const [popoverInput, setPopoverInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
  const [model, setModel] = useState<AIModel>("gpt-4.1-mini");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [recording, setRecording] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Load theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("zivo_theme") as "dark" | "light" | null;
    if (saved) setTheme(saved);
  }, []);

  // Restore project from dashboard
  useEffect(() => {
    try {
      const raw = localStorage.getItem("zivo_restore");
      if (raw) {
        const project = JSON.parse(raw) as { prompt: string; files: GeneratedFile[]; preview_html?: string; summary?: string; model?: AIModel };
        setPrompt(project.prompt);
        setOutput({ files: project.files, preview_html: project.preview_html, summary: project.summary });
        if (project.model) setModel(project.model);
        localStorage.removeItem("zivo_restore");
      }
    } catch {
      // ignore
    }
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("zivo_theme", next);
  }

  const isDark = theme === "dark";
  const bg = isDark ? "#0f0f0f" : "#f9fafb";
  const textColor = isDark ? "#f9fafb" : "#111827";
  const borderColor = isDark ? "#27272a" : "#e5e7eb";
  const panelBg = isDark ? "#18181b" : "#ffffff";
  const inputBg = isDark ? "#27272a" : "#ffffff";
  const inputBorder = isDark ? "#3f3f46" : "#d1d5db";

  async function handleBuild() {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setOutput(null);
    setDeployResult(null);
    setDeployError(null);
    setSelectedFile(null);
    setBuildStep("thinking");

    const start = Date.now();

    // Simulate build step progression
    const thinkingTimer = setTimeout(() => setBuildStep("generating"), 1500);

    try {
      const res = await fetch("/api/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model }),
      });

      clearTimeout(thinkingTimer);
      setBuildStep("done");
      const data: GenerateSiteResponse = await res.json();
      setOutput(data);

      if (data.files && data.files.length > 0) {
        setSelectedFile(data.files[0]);
        saveProject(prompt, data, model);
        recordBuild(model, Date.now() - start);
      }
    } catch {
      clearTimeout(thinkingTimer);
      setBuildStep("idle");
      setOutput({ error: "Request failed" });
    }

    setLoading(false);
  }

  async function handleDownloadZip() {
    if (!output?.files?.length) return;
    setDownloadingZip(true);
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: output.files }),
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "zivo-generated.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
    setDownloadingZip(false);
  }

  function startVoiceInput() {
    if (typeof window === "undefined") return;
    const SpeechRecognitionAPI: SpeechRecognitionConstructor | undefined =
      (window as Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition ||
      (window as Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.onend = () => setRecording(false);
    recognition.onerror = () => setRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  }

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
        overlay.style.cssText = "position:fixed;inset:0;z-index:9999;cursor:crosshair;";
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
      // cross-origin iframe
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
      const data = await res.json() as DeployResult & { error?: string };
      if (data.error) {
        setDeployError(data.error);
      } else {
        setDeployResult(data);
      }
    } catch {
      setDeployError("Deploy request failed");
    }
    setDeploying(false);
  }

  const previewSrc = output?.preview_html
    ? `data:text/html;charset=utf-8,${encodeURIComponent(output.preview_html)}`
    : null;

  const buildStepLabel = {
    idle: null,
    thinking: "🤔 Thinking...",
    generating: "⚙️ Generating files...",
    done: "✅ Done",
  }[buildStep];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "system-ui, sans-serif", background: bg, color: textColor }}>
      {/* Top bar */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1.25rem", borderBottom: `1px solid ${borderColor}`, background: panelBg, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            style={{ background: "none", border: "none", cursor: "pointer", color: textColor, fontSize: "1.25rem", padding: "0.25rem" }}
            title="Toggle sidebar"
          >
            ☰
          </button>
          <a href="/" style={{ fontSize: "1.1rem", fontWeight: 700, color: textColor, textDecoration: "none" }}>⚡ ZIVO AI</a>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <a href="/dashboard" style={{ fontSize: "0.8rem", color: isDark ? "#a1a1aa" : "#6b7280", textDecoration: "none", padding: "0.3rem 0.6rem", borderRadius: "6px", border: `1px solid ${borderColor}` }}>Dashboard</a>
          <button
            onClick={toggleTheme}
            style={{ background: "none", border: `1px solid ${borderColor}`, borderRadius: "6px", cursor: "pointer", color: textColor, padding: "0.3rem 0.6rem", fontSize: "0.9rem" }}
            title="Toggle theme"
          >
            {isDark ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      {/* Main content */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", flexDirection: "row" }}>
        {/* Left panel (sidebar) */}
        <div style={{ width: sidebarOpen ? "min(42%, 420px)" : "0", minWidth: sidebarOpen ? "280px" : "0", overflow: "hidden", transition: "width 0.2s, min-width 0.2s", borderRight: `1px solid ${borderColor}`, display: "flex", flexDirection: "column", background: panelBg }}>
          <div style={{ padding: "1.25rem", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {/* Model selector */}
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: isDark ? "#a1a1aa" : "#6b7280", display: "block", marginBottom: "0.3rem" }}>AI Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value as AIModel)}
                style={{ width: "100%", padding: "0.4rem 0.6rem", border: `1px solid ${inputBorder}`, borderRadius: "6px", background: inputBg, color: textColor, fontSize: "0.875rem" }}
              >
                {MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Prompt input */}
            <div style={{ position: "relative" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: isDark ? "#a1a1aa" : "#6b7280", display: "block", marginBottom: "0.3rem" }}>Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleBuild(); }}
                placeholder="Describe the app you want to build…"
                style={{ width: "100%", minHeight: "100px", border: `1px solid ${inputBorder}`, borderRadius: "6px", padding: "0.5rem", resize: "vertical", background: inputBg, color: textColor, fontSize: "0.875rem", boxSizing: "border-box" }}
              />
              {/* Voice input button */}
              <button
                onClick={startVoiceInput}
                title={recording ? "Stop recording" : "Start voice input"}
                aria-label={recording ? "Stop recording" : "Start voice input"}
                style={{
                  position: "absolute",
                  bottom: "0.4rem",
                  right: "0.4rem",
                  background: recording ? "#ef4444" : (isDark ? "#3f3f46" : "#e5e7eb"),
                  border: "none",
                  borderRadius: "6px",
                  padding: "0.3rem 0.5rem",
                  cursor: "pointer",
                  fontSize: "1rem",
                  color: recording ? "#fff" : textColor,
                  minWidth: "44px",
                  minHeight: "44px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {recording ? "⏹️" : "🎙️"}
              </button>
            </div>
            {recording && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#ef4444", fontSize: "0.8rem" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444", animation: "pulse 1s infinite" }} />
                Recording…
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                onClick={handleBuild}
                disabled={loading || !prompt.trim()}
                style={{ flex: 1, padding: "0.6rem 1rem", background: loading ? "#3b82f6" : "#2563eb", color: "#fff", borderRadius: "8px", border: "none", cursor: loading ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "0.875rem", minHeight: "44px" }}
              >
                {loading ? "Building…" : "⚡ Build"}
              </button>
              <button
                onClick={() => setVisualEdit((v) => !v)}
                style={{ padding: "0.6rem 0.75rem", background: visualEdit ? "#7c3aed" : (isDark ? "#3f3f46" : "#e5e7eb"), color: visualEdit ? "#fff" : textColor, borderRadius: "8px", border: "none", cursor: "pointer", minHeight: "44px" }}
              >
                {visualEdit ? "✏️ ON" : "✏️"}
              </button>
            </div>

            {/* Build step progress */}
            {loading && buildStepLabel && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.85rem" }}>
                  {["thinking", "generating", "done"].map((step) => {
                    const stepOrder: Record<string, number> = { thinking: 0, generating: 1, done: 2, idle: -1 };
                    const currentOrder = stepOrder[buildStep] ?? -1;
                    const thisOrder = stepOrder[step] ?? -1;
                    const isActive = thisOrder === currentOrder;
                    const isDoneStep = thisOrder < currentOrder;
                    return (
                      <span
                        key={step}
                        style={{
                          padding: "0.2rem 0.5rem",
                          borderRadius: "99px",
                          background: isActive ? "#2563eb" : isDoneStep ? "#16a34a" : (isDark ? "#27272a" : "#f3f4f6"),
                          color: isActive || isDoneStep ? "#fff" : (isDark ? "#71717a" : "#9ca3af"),
                          fontSize: "0.75rem",
                          fontWeight: 500,
                        }}
                      >
                        {step === "thinking" ? "🤔 Thinking" : step === "generating" ? "⚙️ Generating" : "✅ Done"}
                      </span>
                    );
                  })}
                </div>
                {/* Skeleton loader */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {[100, 85, 70].map((w) => (
                    <div key={w} style={{ height: "12px", borderRadius: "6px", background: isDark ? "#27272a" : "#e5e7eb", width: `${w}%`, animation: "skeleton-pulse 1.5s ease-in-out infinite" }} />
                  ))}
                </div>
              </div>
            )}

            {/* Deploy buttons */}
            {output?.files && output.files.length > 0 && !loading && (
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  onClick={() => handleDeploy("vercel")}
                  disabled={deploying}
                  style={{ padding: "0.5rem 0.875rem", background: isDark ? "#18181b" : "#000", color: "#fff", borderRadius: "6px", border: `1px solid ${borderColor}`, cursor: deploying ? "not-allowed" : "pointer", fontSize: "0.8rem", minHeight: "44px" }}
                >
                  {deploying ? "Deploying…" : "▲ Vercel"}
                </button>
                <button
                  onClick={() => handleDeploy("netlify")}
                  disabled={deploying}
                  style={{ padding: "0.5rem 0.875rem", background: "#00c7b7", color: "#fff", borderRadius: "6px", border: "none", cursor: deploying ? "not-allowed" : "pointer", fontSize: "0.8rem", minHeight: "44px" }}
                >
                  {deploying ? "Deploying…" : "🌐 Netlify"}
                </button>
                <button
                  onClick={handleDownloadZip}
                  disabled={downloadingZip}
                  style={{ padding: "0.5rem 0.875rem", background: "#7c3aed", color: "#fff", borderRadius: "6px", border: "none", cursor: downloadingZip ? "not-allowed" : "pointer", fontSize: "0.8rem", minHeight: "44px" }}
                >
                  {downloadingZip ? "Zipping…" : "📦 ZIP"}
                </button>
              </div>
            )}

            {deployResult && (
              <div style={{ background: "#d1fae5", color: "#065f46", padding: "0.6rem 0.75rem", borderRadius: "6px", fontSize: "0.8rem" }}>
                ✅ <a href={deployResult.url} target="_blank" rel="noreferrer" style={{ color: "#065f46" }}>{deployResult.url}</a>
              </div>
            )}
            {deployError && (
              <div style={{ background: "#fee2e2", color: "#991b1b", padding: "0.6rem 0.75rem", borderRadius: "6px", fontSize: "0.8rem" }}>⚠️ {deployError}</div>
            )}
            {output?.summary && (
              <div style={{ background: isDark ? "#27272a" : "#f3f4f6", padding: "0.6rem 0.75rem", borderRadius: "6px", fontSize: "0.8rem" }}>
                <strong>Summary:</strong> {output.summary}
              </div>
            )}
            {output?.notes && (
              <div style={{ background: isDark ? "#2d2a1e" : "#fffbeb", color: isDark ? "#fde68a" : "#92400e", padding: "0.6rem 0.75rem", borderRadius: "6px", fontSize: "0.8rem" }}>
                <strong>Notes:</strong> {output.notes}
              </div>
            )}
            {output?.error && (
              <div style={{ background: "#fee2e2", color: "#991b1b", padding: "0.6rem 0.75rem", borderRadius: "6px", fontSize: "0.8rem" }}>⚠️ {output.error}</div>
            )}

            {/* Generated files list */}
            {output?.files && output.files.length > 0 && (
              <div>
                <h2 style={{ fontWeight: 600, marginBottom: "0.4rem", fontSize: "0.875rem" }}>Generated Files ({output.files.length})</h2>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                  {output.files.map((f, i) => (
                    <li key={i}>
                      <button
                        onClick={() => setSelectedFile(f)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "0.35rem 0.5rem",
                          borderRadius: "6px",
                          border: "none",
                          cursor: "pointer",
                          background: selectedFile?.path === f.path ? (isDark ? "#2563eb22" : "#dbeafe") : "transparent",
                          color: textColor,
                          fontSize: "0.8rem",
                        }}
                      >
                        <span style={{
                          background: f.action === "create" ? "#d1fae5" : f.action === "delete" ? "#fee2e2" : "#dbeafe",
                          color: f.action === "create" ? "#065f46" : f.action === "delete" ? "#991b1b" : "#1e40af",
                          padding: "0 0.35rem",
                          borderRadius: "4px",
                          fontFamily: "monospace",
                          fontSize: "0.7rem",
                        }}>
                          {f.action}
                        </span>
                        <code style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.path}</code>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right panel — code viewer + live preview */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: `1px solid ${borderColor}`, background: panelBg, padding: "0 1rem", flexShrink: 0, gap: "0.25rem" }}>
            <button
              onClick={() => setSelectedFile(null)}
              style={{ padding: "0.6rem 1rem", background: "none", border: "none", borderBottom: !selectedFile ? "2px solid #2563eb" : "2px solid transparent", cursor: "pointer", color: !selectedFile ? "#2563eb" : (isDark ? "#71717a" : "#9ca3af"), fontWeight: !selectedFile ? 600 : 400, fontSize: "0.875rem" }}
            >
              🖥️ Preview
            </button>
            {output?.files && output.files.length > 0 && (
              <button
                onClick={() => setSelectedFile(output.files![0])}
                style={{ padding: "0.6rem 1rem", background: "none", border: "none", borderBottom: selectedFile ? "2px solid #2563eb" : "2px solid transparent", cursor: "pointer", color: selectedFile ? "#2563eb" : (isDark ? "#71717a" : "#9ca3af"), fontWeight: selectedFile ? 600 : 400, fontSize: "0.875rem" }}
              >
                📄 Code
              </button>
            )}
          </div>

          {/* Content area */}
          <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
            {selectedFile ? (
              /* Code viewer */
              <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 1rem", borderBottom: `1px solid ${borderColor}`, background: panelBg, flexShrink: 0 }}>
                  <code style={{ fontSize: "0.8rem", color: isDark ? "#a1a1aa" : "#6b7280" }}>{selectedFile.path}</code>
                  <button
                    onClick={() => navigator.clipboard.writeText(selectedFile.content).catch(() => {})}
                    style={{ padding: "0.25rem 0.6rem", border: `1px solid ${borderColor}`, borderRadius: "4px", background: "none", cursor: "pointer", color: textColor, fontSize: "0.75rem" }}
                  >
                    Copy
                  </button>
                </div>
                <div style={{ flex: 1, overflow: "auto" }}>
                  <SyntaxHighlighter
                    language={getLanguage(selectedFile.path)}
                    style={oneDark}
                    customStyle={{ margin: 0, borderRadius: 0, height: "100%", minHeight: "100%" }}
                    showLineNumbers
                  >
                    {selectedFile.content}
                  </SyntaxHighlighter>
                </div>
              </div>
            ) : previewSrc ? (
              /* Live preview */
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
                  <div style={{ position: "absolute", top: popover.y, left: popover.x, background: "#fff", border: "1px solid #d1d5db", borderRadius: "8px", padding: "0.75rem", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 10000, minWidth: "200px" }}>
                    <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", color: "#6b7280" }}>Edit element text:</p>
                    <input
                      value={popoverInput}
                      onChange={(e) => setPopoverInput(e.target.value)}
                      style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "4px", padding: "0.25rem 0.5rem" }}
                    />
                    <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={() => {
                          if (output?.preview_html && popover) {
                            const updated = output.preview_html.replace(popover.text, popoverInput);
                            setOutput((prev) => prev ? { ...prev, preview_html: updated } : prev);
                          }
                          setPopover(null);
                        }}
                        style={{ flex: 1, padding: "0.25rem", background: "#2563eb", color: "#fff", borderRadius: "4px", border: "none", cursor: "pointer", fontSize: "0.75rem" }}
                      >Apply</button>
                      <button
                        onClick={() => setPopover(null)}
                        style={{ flex: 1, padding: "0.25rem", background: "#6b7280", color: "#fff", borderRadius: "4px", border: "none", cursor: "pointer", fontSize: "0.75rem" }}
                      >Cancel</button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: isDark ? "#52525b" : "#9ca3af", flexDirection: "column", gap: "0.75rem" }}>
                <span style={{ fontSize: "3rem" }}>🖥️</span>
                <span style={{ fontSize: "0.9rem" }}>Live preview will appear here after generation.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @media (max-width: 768px) {
          .ai-main { flex-direction: column !important; }
        }
      `}</style>
    </div>
  );
}
