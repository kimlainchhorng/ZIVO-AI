'use client';

import { COLORS } from "./colors";

interface ChangedFiles {
  created: string[];
  updated: string[];
  deleted: string[];
}

interface WebsiteResult {
  summary: string;
  files: Array<{ path: string; content: string; action: "create" | "update" | "delete" }>;
}

interface WebsiteBuilderPanelProps {
  websitePrompt: string;
  setWebsitePrompt: (v: string) => void;
  websiteStyle: string;
  setWebsiteStyle: (v: string) => void;
  websiteLoading: boolean;
  websiteError: string | null;
  websitePassMessage: string | null;
  websiteResult: WebsiteResult | null;
  websiteIteration: number;
  websiteLivePreviewRunning: boolean;
  websiteLivePreviewError: string | null;
  websiteLivePreviewUrl: string | null;
  websiteLivePreviewStatus: string | null;
  websiteProjectId: string | null;
  websitePreviewTab: string;
  setWebsitePreviewTab: (v: "remote" | "webcontainer") => void;
  websiteChangedFiles: ChangedFiles | null;
  websiteContinueInstruction: string;
  setWebsiteContinueInstruction: (v: string) => void;
  websiteContinueLoading: boolean;
  websiteContinueError: string | null;
  websiteContinuePassMessage: string | null;
  remotePreviewStatus: string | null;
  onGenerate: () => void;
  onStartLivePreview: (files: WebsiteResult["files"]) => void;
  onContinueBuild: () => void;
  onOpenInCodeBuilder: () => void;
}

