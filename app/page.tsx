'use client';

import { useRef, useState } from "react";
import Link from "next/link";
import TemplateSelector from "@/components/TemplateSelector";
import QuickStartGrid from "@/components/QuickStartGrid";
import BuildProgressIndicator, { type BuildStage } from "@/components/BuildProgressIndicator";
import DiffViewer, { type DiffFile } from "@/components/DiffViewer";
import type { GeneratedFile } from "@/lib/ai/schema";

// ─── Types ───────────────────────────────────────────────────────────────────

type SidebarTab = "Prompt" | "Plan" | "Templates" | "Workflow";
type PreviewTab = "Preview" | "Code" | "Console" | "Design";
type RightTab = "Files" | "Code" | "Diff";
type DeviceMode = "desktop" | "tablet" | "mobile";

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: "Builder", href: "/", active: true },
  { label: "Workflow", href: "/workflow", active: false },
  { label: "Templates", href: "/templates", active: false },
  { label: "History", href: "/history", active: false },
  { label: "Dashboard", href: "/dashboard", active: false },
  { label: "Connectors", href: "/connectors", active: false },
];

const MODEL_OPTIONS = [
  { id: "gpt-4o", label: "GPT-4o", quality: "high", cost: 0.005 },
  { id: "gpt-4o-mini", label: "GPT-4o Mini", quality: "medium", cost: 0.00015 },
  { id: "o1-mini", label: "o1-mini", quality: "high", cost: 0.003 },
  { id: "o1", label: "o1", quality: "high", cost: 0.015 },
] as const;

const STYLE_OPTIONS = ["modern", "minimal", "bold", "elegant", "playful", "corporate"] as const;
type StyleOption = (typeof STYLE_OPTIONS)[number];

const QUALITY_BADGE: Record<string, string> = {
  high: "bg-green-500/20 text-green-400 border border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
};

const DEFAULT_BUILD_STAGES: BuildStage[] = [
  { id: "prompt",    label: "Prompt",    icon: "edit",     status: "pending" },
  { id: "parse",     label: "Parse",     icon: "search",   status: "pending" },
  { id: "blueprint", label: "Blueprint", icon: "fileText", status: "pending" },
  { id: "generate",  label: "Generate",  icon: "zap",      status: "pending" },
  { id: "validate",  label: "Validate",  icon: "check",    status: "pending" },
  { id: "fix",       label: "Fix",       icon: "settings", status: "pending" },
  { id: "preview",   label: "Preview",   icon: "eye",      status: "pending" },
  { id: "deploy",    label: "Deploy",    icon: "rocket",   status: "pending" },
];

// Map SSE stage names → buildStages array indices
const SSE_STAGE_TO_INDEX: Readonly<Record<string, number>> = {
  BLUEPRINT: 2,
  MANIFEST: 3,
  GENERATE: 3,
  GENERATING: 3,
  VALIDATE: 4,
  VALIDATING: 4,
  FIX: 5,
  FIXING: 5,
  DONE: 6,
};

