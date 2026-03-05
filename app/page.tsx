'use client';

import { useState } from "react";
import Link from "next/link";
import TemplateSelector from "@/components/TemplateSelector";
import QuickStartGrid from "@/components/QuickStartGrid";
import type { GeneratedFile, BuilderResponse } from "@/app/api/builder/route";

// ─── Types ───────────────────────────────────────────────────────────────────

type SidebarTab = "Prompt" | "Plan" | "Templates" | "Workflow";
type PreviewTab = "Preview" | "Code" | "Console" | "Design";
type RightTab = "Files" | "Code" | "Diff";

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: "Code Builder", icon: "⚡", active: true },
  { label: "Security", icon: "🔒", active: false },
  { label: "Website", icon: "🌐", active: false },
  { label: "Mobile App", icon: "📱", active: false },
];

const MODEL_OPTIONS = [
  { id: "gpt-4o", label: "GPT-4o", quality: "high", cost: 0.005 },
  { id: "gpt-4o-mini", label: "GPT-4o Mini", quality: "medium", cost: 0.00015 },
  { id: "o1-mini", label: "o1-mini", quality: "high", cost: 0.003 },
  { id: "o1", label: "o1", quality: "high", cost: 0.015 },
] as const;

const QUALITY_BADGE: Record<string, string> = {
  high: "bg-green-500/20 text-green-400 border border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BuilderPage() {
  const [prompt, setPrompt] = useState("");
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("Prompt");
  const [previewTab, setPreviewTab] = useState<PreviewTab>("Preview");
  const [rightTab, setRightTab] = useState<RightTab>("Files");
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BuilderResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [passCount, setPassCount] = useState(0);
  const [totalPasses] = useState(8);

  const MAX_PROMPT = 200;
  const activeModel = MODEL_OPTIONS.find((m) => m.id === selectedModel) ?? MODEL_OPTIONS[0];

  const handleBuild = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setFiles([]);
    setResult(null);
    setSelectedFile(null);
    setPassCount(0);
    try {
      const res = await fetch("/api/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model: selectedModel }),
      });
      const data: unknown = await res.json();
      if (
        data &&
        typeof data === "object" &&
        "files" in data &&
        Array.isArray((data as { files: unknown }).files)
      ) {
        const typed = data as BuilderResponse;
        setFiles(typed.files);
        setResult(typed);
        setPassCount(typed.files.length > 0 ? Math.min(typed.files.length, totalPasses) : 0);
        setRightTab("Files");
      } else if (data && typeof data === "object" && "error" in data) {
        setError(String((data as { error: unknown }).error));
      } else {
        setError("Unexpected response from server");
      }
    } catch {
      setError("Build failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartFresh = () => {
    setPrompt("");
    setFiles([]);
    setResult(null);
    setError(null);
    setSelectedFile(null);
    setPassCount(0);
  };

  // Group files by top-level directory
  const fileGroups: Record<string, GeneratedFile[]> = {};
  for (const file of files) {
    const parts = file.path.split("/");
    const group = parts.length > 1 ? parts[0] : "root";
    if (!fileGroups[group]) fileGroups[group] = [];
    fileGroups[group].push(file);
  }

  return (
    <div className="zivo-root">
      {/* ─── Left Sidebar ─────────────────────────────────────────────────── */}
      <aside className="zivo-sidebar">
        {/* Logo */}
        <div className="zivo-logo-row">
          <div className="zivo-logo-icon">Z</div>
          <span className="zivo-logo-text">ZIVO AI</span>
        </div>

        {/* Nav tabs */}
        <nav className="zivo-nav">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.label === "Code Builder" ? "/" : `/${item.label.toLowerCase().replace(" ", "-")}`}
              className={`zivo-nav-item${item.active ? " active" : ""}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Divider */}
        <div className="zivo-divider" />

        {/* Section header */}
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

        {/* Tabs: Prompt | Plan | Templates | Workflow */}
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
                  placeholder="Build a complete e-commerce app with product catalog, cart, checkout, and admin panel…"
                  value={prompt}
                  maxLength={MAX_PROMPT}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleBuild();
                  }}
                  rows={6}
                />
                <div className="zivo-char-count">
                  <span className="zivo-gpt-badge">{activeModel.label}</span>
                  <span>{prompt.length}/{MAX_PROMPT}</span>
                </div>
              </div>

              {/* Source buttons */}
              <div className="zivo-source-row">
                <span className="zivo-source-label">or start from</span>
                <div className="zivo-source-btns">
                  {["Figma", "GitHub", "Team template"].map((src) => (
                    <button key={src} className="zivo-source-btn">{src}</button>
                  ))}
                </div>
              </div>

              {/* QuickStart grid */}
              <QuickStartGrid onSelect={(p) => setPrompt(p)} />
            </div>
          )}

          {sidebarTab === "Templates" && (
            <TemplateSelector
              onSelect={(p) => { setPrompt(p); setSidebarTab("Prompt"); }}
              onSubmit={(p) => { setPrompt(p); handleBuild(); }}
            />
          )}

          {sidebarTab === "Plan" && (
            <div className="zivo-plan-placeholder">
              <span className="zivo-plan-icon">📋</span>
              <p>Run a build to generate a plan</p>
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
            onClick={handleBuild}
            disabled={loading || !prompt.trim()}
            className="zivo-btn-build"
          >
            {loading ? "Building…" : "⚡ Build"}
          </button>
        </div>

        {error && (
          <div className="zivo-error">{error}</div>
        )}
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
          </div>
          <div className="zivo-toolbar-right">
            {(["Files", "Code", "Diff"] as RightTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className={`zivo-toolbar-tab${rightTab === tab ? " active" : ""}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Preview content */}
        <div className="zivo-preview-area">
          {previewTab === "Preview" && (
            <div className="zivo-preview-empty">
              <div className="zivo-preview-logo">Z</div>
              <h2 className="zivo-preview-title">Your app preview lives here</h2>
              <p className="zivo-preview-sub">
                Enter a prompt and click Build to generate your app
              </p>
              <div className="zivo-preview-badges">
                <span className="zivo-badge">⚡ Instant Preview</span>
                <span className="zivo-badge">🤖 AI-Powered</span>
                <span className="zivo-badge">✏️ Fully Editable</span>
              </div>
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
            <div className="zivo-preview-empty">
              <span className="zivo-plan-icon">🖥️</span>
              <p className="zivo-preview-sub">Console output will appear here during builds</p>
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

        {/* Build Output Panel */}
        <div className="zivo-build-panel">
          <div className="zivo-build-panel-header">
            <div className="zivo-build-status-row">
              <span className={`zivo-status-dot${passCount > 0 ? " passed" : ""}`} />
              <span className="zivo-build-label">Build Output</span>
              <span className="zivo-pass-count">Pass {passCount}/{totalPasses}</span>
            </div>
            <span className="zivo-build-status-text">{passCount > 0 ? "Passed" : loading ? "Running…" : "No output yet"}</span>
          </div>
          <div className="zivo-build-panel-body">
            {loading && (
              <div className="zivo-build-running">
                <span className="zivo-spinner" />
                <span>Generating files…</span>
              </div>
            )}
            {!loading && passCount === 0 && (
              <p className="zivo-build-empty">No builds yet — enter a prompt and click Build.</p>
            )}
            {!loading && result?.summary && (
              <p className="zivo-build-summary">{result.summary}</p>
            )}
          </div>
        </div>
      </main>

      {/* ─── Right File Panel ──────────────────────────────────────────────── */}
      <aside className="zivo-file-panel">
        <div className="zivo-file-panel-header">
          <input
            className="zivo-file-search"
            type="text"
            placeholder="Search files…"
            readOnly
          />
        </div>

        {rightTab === "Files" && (
          <div className="zivo-file-tree">
            {files.length === 0 ? (
              <div className="zivo-file-empty">
                <span className="zivo-file-empty-icon">📁</span>
                <p>Build a project to see files here.</p>
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
          <div className="zivo-file-empty">
            <span className="zivo-file-empty-icon">±</span>
            <p>Diff view will show changes after a build.</p>
          </div>
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