export default function WebsiteBuilderPanel({
  websitePrompt,
  setWebsitePrompt,
  websiteStyle,
  setWebsiteStyle,
  websiteLoading,
  websiteError,
  websitePassMessage,
  websiteResult,
  websiteIteration,
  websiteLivePreviewRunning,
  websiteLivePreviewError,
  websiteLivePreviewUrl,
  websiteLivePreviewStatus,
  websiteProjectId,
  setWebsitePreviewTab,
  websiteChangedFiles,
  websiteContinueInstruction,
  setWebsiteContinueInstruction,
  websiteContinueLoading,
  websiteContinueError,
  websiteContinuePassMessage,
  remotePreviewStatus,
  onGenerate,
  onStartLivePreview,
  onContinueBuild,
  onOpenInCodeBuilder,
}: WebsiteBuilderPanelProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", animation: "fadeIn 0.3s ease" }}>
      <div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.25rem", letterSpacing: "-0.02em" }}>Website Builder v2</h2>
        <p style={{ fontSize: "0.8125rem", color: COLORS.textSecondary, margin: 0 }}>Describe your website — ZIVO builds a real Next.js multi-page site with design tokens and multi-pass quality</p>
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <label style={{ fontSize: "0.75rem", color: COLORS.textSecondary, display: "block", marginBottom: "0.4rem" }}>Quick Start</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
          {["SaaS landing page", "Portfolio site", "Agency website", "Blog with dark theme", "E-commerce store", "Restaurant site"].map((q) => (
            <button
              key={q}
              className="zivo-btn"
              onClick={() => setWebsitePrompt(q)}
              style={{ padding: "0.2rem 0.55rem", borderRadius: "20px", border: `1px solid ${websitePrompt === q ? "rgba(99,102,241,0.5)" : COLORS.border}`, background: websitePrompt === q ? "rgba(99,102,241,0.12)" : COLORS.bgCard, color: websitePrompt === q ? COLORS.accent : COLORS.textSecondary, cursor: "pointer", fontSize: "0.7rem", fontWeight: 500, transition: "border-color 0.15s, color 0.15s" }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <label style={{ fontSize: "0.75rem", color: COLORS.textSecondary, display: "block", marginBottom: "0.35rem" }}>Describe your website</label>
        <textarea
          className="zivo-textarea"
          value={websitePrompt}
          onChange={(e) => setWebsitePrompt(e.target.value)}
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); onGenerate(); } }}
          placeholder="A portfolio website for a designer with a dark theme, project gallery, and contact form..."
          style={{ width: "100%", minHeight: "100px", resize: "vertical", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textPrimary, padding: "0.6rem 0.75rem", fontSize: "0.875rem", fontFamily: "inherit" }}
        />
        <div style={{ fontSize: "0.65rem", color: COLORS.textMuted, marginTop: "0.25rem", textAlign: "right" }}>{websitePrompt.length}/1000</div>
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <label style={{ fontSize: "0.75rem", color: COLORS.textSecondary, display: "block", marginBottom: "0.4rem" }}>Visual Style</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
          {[
            { value: "modern", label: "Modern", color: "#3b82f6" },
            { value: "bold", label: "Bold", color: "#f59e0b" },
            { value: "corporate", label: "Corporate", color: "#64748b" },
            { value: "creative", label: "Creative", color: "#ec4899" },
            { value: "dark", label: "Dark", color: "#1e293b" },
            { value: "glassmorphism", label: "Glass", color: "#06b6d4" },
            { value: "brutalist", label: "Brutalist", color: "#ef4444" },
            { value: "retro", label: "Retro", color: "#84cc16" },
          ].map((s) => (
            <button
              key={s.value}
              className="zivo-btn"
              onClick={() => setWebsiteStyle(s.value)}
              title={s.label}
              style={{ padding: "0.3rem 0.65rem", borderRadius: "6px", border: `1.5px solid ${websiteStyle === s.value ? s.color : COLORS.border}`, background: websiteStyle === s.value ? `${s.color}22` : COLORS.bgCard, color: websiteStyle === s.value ? s.color : COLORS.textSecondary, cursor: "pointer", fontSize: "0.75rem", fontWeight: websiteStyle === s.value ? 600 : 400, display: "flex", alignItems: "center", gap: "0.35rem", transition: "all 0.15s" }}
            >
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: s.color, flexShrink: 0 }} />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <button
        className="zivo-btn"
        onClick={onGenerate}
        disabled={websiteLoading || !websitePrompt.trim()}
        style={{ width: "100%", padding: "0.65rem", background: websiteLoading || !websitePrompt.trim() ? "rgba(99,102,241,0.3)" : COLORS.accentGradient, color: "#fff", borderRadius: "8px", border: "none", cursor: websiteLoading || !websitePrompt.trim() ? "not-allowed" : "pointer", fontSize: "0.875rem", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
      >
        {websiteLoading ? (
          <><span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> Generating...</>
        ) : (
          <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> Build Website <kbd style={{ fontSize: "0.6rem", opacity: 0.7, background: "rgba(255,255,255,0.15)", borderRadius: "3px", padding: "0 4px" }}>⌘↵</kbd></>
        )}
      </button>

      {websiteLoading && websitePassMessage && (
        <div style={{ padding: "0.5rem 0.75rem", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "8px", fontSize: "0.8125rem", color: COLORS.accent }}>{websitePassMessage}</div>
      )}
      {websiteError && (
        <div style={{ padding: "0.6rem 0.75rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: COLORS.error, fontSize: "0.8125rem" }}>{websiteError}</div>
      )}

      {websiteResult && (
        <div style={{ padding: "0.75rem", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
            <div style={{ fontSize: "0.8125rem", color: COLORS.success, fontWeight: 600 }}>Website generated</div>
            {websiteIteration > 1 && (
              <span style={{ padding: "0.1rem 0.4rem", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "20px", fontSize: "0.65rem", fontWeight: 700, color: COLORS.accent }}>iteration {websiteIteration}</span>
            )}
          </div>
          <div style={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>{websiteResult.summary}</div>
          <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: COLORS.textMuted }}>{websiteResult.files.length} file(s) generated</div>
          <button
            className="zivo-btn"
            onClick={onOpenInCodeBuilder}
            style={{ marginTop: "0.6rem", padding: "0.35rem 0.6rem", fontSize: "0.75rem", borderRadius: "6px", border: `1px solid ${COLORS.border}`, background: COLORS.bgCard, color: COLORS.textPrimary, cursor: "pointer" }}
          >
            Open in Code Builder
          </button>
          <button
            className="zivo-btn"
            onClick={() => onStartLivePreview(websiteResult.files)}
            disabled={websiteLivePreviewRunning && !websiteLivePreviewError}
            style={{ marginTop: "0.45rem", padding: "0.35rem 0.6rem", fontSize: "0.75rem", borderRadius: "6px", border: `1px solid ${COLORS.border}`, background: COLORS.bgCard, color: COLORS.textPrimary, cursor: (websiteLivePreviewRunning && !websiteLivePreviewError) ? "not-allowed" : "pointer", opacity: (websiteLivePreviewRunning && !websiteLivePreviewError) ? 0.6 : 1 }}
          >
            {websiteLivePreviewRunning ? "Starting live runtime…" : websiteLivePreviewUrl ? "Restart Live Preview" : "Start Live Preview"}
          </button>
          {websiteLivePreviewStatus && (
            <div style={{ marginTop: "0.45rem", fontSize: "0.72rem", color: COLORS.textSecondary }}>{websiteLivePreviewStatus}</div>
          )}
          {websiteProjectId && (
            <button
              className="zivo-btn"
              onClick={() => setWebsitePreviewTab("remote")}
              style={{ marginTop: "0.45rem", padding: "0.35rem 0.6rem", fontSize: "0.75rem", borderRadius: "6px", border: "1px solid rgba(99,102,241,0.35)", background: "rgba(99,102,241,0.08)", color: COLORS.accent, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem" }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
              {remotePreviewStatus === "running" ? "View Remote Preview" : "Remote Preview"}
            </button>
          )}
        </div>
      )}

      {websiteChangedFiles && (
        <div style={{ padding: "0.75rem", background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "8px" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.accent, marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Changed Files</div>
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
            {websiteChangedFiles.created.length > 0 && <span style={{ fontSize: "0.72rem", padding: "0.1rem 0.5rem", borderRadius: "20px", background: "rgba(16,185,129,0.15)", color: COLORS.success, fontWeight: 600 }}>+{websiteChangedFiles.created.length} created</span>}
            {websiteChangedFiles.updated.length > 0 && <span style={{ fontSize: "0.72rem", padding: "0.1rem 0.5rem", borderRadius: "20px", background: "rgba(245,158,11,0.15)", color: COLORS.warning, fontWeight: 600 }}>~{websiteChangedFiles.updated.length} updated</span>}
            {websiteChangedFiles.deleted.length > 0 && <span style={{ fontSize: "0.72rem", padding: "0.1rem 0.5rem", borderRadius: "20px", background: "rgba(239,68,68,0.15)", color: COLORS.error, fontWeight: 600 }}>-{websiteChangedFiles.deleted.length} deleted</span>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
            {websiteChangedFiles.created.map((p) => <div key={p} style={{ fontSize: "0.72rem", color: COLORS.success, fontFamily: "monospace" }}>+ {p}</div>)}
            {websiteChangedFiles.updated.map((p) => <div key={p} style={{ fontSize: "0.72rem", color: COLORS.warning, fontFamily: "monospace" }}>~ {p}</div>)}
            {websiteChangedFiles.deleted.map((p) => <div key={p} style={{ fontSize: "0.72rem", color: COLORS.error, fontFamily: "monospace" }}>- {p}</div>)}
          </div>
        </div>
      )}

      {websiteProjectId && (
        <div style={{ padding: "0.875rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.625rem" }}>
            <div style={{ height: "1px", flex: 1, background: COLORS.border }} />
            <span style={{ fontSize: "0.65rem", color: COLORS.accent, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, flexShrink: 0 }}>Continue Build</span>
            <div style={{ height: "1px", flex: 1, background: COLORS.border }} />
          </div>
          <div style={{ fontSize: "0.7rem", color: COLORS.textMuted, fontFamily: "monospace", marginBottom: "0.5rem", wordBreak: "break-all" }}>Project: {websiteProjectId}</div>
          <textarea
            className="zivo-textarea"
            value={websiteContinueInstruction}
            onChange={(e) => setWebsiteContinueInstruction(e.target.value)}
            onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); onContinueBuild(); } }}
            placeholder="Add a dark mode toggle, improve the hero section, add an FAQ section…"
            maxLength={2000}
            style={{ width: "100%", minHeight: "80px", resize: "vertical", background: "rgba(255,255,255,0.03)", border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textPrimary, padding: "0.6rem 0.75rem", fontSize: "0.8125rem", fontFamily: "inherit", boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.5rem" }}>
            <span style={{ fontSize: "0.68rem", color: COLORS.textMuted }}>{websiteContinueInstruction.length}/2000</span>
            <button
              className="zivo-btn"
              onClick={onContinueBuild}
              disabled={websiteContinueLoading || !websiteContinueInstruction.trim()}
              style={{ padding: "0.35rem 0.875rem", background: websiteContinueInstruction.trim() && !websiteContinueLoading ? COLORS.accentGradient : "rgba(99,102,241,0.15)", border: "none", borderRadius: "20px", color: "#fff", cursor: websiteContinueLoading || !websiteContinueInstruction.trim() ? "not-allowed" : "pointer", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem", opacity: websiteContinueLoading || !websiteContinueInstruction.trim() ? 0.5 : 1 }}
            >
              {websiteContinueLoading ? (
                <><span style={{ width: "11px", height: "11px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} /> Building…</>
              ) : "Continue Build ▶"}
            </button>
          </div>
          {websiteContinueLoading && websiteContinuePassMessage && (
            <div style={{ marginTop: "0.5rem", padding: "0.4rem 0.625rem", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "6px", fontSize: "0.75rem", color: COLORS.accent }}>{websiteContinuePassMessage}</div>
          )}
          {websiteContinueError && (
            <div style={{ marginTop: "0.5rem", padding: "0.4rem 0.625rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", fontSize: "0.75rem", color: COLORS.error }}>{websiteContinueError}</div>
          )}
        </div>
      )}
    </div>
  );
}
