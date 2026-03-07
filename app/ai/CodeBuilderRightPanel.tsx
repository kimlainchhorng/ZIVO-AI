'use client';

import React from "react";
import { COLORS } from "./colors";
import FileTree from "@/components/FileTree";
import DiffViewer from "@/components/DiffViewer";

interface CodeBuilderRightPanelProps {
  activeRightTab: "files" | "code" | "diff" | "actions";
  setActiveRightTab: (v: "files" | "code" | "diff" | "actions") => void;
  output: { files?: Array<{ path: string; content: string; action: "create" | "update" | "delete" }>; preview_html?: string; summary?: string; } | null;
  loading: boolean;
  activeFile: { path: string; content: string; action: "create" | "update" | "delete" } | null;
  setActiveFile: (f: any) => void;
  editedContent: string;
  setEditedContent: (v: string) => void;
  saveStatus: "idle" | "saved" | "saving" | "error";
  setSaveStatus: (v: "idle" | "saved" | "saving" | "error") => void;
  isSaving: boolean;
  handleFileSave: () => void;
  showDiff: boolean;
  diffFiles: Array<any>;
  handleDownload: () => void;
  setCopyLabel: (v: string) => void;
  copyLabel: string;
  copyFileLabel: string;
  setCopyFileLabel: (v: string) => void;
  setGithubModalOpen: (v: boolean) => void;
  setShowVercelTokenInput: (v: boolean) => void;
  setAnalysisTab: (v: "seo" | "a11y" | "perf" | "docs" | "agents") => void;
  setAnalysisPanelOpen: (v: boolean) => void;
  setDesignSystemOpen: (v: boolean) => void;
  setDesignPanelOpen: (v: (prev: boolean) => boolean) => void;
  getFileIcon: (path: string) => React.ReactElement;
}

