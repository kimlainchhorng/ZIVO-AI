'use client';

import { COLORS } from "./colors";

interface CreatePageModalProps {
  isOpen: boolean;
  createPageName: string;
  setCreatePageName: (v: string) => void;
  createPageRoute: string;
  setCreatePageRoute: (v: string) => void;
  createPageDescription: string;
  setCreatePageDescription: (v: string) => void;
  onClose: () => void;
  onGenerate: (prompt: string) => void;
}

export function CreatePageModal({
  isOpen,
  createPageName,
  setCreatePageName,
  createPageRoute,
  setCreatePageRoute,
  createPageDescription,
  setCreatePageDescription,
  onClose,
  onGenerate,
}: CreatePageModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#0f1120", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "1.5rem", width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <span style={{ fontSize: "1rem", fontWeight: 700, color: "#f1f5f9" }}>Create Page</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1.1rem", padding: "0 0.25rem" }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Page Name</span>
            <input
              type="text"
              value={createPageName}
              onChange={(e) => setCreatePageName(e.target.value)}
              placeholder="e.g. Settings, Profile, Pricing"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.6rem 0.75rem", color: "#f1f5f9", fontSize: "0.875rem", outline: "none", width: "100%", boxSizing: "border-box" }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Route</span>
            <input
              type="text"
              value={createPageRoute}
              onChange={(e) => setCreatePageRoute(e.target.value)}
              placeholder="e.g. /settings, /profile"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.6rem 0.75rem", color: "#f1f5f9", fontSize: "0.875rem", fontFamily: "monospace", outline: "none", width: "100%", boxSizing: "border-box" }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Description</span>
            <textarea
              value={createPageDescription}
              onChange={(e) => setCreatePageDescription(e.target.value)}
              placeholder="Describe what this page should do and look like…"
              rows={3}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.6rem 0.75rem", color: "#f1f5f9", fontSize: "0.875rem", outline: "none", width: "100%", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }}
            />
          </label>
        </div>
        <div style={{ display: "flex", gap: "0.625rem", marginTop: "1.25rem" }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: "0.6rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#94a3b8", fontSize: "0.875rem", cursor: "pointer", fontWeight: 600 }}
          >
            Cancel
          </button>
          <button
            disabled={!createPageName.trim()}
            onClick={() => {
              const pagePrompt = `Generate a ${createPageName} page${createPageRoute ? ` at route ${createPageRoute}` : ""}. ${createPageDescription || "Make it look polished and consistent with the rest of the app."}`;
              onGenerate(pagePrompt);
            }}
            style={{ flex: 2, padding: "0.6rem", background: !createPageName.trim() ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", borderRadius: 8, color: "#fff", fontSize: "0.875rem", cursor: !createPageName.trim() ? "not-allowed" : "pointer", fontWeight: 700 }}
          >
            Generate Page ▶
          </button>
        </div>
      </div>
    </div>
  );
}

interface GitHubPushModalProps {
  isOpen: boolean;
  fileCount: number;
  githubModalOwner: string;
  setGithubModalOwner: (v: string) => void;
  githubModalRepo: string;
  setGithubModalRepo: (v: string) => void;
  githubModalBranch: string;
  setGithubModalBranch: (v: string) => void;
  githubModalToken: string;
  setGithubModalToken: (v: string) => void;
  githubPushing: boolean;
  onClose: () => void;
  onPush: () => void;
}

export function GitHubPushModal({
  isOpen,
  fileCount,
  githubModalOwner,
  setGithubModalOwner,
  githubModalRepo,
  setGithubModalRepo,
  githubModalBranch,
  setGithubModalBranch,
  githubModalToken,
  setGithubModalToken,
  githubPushing,
  onClose,
  onPush,
}: GitHubPushModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001, padding: "1rem" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#0f1120", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "1.5rem", width: "100%", maxWidth: 460, boxShadow: "0 20px 60px rgba(0,0,0,0.5)", animation: "fadeIn 0.2s ease" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={COLORS.textPrimary}><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            <span style={{ fontSize: "1rem", fontWeight: 700, color: COLORS.textPrimary }}>Push to GitHub</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: "1.1rem", padding: "0 0.25rem" }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Owner</span>
              <input type="text" value={githubModalOwner} onChange={(e) => setGithubModalOwner(e.target.value)} placeholder="your-username" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.5rem 0.65rem", color: COLORS.textPrimary, fontSize: "0.875rem", outline: "none" }} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Repository</span>
              <input type="text" value={githubModalRepo} onChange={(e) => setGithubModalRepo(e.target.value)} placeholder="my-app" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.5rem 0.65rem", color: COLORS.textPrimary, fontSize: "0.875rem", outline: "none" }} />
            </label>
          </div>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Branch</span>
            <input type="text" value={githubModalBranch} onChange={(e) => setGithubModalBranch(e.target.value)} placeholder="main" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.5rem 0.65rem", color: COLORS.textPrimary, fontSize: "0.875rem", fontFamily: "monospace", outline: "none" }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              GitHub Token{" "}
              <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" style={{ color: COLORS.accent, textTransform: "none", fontWeight: 400 }}>(generate)</a>
            </span>
            <input type="password" value={githubModalToken} onChange={(e) => setGithubModalToken(e.target.value)} placeholder="ghp_... (leave blank to use saved token)" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.5rem 0.65rem", color: COLORS.textPrimary, fontSize: "0.875rem", fontFamily: "monospace", outline: "none" }} />
          </label>
          <div style={{ fontSize: "0.75rem", color: COLORS.textMuted, background: "rgba(255,255,255,0.03)", border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "0.5rem 0.65rem" }}>
            Pushing <strong style={{ color: COLORS.textSecondary }}>{fileCount} files</strong> to GitHub. Token is saved locally for future pushes.
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.625rem", marginTop: "1.25rem" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "0.6rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: COLORS.textMuted, fontSize: "0.875rem", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
          <button
            disabled={githubPushing}
            onClick={onPush}
            style={{ flex: 2, padding: "0.6rem", background: githubPushing ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", borderRadius: 8, color: "#fff", fontSize: "0.875rem", cursor: githubPushing ? "not-allowed" : "pointer", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
          >
            {githubPushing ? (
              <><span style={{ display: "inline-block", width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Pushing…</>
            ) : (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" x2="12" y1="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg> Push to GitHub</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
