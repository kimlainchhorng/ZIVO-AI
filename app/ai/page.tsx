'use client';

import React, { useCallback, useEffect, useRef, useState } from "react";

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

function SvgIcon({ paths, size = 16 }: { paths: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}>
      {paths}
    </svg>
  );
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
  { icon: <SvgIcon paths={<><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></>} />, label: "Landing Page", prompt: "Build a modern SaaS landing page with hero, features, pricing, and CTA sections" },
  { icon: <SvgIcon paths={<><rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></>} />, label: "Todo App", prompt: "Build a todo app with categories, due dates, and local storage persistence" },
  { icon: <SvgIcon paths={<><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></>} />, label: "E-commerce", prompt: "Build an e-commerce product listing page with cart and checkout flow" },
  { icon: <SvgIcon paths={<><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>} />, label: "Auth Flow", prompt: "Build a complete authentication flow with login, signup, and password reset pages" },
  { icon: <SvgIcon paths={<><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></>} />, label: "Dashboard", prompt: "Build an analytics dashboard with charts, stats cards, and data tables" },
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

function getFileIcon(path: string): React.ReactNode {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "tsx" || ext === "ts" || ext === "jsx" || ext === "js" || ext === "md") {
    return <SvgIcon paths={<><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></>} />;
  }
  return <SvgIcon paths={<><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></>} />;
}