export default function CodeBuilderRightPanel({
  activeRightTab,
  setActiveRightTab,
  output,
  loading,
  activeFile,
  setActiveFile,
  editedContent,
  setEditedContent,
  saveStatus,
  setSaveStatus,
  isSaving,
  handleFileSave,
  showDiff,
  diffFiles,
  handleDownload,
  setCopyLabel,
  copyLabel,
  copyFileLabel,
  setCopyFileLabel,
  setGithubModalOpen,
  setShowVercelTokenInput,
  setAnalysisTab,
  setAnalysisPanelOpen,
  setDesignSystemOpen,
  setDesignPanelOpen,
  getFileIcon,
}: CodeBuilderRightPanelProps) {
  return (
    <div style={{ width: "280px", flexShrink: 0, display: "flex", flexDirection: "column", borderLeft: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "2px", padding: "0 0.5rem", height: "48px", borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
        {([
          ["files", "Files", <svg key="f" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>],
          ["code", "Code", <svg key="c" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>],
          ["diff", "Diff", <svg key="d" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><path d="M5 12l7-7 7 7"/></svg>],
          ["actions", "Actions", <svg key="a" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>],
        ] as [string, string, React.ReactNode][]).map(([tab, label, icon]) => (
          <button
            key={tab}
            className="zivo-tab"
            onClick={() => setActiveRightTab(tab as "files" | "code" | "diff" | "actions")}
            title={label}
            style={{ padding: "0.3rem 0.6rem", borderRadius: "6px", border: "none", background: activeRightTab === tab ? "rgba(99,102,241,0.15)" : "transparent", color: activeRightTab === tab ? COLORS.accent : COLORS.textMuted, cursor: "pointer", fontSize: "0.75rem", fontWeight: activeRightTab === tab ? 600 : 400, transition: "color 0.15s", display: "flex", alignItems: "center", gap: "0.25rem" }}
          >
            {icon}
            {tab === "files" && output?.files?.length ? (
              <><span>{label}</span><span style={{ background: loading ? "rgba(245,158,11,0.25)" : "rgba(99,102,241,0.25)", borderRadius: "10px", padding: "0px 5px", fontSize: "0.6rem", fontWeight: 700, color: loading ? COLORS.warning : COLORS.accent }}>{output.files.length}</span></>
            ) : <span>{label}</span>}
          </button>
        ))}
      </div>

      {activeRightTab === "files" && (
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", animation: "fadeIn 0.3s ease" }}>
          <FileTree
            files={(output?.files ?? []) as Array<{ path: string; content: string; action?: "create" | "update" | "delete" }>}
            activeFile={activeFile?.path ?? null}
            onFileSelect={(f) => { setActiveFile(f as { path: string; content: string; action: "create" | "update" | "delete" }); setEditedContent(f.content); setSaveStatus("idle"); setActiveRightTab("code"); }}
          />
        </div>
      )}

      {activeRightTab === "code" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", animation: "fadeIn 0.3s ease" }}>
          {activeFile ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.75rem", borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
                <span style={{ fontSize: "0.875rem" }}>{getFileIcon(activeFile.path)}</span>
                <code style={{ flex: 1, fontSize: "0.75rem", color: COLORS.textSecondary, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={activeFile.path}>{activeFile.path}</code>
                <button
                  className="zivo-btn"
                  onClick={handleFileSave}
                  disabled={isSaving || loading || editedContent === activeFile.content}
                  title={loading ? "Build in progress — editing disabled" : "Save file"}
                  style={{
                    padding: "0.2rem 0.55rem",
                    background: saveStatus === "saved" ? "rgba(16,185,129,0.15)" : saveStatus === "error" ? "rgba(239,68,68,0.15)" : "rgba(99,102,241,0.15)",
                    border: `1px solid ${saveStatus === "saved" ? "rgba(16,185,129,0.4)" : saveStatus === "error" ? "rgba(239,68,68,0.4)" : "rgba(99,102,241,0.3)"}`,
                    borderRadius: "5px",
                    color: saveStatus === "saved" ? COLORS.success : saveStatus === "error" ? COLORS.error : COLORS.accent,
                    cursor: isSaving || loading || editedContent === activeFile.content ? "not-allowed" : "pointer",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    opacity: editedContent === activeFile.content ? 0.5 : 1,
                  }}
                >
                  {isSaving ? (
                    <><span style={{ display: "inline-block", width: "10px", height: "10px", border: "2px solid rgba(99,102,241,0.3)", borderTop: "2px solid currentColor", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Saving…</>
                  ) : saveStatus === "saved" ? (
                    <>✓ Saved</>
                  ) : saveStatus === "error" ? (
                    <>✕ Error</>
                  ) : (
                    <>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                      Save
                    </>
                  )}
                </button>
                <button
                  className="zivo-btn"
                  onClick={() => navigator.clipboard.writeText(editedContent ?? activeFile.content).then(() => {
                    setCopyFileLabel("copied");
                    setTimeout(() => setCopyFileLabel("copy"), 2000);
                  }).catch(() => {})}
                  style={{ padding: "0.2rem 0.5rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "5px", color: COLORS.textSecondary, cursor: "pointer", fontSize: "0.7rem", flexShrink: 0 }}
                >
                  {copyFileLabel === "copied" ? "✓" : "Copy"}
                </button>
              </div>
              <textarea
                className="zivo-textarea"
                value={editedContent ?? activeFile.content}
                onChange={(e) => { setEditedContent(e.target.value); setSaveStatus("idle"); }}
                readOnly={loading}
                spellCheck={false}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "s") {
                    e.preventDefault();
                    void handleFileSave();
                  }
                  if (e.key === "Tab") {
                    e.preventDefault();
                    const el = e.currentTarget;
                    const start = el.selectionStart;
                    const end = el.selectionEnd;
                    const val = el.value;
                    const newVal = val.slice(0, start) + "  " + val.slice(end);
                    setEditedContent(newVal);
                    requestAnimationFrame(() => {
                      el.selectionStart = start + 2;
                      el.selectionEnd = start + 2;
                    });
                  }
                }}
                style={{
                  flex: 1,
                  resize: "none",
                  width: "100%",
                  padding: "0.75rem",
                  background: "transparent",
                  border: "none",
                  color: loading ? COLORS.textMuted : COLORS.textPrimary,
                  fontSize: "0.75rem",
                  lineHeight: 1.7,
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                  outline: "none",
                  boxSizing: "border-box",
                  cursor: loading ? "not-allowed" : "text",
                }}
                title={loading ? "Build in progress — editing will resume when build completes" : undefined}
              />
              {editedContent !== null && editedContent !== activeFile.content && saveStatus === "idle" && (
                <div style={{ padding: "0.3rem 0.75rem", borderTop: `1px solid ${COLORS.border}`, flexShrink: 0, display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.7rem", color: COLORS.warning }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: COLORS.warning, flexShrink: 0 }} />
                  Unsaved changes — press <kbd style={{ padding: "0 4px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", fontSize: "0.65rem" }}>⌘S</kbd> or click Save
                </div>
              )}
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: COLORS.textMuted, fontSize: "0.8125rem", textAlign: "center", padding: "2rem" }}>
              Select a file from the Files tab to view and edit its code.
            </div>
          )}
        </div>
      )}

      {activeRightTab === "diff" && (
        <div style={{ flex: 1, overflow: "hidden", animation: "fadeIn 0.3s ease" }}>
          {showDiff && diffFiles.length > 0 ? (
            <DiffViewer files={diffFiles} />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: COLORS.textMuted, fontSize: "0.8125rem", textAlign: "center", padding: "2rem" }}>
              No diff available. Build a project to see changes.
            </div>
          )}
        </div>
      )}

      {activeRightTab === "actions" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "0.875rem", animation: "fadeIn 0.3s ease", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          <div style={{ fontSize: "0.65rem", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: "0.25rem" }}>Export &amp; Deploy</div>
          {[
            { label: "Download ZIP", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>, action: () => handleDownload(), disabled: !output?.files?.length },
            { label: "Copy All Files", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>, action: () => { if (output?.files?.length) { const all = output.files.map((f) => `// === ${f.path} ===\n${f.content}`).join("\n\n"); navigator.clipboard.writeText(all).catch(() => {}); setCopyLabel("saved"); setTimeout(() => setCopyLabel("save"), 2000); } }, disabled: !output?.files?.length },
            { label: "Push to GitHub", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>, action: () => setGithubModalOpen(true), disabled: !output?.files?.length },
            { label: "Deploy to Vercel", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M24 22.525H0l12-21.05 12 21.05z"/></svg>, action: () => { setShowVercelTokenInput(true); }, disabled: !output?.files?.length },
          ].map(({ label, icon, action, disabled }) => (
            <button
              key={label}
              className="zivo-btn"
              onClick={action}
              disabled={disabled || loading}
              style={{ width: "100%", padding: "0.55rem 0.75rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: disabled ? COLORS.textMuted : COLORS.textPrimary, cursor: disabled || loading ? "not-allowed" : "pointer", fontSize: "0.8125rem", display: "flex", alignItems: "center", gap: "0.5rem", opacity: disabled ? 0.5 : 1, transition: "border-color 0.15s, background 0.15s" }}
            >
              <span style={{ color: COLORS.accent, flexShrink: 0 }}>{icon}</span>
              {label}
            </button>
          ))}

          <div style={{ height: "1px", background: COLORS.border, margin: "0.25rem 0" }} />
          <div style={{ fontSize: "0.65rem", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: "0.25rem" }}>Analysis</div>
          {[
            { label: "SEO Analyzer", action: () => { setAnalysisTab("seo"); setAnalysisPanelOpen(true); }, icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg> },
            { label: "Accessibility", action: () => { setAnalysisTab("a11y"); setAnalysisPanelOpen(true); }, icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg> },
            { label: "Performance", action: () => { setAnalysisTab("perf"); setAnalysisPanelOpen(true); }, icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg> },
            { label: "Generate Docs", action: () => { setAnalysisTab("docs"); setAnalysisPanelOpen(true); }, icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg> },
          ].map(({ label, action, icon }) => (
            <button
              key={label}
              className="zivo-btn"
              onClick={action}
              disabled={!output?.files?.length || loading}
              style={{ width: "100%", padding: "0.55rem 0.75rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textPrimary, cursor: !output?.files?.length || loading ? "not-allowed" : "pointer", fontSize: "0.8125rem", display: "flex", alignItems: "center", gap: "0.5rem", opacity: !output?.files?.length ? 0.5 : 1, transition: "border-color 0.15s, background 0.15s" }}
            >
              <span style={{ color: COLORS.success, flexShrink: 0 }}>{icon}</span>
              {label}
            </button>
          ))}

          <div style={{ height: "1px", background: COLORS.border, margin: "0.25rem 0" }} />
          <div style={{ fontSize: "0.65rem", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: "0.25rem" }}>Design</div>
          {[
            { label: "Design System", action: () => setDesignSystemOpen(true), icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12.5" r="2.5"/></svg> },
            { label: "Theme Editor", action: () => setDesignPanelOpen((o) => !o), icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/></svg> },
          ].map(({ label, action, icon }) => (
            <button
              key={label}
              className="zivo-btn"
              onClick={action}
              style={{ width: "100%", padding: "0.55rem 0.75rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textPrimary, cursor: "pointer", fontSize: "0.8125rem", display: "flex", alignItems: "center", gap: "0.5rem", transition: "border-color 0.15s, background 0.15s" }}
            >
              <span style={{ color: COLORS.warning, flexShrink: 0 }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