const TOTAL_PASSES = 8;
const MAX_PROMPT = 500;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BuilderPage() {
  // ── Core prompt / model / style state
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [style, setStyle] = useState<StyleOption>("modern");

  // ── UI tab state
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("Prompt");
  const [previewTab, setPreviewTab] = useState<PreviewTab>("Preview");
  const [rightTab, setRightTab] = useState<RightTab>("Files");
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");

  // ── Build lifecycle state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [buildSummary, setBuildSummary] = useState<string | null>(null);
  const [buildTime, setBuildTime] = useState<string | null>(null);
  const [buildOutputOpen, setBuildOutputOpen] = useState(true);
  const [buildOutputLogs, setBuildOutputLogs] = useState<string[]>([]);
  const [buildPassed, setBuildPassed] = useState(false);

  // ── Build pipeline stages
  const [buildStages, setBuildStages] = useState<BuildStage[]>(DEFAULT_BUILD_STAGES);
  const [currentBuildStage, setCurrentBuildStage] = useState(0);

  // ── Pass counter / auto-fix
  const [passCount, setPassCount] = useState(0);
  const [autoFixing, setAutoFixing] = useState(false);

  // ── Multi-turn / continue-building state
  const [buildIteration, setBuildIteration] = useState(0);
  const [continueInstruction, setContinueInstruction] = useState("");
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [existingFiles, setExistingFiles] = useState<GeneratedFile[]>([]);

  // ── Files panel
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
  const [fileSearch, setFileSearch] = useState("");

  // ── Diff state
  const [diffFiles, setDiffFiles] = useState<DiffFile[]>([]);

  // ── Abort controller ref
  const abortControllerRef = useRef<AbortController | null>(null);

  const activeModel = MODEL_OPTIONS.find((m) => m.id === selectedModel) ?? MODEL_OPTIONS[0];
  const iframeWidth = deviceMode === "mobile" ? "390px" : deviceMode === "tablet" ? "768px" : "100%";

  // Group files by top-level directory for the tree view
  const filteredFiles = fileSearch.trim()
    ? files.filter((f) => f.path.toLowerCase().includes(fileSearch.toLowerCase()))
    : files;

  const fileGroups: Record<string, GeneratedFile[]> = {};
  for (const file of filteredFiles) {
    const parts = file.path.split("/");
    const group = parts.length > 1 ? parts[0] : "root";
    if (!fileGroups[group]) fileGroups[group] = [];
    fileGroups[group].push(file);
  }

  // ── Build handler (initial + iterations)
  const handleBuild = async (promptOverride?: string) => {
    const buildPrompt = promptOverride ?? (continueInstruction.trim() || prompt);
    if (!buildPrompt.trim()) return;

    // Stop any ongoing build
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const isIteration = buildIteration > 0;
    const buildContext = isIteration ? conversationHistory : [];
    const existingFilesForBuild = isIteration ? existingFiles : undefined;

    setLoading(true);
    setError(null);
    setBuildSummary(null);
    setBuildPassed(false);
    setPassCount(0);
    setAutoFixing(false);
    setBuildOutputLogs([isIteration ? `> Iteration ${buildIteration + 1}: Updating…` : "> Building website…"]);
    setBuildOutputOpen(true);
    setPreviewHtml(null);
    setBuildTime(null);
    setCurrentBuildStage(0);
    setBuildStages(DEFAULT_BUILD_STAGES.map((s, i) => ({ ...s, status: i === 0 ? "active" : "pending" })));

    const buildStart = Date.now();
    let collectedFiles: GeneratedFile[] = [];
    let collectedPreviewHtml: string | undefined;
    let collectedSummary = "";

    try {
      const res = await fetch("/api/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${buildPrompt}. Style: ${style}.`,
          model: selectedModel,
          mode: "website_v2",
          existingFiles: existingFilesForBuild,
          context: buildContext,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sseBuffer += decoder.decode(value, { stream: true });

        const lines = sseBuffer.split("\n");
        sseBuffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === "[DONE]") continue;

          let evt: {
            type: string;
            stage?: string;
            message?: string;
            files?: GeneratedFile[];
            preview_html?: string;
          };
          try {
            evt = JSON.parse(raw) as typeof evt;
          } catch {
            continue;
          }

          if (evt.type === "stage" && evt.stage) {
            const idx = SSE_STAGE_TO_INDEX[evt.stage] ?? -1;
            if (idx >= 0) {
              setBuildStages((prev) =>
                prev.map((s, i) => ({
                  ...s,
                  status: i < idx ? "done" : i === idx ? "active" : "pending",
                }))
              );
              setCurrentBuildStage(idx);
            }
            if (evt.stage === "FIXING") {
              setAutoFixing(true);
              setPassCount((n) => n + 1);
            }
            if (evt.stage === "DONE") {
              collectedSummary = evt.message ?? collectedSummary;
              setAutoFixing(false);
            }
            if (evt.message) {
              setBuildOutputLogs((prev) => [...prev, `> [${evt.stage}] ${evt.message}`]);
            }
          } else if (evt.type === "files" && Array.isArray(evt.files)) {
            collectedFiles = evt.files as GeneratedFile[];
            if (evt.preview_html) collectedPreviewHtml = evt.preview_html;
          } else if (evt.type === "error") {
            const errMsg = String(evt.message ?? "Build error");
            setBuildOutputLogs((prev) => [...prev, `> ❌ ${errMsg}`]);
            setError(errMsg);
          }
        }
      }

      // Finalise build
      const duration = Date.now() - buildStart;
      const durationStr = `${(duration / 1000).toFixed(1)}s`;
      setBuildTime(durationStr);
      setBuildStages((prev) => prev.map((s) => ({ ...s, status: "done" as const })));
      setCurrentBuildStage(7);
      setBuildPassed(true);
      setBuildSummary(collectedSummary || `Generated ${collectedFiles.length} files.`);
      setBuildOutputLogs((prev) => [...prev, `> ✓ Build complete in ${durationStr} — ${collectedFiles.length} files`]);

      if (collectedFiles.length > 0) {
        // Compute diffs vs. previous iteration
        const prevFileMap = new Map(existingFiles.map((f) => [f.path, f.content]));
        setDiffFiles(
          collectedFiles.map((f) => ({
            path: f.path,
            oldContent: prevFileMap.get(f.path) ?? "",
            newContent: f.content,
          }))
        );

        setFiles(collectedFiles);
        setExistingFiles(collectedFiles);
        setSelectedFile(collectedFiles[0] ?? null);
        setRightTab("Files");
      }

      if (collectedPreviewHtml) {
        setPreviewHtml(collectedPreviewHtml);
        setPreviewTab("Preview");
      }

      // Update conversation history for next iteration
      const newHistory: Array<{ role: "user" | "assistant"; content: string }> = [
        ...buildContext,
        { role: "user", content: buildPrompt },
        { role: "assistant", content: collectedSummary || `Generated ${collectedFiles.length} files.` },
      ];
      setConversationHistory(newHistory);
      setBuildIteration((n) => n + 1);
      setContinueInstruction("");
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") {
        setBuildOutputLogs((prev) => [...prev, "> Build stopped."]);
      } else {
        const msg = (err as Error)?.message ?? "Build failed. Please try again.";
        setError(msg);
        setBuildOutputLogs((prev) => [...prev, `> ❌ ${msg}`]);
      }
    } finally {
      setLoading(false);
      setAutoFixing(false);
    }
  };

  const handleStartFresh = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setPrompt("");
    setContinueInstruction("");
    setFiles([]);
    setExistingFiles([]);
    setDiffFiles([]);
    setPreviewHtml(null);
    setBuildSummary(null);
    setBuildTime(null);
    setError(null);
    setSelectedFile(null);
    setPassCount(0);
    setAutoFixing(false);
    setBuildPassed(false);
    setBuildIteration(0);
    setConversationHistory([]);
    setBuildOutputLogs([]);
    setBuildStages(DEFAULT_BUILD_STAGES);
    setCurrentBuildStage(0);
  };

  return (
    <div className="zivo-root">
      {/* ─── Left Sidebar ─────────────────────────────────────────────────── */}
      <aside className="zivo-sidebar">
        {/* Logo */}
        <div className="zivo-logo-row">
          <div className="zivo-logo-icon">Z</div>
          <span className="zivo-logo-text">ZIVO AI</span>
        </div>

        {/* Nav */}
        <nav className="zivo-nav">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`zivo-nav-item${item.active ? " active" : ""}`}
            >
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="zivo-divider" />

        <div className="zivo-section-header">
          <p className="zivo-section-title">What will you build today?</p>
          <p className="zivo-section-sub">Describe your idea and let AI do the heavy lifting</p>
        </div>

        {/* Model selector */}
        <div className="zivo-model-selector">
          <label className="zivo-label">Model</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="zivo-model-select"
          >
            {MODEL_OPTIONS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} · {m.quality} · ${m.cost.toFixed(5)}/1k
              </option>
            ))}
          </select>
          <div className="zivo-model-info">
            <span className={`zivo-model-badge ${QUALITY_BADGE[activeModel.quality] ?? ""}`}>
              {activeModel.quality}
            </span>
            <span className="zivo-model-cost">${activeModel.cost.toFixed(5)}/1k tokens</span>
          </div>
        </div>

        {/* Style selector */}
        <div className="zivo-model-selector">
          <label className="zivo-label">Style</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
            {STYLE_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setStyle(s)}
                style={{
                  padding: "3px 10px",
                  borderRadius: 99,
                  fontSize: "0.68rem",
                  fontWeight: 600,
                  border: `1px solid ${style === s ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.1)"}`,
                  background: style === s ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                  color: style === s ? "#a5b4fc" : "#64748b",
                  cursor: "pointer",
                  transition: "all 0.12s",
                  textTransform: "capitalize",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="zivo-tabs">
          {(["Prompt", "Plan", "Templates", "Workflow"] as SidebarTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setSidebarTab(tab)}
              className={`zivo-tab${sidebarTab === tab ? " zivo-tab-active" : ""}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="zivo-tab-content">
          {sidebarTab === "Prompt" && (
            <div className="zivo-prompt-section">
              <div className="zivo-textarea-wrapper">
                <textarea
                  className="zivo-textarea"
                  placeholder="Build a complete e-commerce site with product catalog, cart, checkout, and admin panel…"
                  value={prompt}
                  maxLength={MAX_PROMPT}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void handleBuild();
                  }}
                  rows={6}
                />
                <div className="zivo-char-count">
                  <span className="zivo-gpt-badge">{activeModel.label}</span>
                  <span>{prompt.length}/{MAX_PROMPT}</span>
                </div>
              </div>

              <div className="zivo-source-row">
                <span className="zivo-source-label">or start from</span>
                <div className="zivo-source-btns">
                  {["Figma", "GitHub", "Team template"].map((src) => (
                    <button key={src} className="zivo-source-btn">{src}</button>
                  ))}
                </div>
              </div>

              <QuickStartGrid onSelect={(p) => setPrompt(p)} />
            </div>
          )}

          {sidebarTab === "Templates" && (
            <TemplateSelector
              onSelect={(p) => { setPrompt(p); setSidebarTab("Prompt"); }}
              onSubmit={(p) => { setPrompt(p); void handleBuild(p); }}
            />
          )}

          {sidebarTab === "Plan" && (
            <div className="zivo-plan-placeholder">
              <span className="zivo-plan-icon">📋</span>
              <p>{buildSummary ?? "Run a build to generate a plan"}</p>
            </div>
          )}

          {sidebarTab === "Workflow" && (
            <div className="zivo-plan-placeholder">
              <span className="zivo-plan-icon">⚙️</span>
              <p>
                <Link href="/workflow" className="zivo-link">Open Workflow Editor →</Link>
              </p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="zivo-action-row">
          <button onClick={handleStartFresh} className="zivo-btn-fresh">
            Start Fresh
          </button>
          <button
            onClick={() => void handleBuild()}
            disabled={loading || !prompt.trim()}
            className="zivo-btn-build"
          >
            {loading
              ? "Building…"
              : buildIteration > 0
              ? `Update ▶ (iter. ${buildIteration + 1})`
              : "⚡ Build"}
          </button>
        </div>

        {error && <div className="zivo-error">{error}</div>}
      </aside>

      {/* ─── Main Preview Area ─────────────────────────────────────────────── */}
      <main className="zivo-main">
        {/* Top toolbar */}
        <div className="zivo-toolbar">
          <div className="zivo-toolbar-left">
            {(["Preview", "Code", "Console", "Design"] as PreviewTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setPreviewTab(tab)}
                className={`zivo-toolbar-tab${previewTab === tab ? " active" : ""}`}
              >
                {tab}
              </button>
            ))}
            {/* Device mode toggles — only visible in Preview tab */}
            {previewTab === "Preview" && previewHtml && (
              <div style={{ display: "flex", gap: 2, marginLeft: "0.5rem", borderLeft: "1px solid rgba(255,255,255,0.08)", paddingLeft: "0.5rem" }}>
                {(["desktop", "tablet", "mobile"] as DeviceMode[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDeviceMode(d)}
                    className={`zivo-toolbar-tab${deviceMode === d ? " active" : ""}`}
                    style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}
                  >
                    {d === "desktop" ? "🖥" : d === "tablet" ? "📱" : "📲"}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="zivo-toolbar-right">
            {(["Files", "Code", "Diff"] as RightTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className={`zivo-toolbar-tab${rightTab === tab ? " active" : ""}`}
              >
                {tab}
                {tab === "Diff" && diffFiles.length > 0 && (
                  <span style={{ marginLeft: 4, fontSize: "0.6rem", background: "rgba(99,102,241,0.2)", color: "#a5b4fc", borderRadius: 99, padding: "1px 5px" }}>
                    {diffFiles.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Build stages progress bar */}
        {(loading || buildPassed) && (
          <div style={{ padding: "4px 12px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "#0a0b14", flexShrink: 0 }}>
            <BuildProgressIndicator stages={buildStages} currentStage={currentBuildStage} />
          </div>
        )}

        {/* Preview content */}
        <div
          className="zivo-preview-area"
          style={{
            padding: previewTab === "Preview" && previewHtml ? "0" : undefined,
            alignItems: previewTab === "Preview" && previewHtml ? "stretch" : undefined,
            justifyContent: previewTab === "Preview" && previewHtml ? "center" : undefined,
            overflow: previewTab === "Preview" && previewHtml ? "hidden" : undefined,
          }}
        >
          {previewTab === "Preview" && previewHtml && (
            <iframe
              srcDoc={previewHtml}
              style={{ width: iframeWidth, height: "100%", border: "none", display: "block", margin: "0 auto" }}
              sandbox="allow-scripts"
              title="Website Preview"
            />
          )}

          {previewTab === "Preview" && !previewHtml && (
            <div className="zivo-preview-empty">
              {loading ? (
                <>
                  <span className="zivo-spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
                  <p className="zivo-preview-sub" style={{ marginTop: "0.75rem" }}>
                    {autoFixing ? "Auto-fixing errors…" : "Building website…"}
                  </p>
                </>
              ) : (
                <>
                  <div className="zivo-preview-logo">Z</div>
                  <h2 className="zivo-preview-title">Your website preview lives here</h2>
                  <p className="zivo-preview-sub">
                    Enter a prompt and click Build to generate your website
                  </p>
                  <div className="zivo-preview-badges">
                    <span className="zivo-badge">⚡ Instant Preview</span>
                    <span className="zivo-badge">🤖 AI-Powered</span>
                    <span className="zivo-badge">✏️ Fully Editable</span>
                  </div>
                </>
              )}
            </div>
          )}

          {previewTab === "Code" && selectedFile && (
            <pre className="zivo-code-view">
              <code>{selectedFile.content}</code>
            </pre>
          )}

          {previewTab === "Code" && !selectedFile && (
            <div className="zivo-preview-empty">
              <p className="zivo-preview-sub">Select a file from the Files panel to view its code</p>
            </div>
          )}

          {previewTab === "Console" && (
            <div style={{ width: "100%", height: "100%", overflow: "auto", padding: "1rem", fontFamily: "monospace", fontSize: "0.8rem" }}>
              {buildOutputLogs.length === 0 ? (
                <p style={{ color: "#475569" }}>Console output will appear here during builds</p>
              ) : (
                buildOutputLogs.map((log, i) => (
                  <div key={i} style={{ color: log.startsWith("> ❌") ? "#ef4444" : log.startsWith("> ✓") ? "#10b981" : "#94a3b8", lineHeight: 1.6 }}>
                    {log}
                  </div>
                ))
              )}
            </div>
          )}

          {previewTab === "Design" && (
            <div className="zivo-preview-empty">
              <span className="zivo-plan-icon">🎨</span>
              <p className="zivo-preview-sub">
                <Link href="/interaction-builder" className="zivo-link">Open Design Editor →</Link>
              </p>
            </div>
          )}
        </div>

        {/* Continue Building textarea — shown after first build */}
        {buildIteration > 0 && (
          <div style={{ flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.07)", background: "#0a0b14", padding: "0.625rem 0.875rem", display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.65rem", color: "#475569", fontWeight: 600, marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Continue Building — Iteration {buildIteration + 1}
              </div>
              <textarea
                value={continueInstruction}
                onChange={(e) => setContinueInstruction(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void handleBuild();
                }}
                placeholder="Describe what to add or change… (e.g. add dark mode, change hero to gradient blue)"
                rows={2}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: "#f1f5f9",
                  fontSize: "0.8rem",
                  padding: "0.5rem 0.625rem",
                  resize: "none",
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <button
              onClick={() => void handleBuild()}
              disabled={loading || !continueInstruction.trim()}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: 8,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                border: "none",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.8rem",
                cursor: "pointer",
                opacity: loading || !continueInstruction.trim() ? 0.4 : 1,
                transition: "opacity 0.12s",
                flexShrink: 0,
              }}
            >
              {loading ? "…" : "Update ▶"}
            </button>
          </div>
        )}

        {/* Build Output Panel */}
        <div className="zivo-build-panel" style={{ maxHeight: buildOutputOpen ? 160 : 36 }}>
          <div
            className="zivo-build-panel-header"
            onClick={() => setBuildOutputOpen((o) => !o)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setBuildOutputOpen((o) => !o); } }}
            role="button"
            tabIndex={0}
            aria-expanded={buildOutputOpen}
            style={{ cursor: "pointer", userSelect: "none" }}
          >
            <div className="zivo-build-status-row">
              <span className={`zivo-status-dot${buildPassed ? " passed" : ""}`} />
              <span className="zivo-build-label">Build Output</span>
              {passCount > 0 && (
                <span className="zivo-pass-count" style={{ color: "#10b981", fontWeight: 600 }}>
                  Pass {passCount}/{TOTAL_PASSES} ✓
                </span>
              )}
              {autoFixing && (
                <span style={{ fontSize: "0.7rem", color: "#f59e0b", marginLeft: "0.5rem" }}>
                  Auto-fixing…
                </span>
              )}
              {buildTime && (
                <span style={{ fontSize: "0.7rem", color: "#475569", marginLeft: "0.5rem" }}>
                  {buildTime}
                </span>
              )}
            </div>
            <span className="zivo-build-status-text">
              {buildOutputOpen ? "▼" : "▶"}{" "}
              {buildPassed ? `✓ ${files.length} files` : loading ? "Running…" : "No output yet"}
            </span>
          </div>
          {buildOutputOpen && (
            <div className="zivo-build-panel-body" style={{ overflowY: "auto", flex: 1 }}>
              {loading && buildOutputLogs.length === 0 && (
                <div className="zivo-build-running">
                  <span className="zivo-spinner" />
                  <span>Generating files…</span>
                </div>
              )}
              {buildOutputLogs.map((log, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: "0.75rem",
                    fontFamily: "monospace",
                    color: log.startsWith("> ❌") ? "#ef4444" : log.startsWith("> ✓") ? "#10b981" : "#64748b",
                    lineHeight: 1.5,
                    padding: "1px 0",
                  }}
                >
                  {log}
                </div>
              ))}
              {!loading && buildOutputLogs.length === 0 && (
                <p className="zivo-build-empty">No builds yet — enter a prompt and click Build.</p>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ─── Right File Panel ──────────────────────────────────────────────── */}
      <aside className="zivo-file-panel">
        <div className="zivo-file-panel-header">
          <input
            className="zivo-file-search"
            type="text"
            placeholder="Search files…"
            value={fileSearch}
            onChange={(e) => setFileSearch(e.target.value)}
          />
        </div>

        {rightTab === "Files" && (
          <div className="zivo-file-tree">
            {filteredFiles.length === 0 ? (
              <div className="zivo-file-empty">
                <span className="zivo-file-empty-icon">📁</span>
                <p>{files.length > 0 ? "No files match your search." : "Build a project to see files here."}</p>
              </div>
            ) : (
              Object.entries(fileGroups).map(([group, groupFiles]) => (
                <div key={group} className="zivo-file-group">
                  <p className="zivo-file-group-label">📁 {group}</p>
                  <ul>
                    {groupFiles.map((file) => (
                      <li key={file.path}>
                        <button
                          onClick={() => { setSelectedFile(file); setPreviewTab("Code"); }}
                          className={`zivo-file-item${selectedFile?.path === file.path ? " active" : ""}`}
                        >
                          <span className={`zivo-file-action zivo-action-${file.action}`}>
                            {file.action[0].toUpperCase()}
                          </span>
                          <span className="zivo-file-name">
                            {file.path.split("/").pop() ?? file.path}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        )}

        {rightTab === "Code" && selectedFile && (
          <pre className="zivo-code-panel">
            <code>{selectedFile.content}</code>
          </pre>
        )}

        {rightTab === "Code" && !selectedFile && (
          <div className="zivo-file-empty">
            <p>Select a file to view its code.</p>
          </div>
        )}

        {rightTab === "Diff" && (
          diffFiles.length > 0 ? (
            <div style={{ height: "100%", overflow: "hidden" }}>
              <DiffViewer files={diffFiles} />
            </div>
          ) : (
            <div className="zivo-file-empty">
              <span className="zivo-file-empty-icon">±</span>
              <p>Diff view will show changes after a build.</p>
            </div>
          )
        )}
      </aside>

      {/* ─── Floating Action Button ────────────────────────────────────────── */}
      <button
        className="zivo-fab"
        title="New build"
        onClick={handleStartFresh}
        aria-label="Start new build"
      >
        +
      </button>
    </div>
  );
}