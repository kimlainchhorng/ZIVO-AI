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

const COLORS = {
  bg: "#0a0b14",
  bgPanel: "#0f1120",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  borderHover: "rgba(255,255,255,0.16)",
  accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#475569",
};

const QUICK_PROMPTS = [
  { emoji: "🚀", label: "Landing Page", prompt: "Build a modern SaaS landing page with hero, features, pricing, and CTA sections" },
  { emoji: "📋", label: "Todo App", prompt: "Build a todo app with categories, due dates, and local storage persistence" },
  { emoji: "🛒", label: "E-commerce", prompt: "Build an e-commerce product listing page with cart and checkout flow" },
  { emoji: "🔐", label: "Auth Flow", prompt: "Build a complete authentication flow with login, signup, and password reset pages" },
  { emoji: "📊", label: "Dashboard", prompt: "Build an analytics dashboard with charts, stats cards, and data tables" },
];

const MODELS = [
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4.1-mini", label: "GPT-4.1-mini" },
  { value: "gpt-4o-mini", label: "GPT-4o-mini" },
];

const LOADING_STEP1_DELAY = 800;
const LOADING_STEP2_DELAY = 2000;

function getSpeechRecognitionAPI(): typeof SpeechRecognition | null {
  if (typeof window === "undefined") return null;
  return (
    (window as Window & { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
    (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition ||
    null
  );
}

function getFileIcon(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "tsx" || ext === "ts") return "📄";
  if (ext === "jsx" || ext === "js") return "📙";
  if (ext === "css") return "🎨";
  if (ext === "json") return "📦";
  if (ext === "html") return "🌐";
  if (ext === "md") return "📝";
  return "📄";
}

function getActionStyle(action: string): React.CSSProperties {
  if (action === "create") return { background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" };
  if (action === "delete") return { background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" };
  return { background: "rgba(99,102,241,0.15)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.3)" };
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
  const [activeFile, setActiveFile] = useState<GeneratedFile | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "console">("preview");
  const [deviceMode, setDeviceMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [model, setModel] = useState("gpt-4o");
  const [isRecording, setIsRecording] = useState(false);
  const [buildTime, setBuildTime] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [copyLabel, setCopyLabel] = useState("💾 Save");
  const [copyFileLabel, setCopyFileLabel] = useState("📋 Copy");
  const [loadingStep, setLoadingStep] = useState(0);
  const [activeNav, setActiveNav] = useState<"builder" | "dashboard" | "connectors">("builder");
  const [consoleLogs, setConsoleLogs] = useState<Array<{ text: string; type: "info" | "success" | "error" }>>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const iframeWidth = deviceMode === "mobile" ? "390px" : deviceMode === "tablet" ? "768px" : "100%";

  async function handleBuild() {
    if (!prompt.trim()) return;
    setLoading(true);
    setLoadingStep(0);
    setOutput(null);
    setDeployResult(null);
    setDeployError(null);
    setDownloadError(null);
    setActiveFile(null);
    setConsoleLogs([{ text: "> Building project...", type: "info" }]);

    const buildStart = Date.now();
    const stepTimer1 = setTimeout(() => setLoadingStep(1), LOADING_STEP1_DELAY);
    const stepTimer2 = setTimeout(() => setLoadingStep(2), LOADING_STEP2_DELAY);

    try {
      const res = await fetch("/api/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model }),
      });
      const data: GenerateSiteResponse = await res.json();
      setOutput(data);
      if (data.files?.length) setActiveFile(data.files[0]);
      const duration = Date.now() - buildStart;
      setBuildTime(`${(duration / 1000).toFixed(1)}s`);
      const fileLogs = data.files?.map((f) => ({ text: `> Created: ${f.path}`, type: "success" as const })) ?? [];
      setConsoleLogs((prev) => [
        ...prev,
        ...fileLogs,
        { text: `> Build complete in ${duration}ms ✓`, type: "success" },
      ]);
    } catch {
      setOutput({ error: "Request failed" });
      setConsoleLogs((prev) => [...prev, { text: "> Error: Request failed", type: "error" }]);
    }

    clearTimeout(stepTimer1);
    clearTimeout(stepTimer2);
    setLoading(false);
    setLoadingStep(0);
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
      // cross-origin iframe; overlay unavailable
    }
  }, []);

  useEffect(() => {
    applyVisualEditOverlay(visualEdit);
  }, [visualEdit, output, applyVisualEditOverlay]);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [consoleLogs]);

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

  async function handleDownload() {
    if (!output?.files?.length) return;
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: output.files }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "zivo-app.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setDownloadError("Download failed. Please try again.");
    }
  }

  function handleVoiceInput() {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const SpeechRecognitionAPI = getSpeechRecognitionAPI();
    if (!SpeechRecognitionAPI) return;
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0][0].transcript;
      setPrompt((prev) => prev + (prev ? " " : "") + transcript);
    };
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }

  const previewSrc = output?.preview_html
    ? `data:text/html;charset=utf-8,${encodeURIComponent(output.preview_html)}`
    : null;

  const hasFiles = Boolean(output?.files?.length);

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes recordPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); } 70% { box-shadow: 0 0 0 8px rgba(239,68,68,0); } }
        @keyframes statusBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .zivo-btn:hover { opacity: 0.85; transform: scale(1.02); }
        .zivo-btn { transition: opacity 0.15s, transform 0.15s; }
        .zivo-chip:hover { background: rgba(99,102,241,0.2) !important; border-color: rgba(99,102,241,0.4) !important; }
        .zivo-file:hover { background: rgba(255,255,255,0.06) !important; }
        .zivo-tab:hover { color: #f1f5f9 !important; }
        .zivo-nav:hover { color: #f1f5f9 !important; }
        .zivo-textarea:focus { outline: none; border-color: #6366f1 !important; box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.4); }
        .zivo-input:focus { outline: none; border-color: #6366f1 !important; }
        .zivo-select:focus { outline: none; border-color: #6366f1 !important; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: COLORS.bg, color: COLORS.textPrimary, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", overflow: "hidden" }}>

        {/* Top Nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1.5rem", height: "52px", borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "28px", height: "28px", background: COLORS.accentGradient, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700 }}>Z</div>
            <span style={{ fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.01em" }}>ZIVO AI</span>
            <div style={{ width: "1px", height: "20px", background: COLORS.border, margin: "0 0.25rem" }} />
            <nav style={{ display: "flex", gap: "0.25rem" }}>
              {(["builder", "dashboard", "connectors"] as const).map((nav) => (
                <button
                  key={nav}
                  className="zivo-nav"
                  onClick={() => setActiveNav(nav)}
                  style={{ padding: "0.25rem 0.75rem", background: activeNav === nav ? "rgba(99,102,241,0.15)" : "transparent", color: activeNav === nav ? COLORS.accent : COLORS.textSecondary, borderRadius: "6px", border: activeNav === nav ? `1px solid rgba(99,102,241,0.3)` : "1px solid transparent", cursor: "pointer", fontSize: "0.8125rem", fontWeight: 500, textTransform: "capitalize", transition: "color 0.15s" }}
                >
                  {nav.charAt(0).toUpperCase() + nav.slice(1)}
                </button>
              ))}
            </nav>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: COLORS.success, boxShadow: `0 0 6px ${COLORS.success}` }} />
            <span style={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>Ready</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: COLORS.accentGradient, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.875rem" }}>N</div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* Left Panel */}
          <div style={{ width: "40%", minWidth: "360px", display: "flex", flexDirection: "column", borderRight: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, overflow: "hidden" }}>

            {/* Scrollable content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>

              {/* Header */}
              <div style={{ marginBottom: "1.25rem" }}>
                <h1 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.25rem", letterSpacing: "-0.02em" }}>Build full-stack apps with AI</h1>
                <p style={{ fontSize: "0.8125rem", color: COLORS.textSecondary, margin: 0 }}>Describe what you want — ZIVO generates the code instantly</p>
              </div>

              {/* Prompt Section */}
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ position: "relative" }}>
                  <textarea
                    className="zivo-textarea"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                        e.preventDefault();
                        handleBuild();
                      }
                    }}
                    placeholder="Describe the app you want to build... (e.g. A todo app with Supabase auth and dark mode)"
                    style={{ width: "100%", minHeight: "120px", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "0.75rem", resize: "vertical", color: COLORS.textPrimary, fontSize: "0.875rem", lineHeight: 1.6, transition: "border-color 0.2s" }}
                  />
                  <span style={{ position: "absolute", bottom: "0.5rem", right: "0.75rem", fontSize: "0.7rem", color: COLORS.textMuted }}>{prompt.length} / 2000</span>
                </div>
              </div>

              {/* Quick Prompts */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
                {QUICK_PROMPTS.map((qp) => (
                  <button
                    key={qp.label}
                    className="zivo-chip"
                    onClick={() => setPrompt(qp.prompt)}
                    style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.3rem 0.65rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "20px", color: COLORS.textSecondary, cursor: "pointer", fontSize: "0.75rem", transition: "background 0.15s, border-color 0.15s" }}
                  >
                    <span>{qp.emoji}</span>
                    <span>{qp.label}</span>
                  </button>
                ))}
              </div>

              {/* Controls Row */}
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", alignItems: "center" }}>
                <select
                  className="zivo-select"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  style={{ flex: 1, background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textPrimary, padding: "0.45rem 0.65rem", fontSize: "0.8125rem", cursor: "pointer", transition: "border-color 0.2s" }}
                >
                  {MODELS.map((m) => (
                    <option key={m.value} value={m.value} style={{ background: COLORS.bgPanel }}>{m.label}</option>
                  ))}
                </select>

                <button
                  className="zivo-btn"
                  onClick={handleVoiceInput}
                  title={isRecording ? "Stop recording" : "Voice input"}
                  style={{ width: "36px", height: "36px", borderRadius: "8px", background: isRecording ? "rgba(239,68,68,0.15)" : COLORS.bgCard, border: `1px solid ${isRecording ? "rgba(239,68,68,0.4)" : COLORS.border}`, color: isRecording ? "#ef4444" : COLORS.textSecondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", animation: isRecording ? "recordPulse 1.5s infinite" : "none", flexShrink: 0 }}
                >
                  🎙
                </button>

                <button
                  className="zivo-btn"
                  onClick={() => { setPrompt(""); setOutput(null); setDeployResult(null); setDeployError(null); setActiveFile(null); }}
                  style={{ padding: "0.45rem 0.75rem", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textSecondary, cursor: "pointer", fontSize: "0.8125rem", flexShrink: 0 }}
                >
                  Clear
                </button>
              </div>

              {/* Build Button */}
              <button
                className="zivo-btn"
                onClick={handleBuild}
                disabled={loading || !prompt.trim()}
                style={{ width: "100%", padding: "0.7rem", background: loading || !prompt.trim() ? "rgba(99,102,241,0.3)" : COLORS.accentGradient, color: "#fff", borderRadius: "10px", border: "none", cursor: loading || !prompt.trim() ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "0.9375rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "1.25rem" }}
              >
                {loading ? (
                  <>
                    <span style={{ display: "inline-block", width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    Building…
                  </>
                ) : (
                  <>⚡ Build</>
                )}
              </button>

              {/* Notifications */}
              {deployResult && (
                <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", padding: "0.75rem", borderRadius: "8px", marginBottom: "0.75rem", animation: "fadeIn 0.3s ease", fontSize: "0.875rem" }}>
                  ✅ Deployed:{" "}
                  <a href={deployResult.url} target="_blank" rel="noreferrer" style={{ color: COLORS.success }}>
                    {deployResult.url}
                  </a>
                </div>
              )}
              {deployError && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: COLORS.error, padding: "0.75rem", borderRadius: "8px", marginBottom: "0.75rem", fontSize: "0.875rem" }}>
                  ⚠️ {deployError}
                </div>
              )}
              {downloadError && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: COLORS.error, padding: "0.75rem", borderRadius: "8px", marginBottom: "0.75rem", fontSize: "0.875rem" }}>
                  ⚠️ {downloadError}
                </div>
              )}
              {output?.error && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: COLORS.error, padding: "0.75rem", borderRadius: "8px", marginBottom: "0.75rem", fontSize: "0.875rem" }}>
                  ⚠️ {output.error}
                </div>
              )}
              {output?.summary && (
                <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, padding: "0.75rem", borderRadius: "8px", marginBottom: "0.75rem", fontSize: "0.8125rem", color: COLORS.textSecondary, animation: "fadeIn 0.3s ease" }}>
                  <span style={{ color: COLORS.textPrimary, fontWeight: 600 }}>Summary:</span> {output.summary}
                </div>
              )}

              {/* File Tree */}
              {hasFiles && output?.files && (
                <div style={{ animation: "fadeIn 0.4s ease" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <h2 style={{ fontSize: "0.8125rem", fontWeight: 600, color: COLORS.textSecondary, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>Generated Files</h2>
                    <span style={{ fontSize: "0.75rem", color: COLORS.textMuted }}>{output.files.length} files</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    {output.files.map((f, i) => (
                      <div
                        key={i}
                        className="zivo-file"
                        onClick={() => { setActiveFile(f); setActiveTab("code"); }}
                        style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.5rem", borderRadius: "6px", cursor: "pointer", background: activeFile?.path === f.path ? "rgba(99,102,241,0.12)" : "transparent", border: activeFile?.path === f.path ? "1px solid rgba(99,102,241,0.25)" : "1px solid transparent", transition: "background 0.15s" }}
                      >
                        <span style={{ fontSize: "0.875rem" }}>{getFileIcon(f.path)}</span>
                        <span style={{ flex: 1, fontSize: "0.8125rem", color: activeFile?.path === f.path ? COLORS.textPrimary : COLORS.textSecondary, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.path}</span>
                        <span style={{ fontSize: "0.65rem", fontWeight: 600, padding: "1px 6px", borderRadius: "4px", textTransform: "uppercase", flexShrink: 0, ...getActionStyle(f.action) }}>{f.action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            {hasFiles && (
              <div style={{ padding: "0.875rem 1.25rem", borderTop: `1px solid ${COLORS.border}`, display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                <button
                  className="zivo-btn"
                  onClick={handleDownload}
                  style={{ flex: 1, padding: "0.5rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textSecondary, cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}
                >
                  ⬇ ZIP
                </button>
                <button
                  className="zivo-btn"
                  onClick={() => handleDeploy("vercel")}
                  disabled={deploying}
                  style={{ flex: 1, padding: "0.5rem", background: deploying ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "8px", color: COLORS.success, cursor: deploying ? "not-allowed" : "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}
                >
                  🚀 {deploying ? "…" : "Deploy"}
                </button>
                <button
                  className="zivo-btn"
                  onClick={() => {
                    const all = output?.files?.map((f) => `// ${f.path}\n${f.content}`).join("\n\n---\n\n") ?? "";
                    navigator.clipboard.writeText(all).then(() => {
                      setCopyLabel("✅ Saved!");
                      setTimeout(() => setCopyLabel("💾 Save"), 2000);
                    }).catch(() => {});
                  }}
                  style={{ flex: 1, padding: "0.5rem", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textSecondary, cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}
                >
                  {copyLabel}
                </button>
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: COLORS.bg }}>

            {/* Preview Toolbar */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0 1rem", height: "48px", borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, flexShrink: 0 }}>
              {/* Tabs */}
              <div style={{ display: "flex", gap: "2px", marginRight: "0.5rem" }}>
                {(["preview", "code", "console"] as const).map((tab) => (
                  <button
                    key={tab}
                    className="zivo-tab"
                    onClick={() => setActiveTab(tab)}
                    style={{ padding: "0.3rem 0.75rem", borderRadius: "6px", border: "none", background: activeTab === tab ? "rgba(99,102,241,0.15)" : "transparent", color: activeTab === tab ? COLORS.accent : COLORS.textMuted, cursor: "pointer", fontSize: "0.8125rem", fontWeight: 500, textTransform: "capitalize", transition: "color 0.15s" }}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* URL bar */}
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.25rem 0.75rem", maxWidth: "320px" }}>
                <span style={{ fontSize: "0.7rem", color: COLORS.textMuted }}>🔒</span>
                <span style={{ fontSize: "0.8rem", color: COLORS.textSecondary, fontFamily: "monospace" }}>localhost:3000</span>
              </div>

              <div style={{ flex: 1 }} />

              {/* Device switcher */}
              <div style={{ display: "flex", gap: "2px" }}>
                {([["desktop", "🖥"], ["tablet", "📟"], ["mobile", "📱"]] as const).map(([mode, icon]) => (
                  <button
                    key={mode}
                    className="zivo-btn"
                    onClick={() => setDeviceMode(mode)}
                    title={mode}
                    style={{ width: "30px", height: "30px", borderRadius: "6px", border: "none", background: deviceMode === mode ? "rgba(99,102,241,0.15)" : "transparent", color: deviceMode === mode ? COLORS.accent : COLORS.textMuted, cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    {icon}
                  </button>
                ))}
              </div>

              {/* Visual Edit Toggle */}
              <button
                className="zivo-btn"
                onClick={() => setVisualEdit((v) => !v)}
                title="Visual Edit"
                style={{ padding: "0.3rem 0.65rem", borderRadius: "6px", border: `1px solid ${visualEdit ? "rgba(99,102,241,0.4)" : COLORS.border}`, background: visualEdit ? "rgba(99,102,241,0.15)" : "transparent", color: visualEdit ? COLORS.accent : COLORS.textMuted, cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.35rem" }}
              >
                ✏️ <span>{visualEdit ? "Editing" : "Edit"}</span>
              </button>

              {/* Refresh */}
              {previewSrc && (
                <button
                  className="zivo-btn"
                  onClick={() => { if (iframeRef.current) iframeRef.current.src = iframeRef.current.src; }}
                  title="Refresh"
                  style={{ width: "30px", height: "30px", borderRadius: "6px", border: "none", background: "transparent", color: COLORS.textMuted, cursor: "pointer", fontSize: "16px" }}
                >
                  ↻
                </button>
              )}
            </div>

            {/* Loading progress bar */}
            {loading && (
              <div style={{ height: "3px", background: COLORS.bgCard, flexShrink: 0 }}>
                <div style={{ height: "100%", background: COLORS.accentGradient, width: loadingStep === 0 ? "20%" : loadingStep === 1 ? "60%" : "90%", transition: "width 0.8s ease" }} />
              </div>
            )}

            {/* Preview Content */}
            <div style={{ flex: 1, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>

              {/* Empty State */}
              {!loading && !output && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "1rem", animation: "fadeIn 0.5s ease", padding: "2rem", textAlign: "center" }}>
                  <div style={{ width: "80px", height: "80px", borderRadius: "20px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>🖥️</div>
                  <div>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.5rem", color: COLORS.textPrimary }}>Your app will appear here</h2>
                    <p style={{ fontSize: "0.875rem", color: COLORS.textSecondary, margin: 0 }}>Describe your app on the left and click Build to get started</p>
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
                    {["⚡ Instant Preview", "🤖 AI-Powered", "🔧 Fully Editable"].map((chip) => (
                      <span key={chip} style={{ padding: "0.35rem 0.75rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "20px", fontSize: "0.8125rem", color: COLORS.textSecondary }}>{chip}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "1.5rem", padding: "2rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%", maxWidth: "320px" }}>
                    {[
                      "Understanding your prompt...",
                      "Generating files...",
                      "Starting preview...",
                    ].map((step, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", animation: i <= loadingStep ? "fadeIn 0.4s ease" : "none", opacity: i <= loadingStep ? 1 : 0.3 }}>
                        <span style={{ fontSize: "1.1rem" }}>{i < loadingStep ? "✅" : i === loadingStep ? "⏳" : "⏳"}</span>
                        <span style={{ fontSize: "0.875rem", color: i <= loadingStep ? COLORS.textPrimary : COLORS.textMuted }}>{step}</span>
                      </div>
                    ))}
                  </div>
                  {/* Skeleton */}
                  <div style={{ width: "100%", maxWidth: "480px", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {[80, 60, 90, 50].map((w, i) => (
                      <div key={i} style={{ height: "16px", borderRadius: "8px", background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", width: `${w}%` }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Tab */}
              {!loading && output && activeTab === "preview" && (
                <div style={{ width: iframeWidth, height: "100%", position: "relative", transition: "width 0.3s ease" }}>
                  {previewSrc ? (
                    <>
                      <iframe
                        ref={iframeRef}
                        src={previewSrc}
                        title="Live Preview"
                        style={{ width: "100%", height: "100%", border: visualEdit ? "2px solid rgba(99,102,241,0.6)" : "none", boxShadow: visualEdit ? "0 0 0 3px rgba(99,102,241,0.25)" : "none", transition: "box-shadow 0.2s, border-color 0.2s" }}
                        sandbox="allow-scripts allow-same-origin"
                        onLoad={() => applyVisualEditOverlay(visualEdit)}
                      />
                      {popover && (
                        <div style={{ position: "absolute", top: popover.y, left: popover.x, background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "0.875rem", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", zIndex: 10000, minWidth: "220px", animation: "fadeIn 0.2s ease" }}>
                          <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", color: COLORS.textSecondary }}>Edit element text:</p>
                          <input
                            className="zivo-input"
                            value={popoverInput}
                            onChange={(e) => setPopoverInput(e.target.value)}
                            style={{ width: "100%", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "6px", padding: "0.35rem 0.5rem", color: COLORS.textPrimary, fontSize: "0.875rem" }}
                          />
                          <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem" }}>
                            <button
                              className="zivo-btn"
                              onClick={() => {
                                if (output?.preview_html && popover) {
                                  const updated = output.preview_html.replace(popover.text, popoverInput);
                                  setOutput((prev) => prev ? { ...prev, preview_html: updated } : prev);
                                }
                                setPopover(null);
                              }}
                              style={{ flex: 1, padding: "0.35rem", background: COLORS.accentGradient, color: "#fff", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600 }}
                            >
                              Apply
                            </button>
                            <button
                              className="zivo-btn"
                              onClick={() => setPopover(null)}
                              style={{ flex: 1, padding: "0.35rem", background: COLORS.bgCard, color: COLORS.textSecondary, borderRadius: "6px", border: `1px solid ${COLORS.border}`, cursor: "pointer", fontSize: "0.75rem" }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: COLORS.textMuted, fontSize: "0.875rem", textAlign: "center", padding: "2rem" }}>
                      {output?.files?.some((f) => f.path.endsWith(".tsx") || f.path.endsWith(".ts"))
                        ? "Live preview not available for TypeScript files — view in Code tab"
                        : "No preview available for this project type."}
                    </div>
                  )}
                </div>
              )}

              {/* Code Tab */}
              {!loading && output && activeTab === "code" && (
                <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", animation: "fadeIn 0.3s ease" }}>
                  {activeFile ? (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 1rem", borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
                        <span style={{ fontSize: "0.875rem" }}>{getFileIcon(activeFile.path)}</span>
                        <code style={{ fontSize: "0.8125rem", color: COLORS.textSecondary, fontFamily: "monospace" }}>{activeFile.path}</code>
                        <span style={{ fontSize: "0.7rem", padding: "1px 6px", borderRadius: "4px", textTransform: "uppercase", fontWeight: 600, ...getActionStyle(activeFile.action) }}>{activeFile.action}</span>
                        <div style={{ flex: 1 }} />
                        <button
                          className="zivo-btn"
                          onClick={() => navigator.clipboard.writeText(activeFile.content).then(() => {
                            setCopyFileLabel("✅ Copied!");
                            setTimeout(() => setCopyFileLabel("📋 Copy"), 2000);
                          }).catch(() => {})}
                          style={{ padding: "0.3rem 0.65rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "6px", color: COLORS.textSecondary, cursor: "pointer", fontSize: "0.75rem" }}
                        >
                          {copyFileLabel}
                        </button>
                      </div>
                      <div style={{ flex: 1, overflow: "auto", padding: "1rem" }}>
                        <pre style={{ margin: 0, fontSize: "0.8125rem", lineHeight: 1.7, color: COLORS.textPrimary, fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                          {activeFile.content.split("\n").map((line, i) => (
                            <div key={i} style={{ display: "flex", gap: "1rem" }}>
                              <span style={{ color: COLORS.textMuted, userSelect: "none", minWidth: "2.5rem", textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                              <span>{line}</span>
                            </div>
                          ))}
                        </pre>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: COLORS.textMuted, fontSize: "0.875rem" }}>
                      Select a file from the left panel to view its code.
                    </div>
                  )}
                </div>
              )}

              {/* Console Tab */}
              {!loading && output && activeTab === "console" && (
                <div style={{ width: "100%", height: "100%", padding: "1rem", animation: "fadeIn 0.3s ease", overflow: "auto", background: "#000" }}>
                  <div style={{ fontFamily: "'Fira Code', 'SF Mono', 'Monaco', 'Consolas', monospace", fontSize: "0.8125rem", lineHeight: 1.8 }}>
                    {consoleLogs.map((log, i) => (
                      <div key={i} style={{ color: log.type === "error" ? COLORS.error : log.type === "success" ? COLORS.success : "#4ade80" }}>
                        {log.text}
                      </div>
                    ))}
                    {consoleLogs.length === 0 && (
                      <div style={{ color: COLORS.textMuted }}>No console output yet.</div>
                    )}
                    <div ref={consoleEndRef} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1.5rem", height: "28px", borderTop: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, flexShrink: 0, fontSize: "0.7rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: loading ? COLORS.warning : COLORS.success, animation: "statusBlink 2s infinite" }} />
            <span style={{ color: COLORS.textMuted }}>{loading ? "Building…" : "Ready to build"}</span>
          </div>
          <span style={{ color: COLORS.textMuted }}>{buildTime ? `Last build: ${buildTime}` : "No builds yet"}</span>
          <span style={{ color: COLORS.textMuted }}>{model} · {prompt.length} chars</span>
        </div>
      </div>
    </>
  );
}