const DEVICE_MODES: Array<{ mode: "desktop" | "tablet" | "mobile"; icon: React.ReactNode }> = [
  { mode: "desktop", icon: <SvgIcon paths={<><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></>} /> },
  { mode: "tablet", icon: <SvgIcon paths={<><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="12" x2="12.01" y1="18" y2="18"/></>} /> },
  { mode: "mobile", icon: <SvgIcon paths={<><rect width="14" height="20" x="5" y="2" rx="2"/><line x1="12" x2="12.01" y1="18" y2="18"/></>} /> },
];

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
  const [copyLabel, setCopyLabel] = useState<React.ReactNode>(<><SvgIcon paths={<><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/></>} /> Save</>);
  const [copyFileLabel, setCopyFileLabel] = useState<React.ReactNode>(<><SvgIcon paths={<><rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></>} /> Copy</>);
  const [loadingStep, setLoadingStep] = useState(0);
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
              {([["builder", "/ai"], ["dashboard", "/dashboard"], ["connectors", "/connectors"]] as const).map(([nav, href]) => (
                <a
                  key={nav}
                  href={href}
                  className="zivo-nav"
                  style={{ padding: "0.25rem 0.75rem", background: nav === "builder" ? "rgba(99,102,241,0.15)" : "transparent", color: nav === "builder" ? COLORS.accent : COLORS.textSecondary, borderRadius: "6px", border: nav === "builder" ? `1px solid rgba(99,102,241,0.3)` : "1px solid transparent", cursor: "pointer", fontSize: "0.8125rem", fontWeight: 500, textTransform: "capitalize", transition: "color 0.15s", textDecoration: "none" }}
                >
                  {nav.charAt(0).toUpperCase() + nav.slice(1)}
                </a>
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
                    <span>{qp.icon}</span>
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
                  <SvgIcon paths={<><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></>} />
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
                  <><SvgIcon paths={<polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>} /> Build</>
                )}
              </button>

              {/* Notifications */}
              {deployResult && (
                <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", padding: "0.75rem", borderRadius: "8px", marginBottom: "0.75rem", animation: "fadeIn 0.3s ease", fontSize: "0.875rem" }}>
                  <><SvgIcon paths={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>} /> Deployed:{" "}</>
                  <a href={deployResult.url} target="_blank" rel="noreferrer" style={{ color: COLORS.success }}>
                    {deployResult.url}
                  </a>
                </div>
              )}
              {deployError && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: COLORS.error, padding: "0.75rem", borderRadius: "8px", marginBottom: "0.75rem", fontSize: "0.875rem" }}>
                  <SvgIcon paths={<><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></>} /> {deployError}
                </div>
              )}
              {downloadError && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: COLORS.error, padding: "0.75rem", borderRadius: "8px", marginBottom: "0.75rem", fontSize: "0.875rem" }}>
                  <SvgIcon paths={<><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></>} /> {downloadError}
                </div>
              )}
              {output?.error && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: COLORS.error, padding: "0.75rem", borderRadius: "8px", marginBottom: "0.75rem", fontSize: "0.875rem" }}>
                  <SvgIcon paths={<><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></>} /> {output.error}
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
                        <span style={{ display: "flex", alignItems: "center" }}>{getFileIcon(f.path)}</span>
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
                  <><SvgIcon paths={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></>} /> ZIP</>
                </button>
                <button
                  className="zivo-btn"
                  onClick={() => handleDeploy("vercel")}
                  disabled={deploying}
                  style={{ flex: 1, padding: "0.5rem", background: deploying ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "8px", color: COLORS.success, cursor: deploying ? "not-allowed" : "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}
                >
                  <><SvgIcon paths={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></>} /> {deploying ? "…" : "Deploy"}</>
                </button>
                <button
                  className="zivo-btn"
                  onClick={() => {
                    const all = output?.files?.map((f) => `// ${f.path}\n${f.content}`).join("\n\n---\n\n") ?? "";
                    navigator.clipboard.writeText(all).then(() => {
                      setCopyLabel(<><SvgIcon paths={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>} /> Saved!</>);
                      setTimeout(() => setCopyLabel(<><SvgIcon paths={<><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/></>} /> Save</>), 2000);
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
                <span style={{ display: "flex", alignItems: "center", color: COLORS.textMuted }}><SvgIcon paths={<><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>} size={12} /></span>
                <span style={{ fontSize: "0.8rem", color: COLORS.textSecondary, fontFamily: "monospace" }}>localhost:3000</span>
              </div>

              <div style={{ flex: 1 }} />

              {/* Device switcher */}
              <div style={{ display: "flex", gap: "2px" }}>
                {DEVICE_MODES.map(({ mode, icon }) => (
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
                <SvgIcon paths={<><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></>} /> <span>{visualEdit ? "Editing" : "Edit"}</span>
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
                  <div style={{ width: "80px", height: "80px", borderRadius: "20px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.accent }}>
                    <SvgIcon paths={<><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></>} size={36} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.5rem", color: COLORS.textPrimary }}>Your app will appear here</h2>
                    <p style={{ fontSize: "0.875rem", color: COLORS.textSecondary, margin: 0 }}>Describe your app on the left and click Build to get started</p>
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
                    {[
                      { key: "preview", icon: <SvgIcon paths={<polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>} />, label: "Instant Preview" },
                      { key: "ai", icon: <SvgIcon paths={<><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 8v8"/><path d="M8 12h8"/></>} />, label: "AI-Powered" },
                      { key: "edit", icon: <SvgIcon paths={<><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></>} />, label: "Fully Editable" },
                    ].map((chip) => (
                      <span key={chip.key} style={{ padding: "0.35rem 0.75rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "20px", fontSize: "0.8125rem", color: COLORS.textSecondary, display: "flex", alignItems: "center", gap: "0.35rem" }}>{chip.icon}{chip.label}</span>
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
                        <span style={{ display: "flex", alignItems: "center" }}>
                          {i < loadingStep
                            ? <SvgIcon paths={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>} size={18} />
                            : <SvgIcon paths={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>} size={18} />}
                        </span>
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
                        <span style={{ display: "flex", alignItems: "center" }}>{getFileIcon(activeFile.path)}</span>
                        <code style={{ fontSize: "0.8125rem", color: COLORS.textSecondary, fontFamily: "monospace" }}>{activeFile.path}</code>
                        <span style={{ fontSize: "0.7rem", padding: "1px 6px", borderRadius: "4px", textTransform: "uppercase", fontWeight: 600, ...getActionStyle(activeFile.action) }}>{activeFile.action}</span>
                        <div style={{ flex: 1 }} />
                        <button
                          className="zivo-btn"
                          onClick={() => navigator.clipboard.writeText(activeFile.content).then(() => {
                            setCopyFileLabel(<><SvgIcon paths={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>} /> Copied!</>);
                            setTimeout(() => setCopyFileLabel(<><SvgIcon paths={<><rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></>} /> Copy</>), 2000);
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