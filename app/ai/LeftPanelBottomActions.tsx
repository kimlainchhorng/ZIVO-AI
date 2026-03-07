import { COLORS } from "./colors";

interface GeneratedFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

interface OutputData {
  files?: GeneratedFile[];
}

interface LeftPanelBottomActionsProps {
  mode: string;
  hasFiles: boolean;
  showVercelTokenInput: boolean;
  setShowVercelTokenInput: (value: boolean) => void;
  vercelToken: string;
  setVercelToken: (value: string) => void;
  handleDeploy: (platform: "vercel" | "netlify") => Promise<void>;
  handleDownload: () => void;
  connectedGithubRepo: string | null;
  handleGithubPush: () => void;
  setGithubModalOpen: (value: boolean) => void;
  githubPushing: boolean;
  deploying: boolean;
  output: OutputData | null;
  copyLabel: "save" | "saved";
  setCopyLabel: React.Dispatch<React.SetStateAction<"save" | "saved">>;
}

export default function LeftPanelBottomActions({
  mode,
  hasFiles,
  showVercelTokenInput,
  setShowVercelTokenInput,
  vercelToken,
  setVercelToken,
  handleDeploy,
  handleDownload,
  connectedGithubRepo,
  handleGithubPush,
  setGithubModalOpen,
  githubPushing,
  deploying,
  output,
  copyLabel,
  setCopyLabel,
}: LeftPanelBottomActionsProps) {
  if (mode !== "code" || !hasFiles) {
    return null;
  }

  return (
    <div style={{ padding: "0.75rem 1rem", borderTop: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, flexShrink: 0 }}>
      {/* Vercel token input (shown when deploy is clicked and no token exists) */}
      {showVercelTokenInput && (
        <div style={{ marginBottom: "0.625rem", padding: "0.625rem 0.75rem", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: "8px", animation: "fadeIn 0.2s ease" }}>
          <div style={{ fontSize: "0.75rem", color: COLORS.textSecondary, marginBottom: "0.4rem" }}>
            Enter your{" "}
            <a href="https://vercel.com/account/tokens" target="_blank" rel="noreferrer" style={{ color: COLORS.accent }}>Vercel token</a>
            {" "}to deploy:
          </div>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            <input
              type="password"
              value={vercelToken}
              onChange={(e) => setVercelToken(e.target.value)}
              placeholder="vercel_..."
              style={{ flex: 1, padding: "0.4rem 0.6rem", background: "rgba(0,0,0,0.3)", border: `1px solid ${COLORS.border}`, borderRadius: "6px", color: COLORS.textPrimary, fontSize: "0.8125rem", outline: "none" }}
            />
            <button
              className="zivo-btn"
              onClick={() => {
                if (vercelToken) {
                  try { localStorage.setItem("zivo_vercel_token", vercelToken); } catch { /* ignore */ }
                  setShowVercelTokenInput(false);
                  handleDeploy("vercel");
                }
              }}
              disabled={!vercelToken.trim()}
              style={{ padding: "0.4rem 0.75rem", background: COLORS.accentGradient, border: "none", borderRadius: "6px", color: "#fff", cursor: !vercelToken.trim() ? "not-allowed" : "pointer", fontSize: "0.8125rem", fontWeight: 600, flexShrink: 0 }}
            >
              Deploy
            </button>
            <button
              className="zivo-btn"
              onClick={() => setShowVercelTokenInput(false)}
              style={{ padding: "0.4rem 0.6rem", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: "6px", color: COLORS.textMuted, cursor: "pointer", fontSize: "0.8125rem" }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
      {/* Action row */}
      <div style={{ display: "flex", gap: "0.4rem" }}>
        {/* ZIP download */}
        <button
          className="zivo-btn"
          onClick={handleDownload}
          title="Download as ZIP"
          style={{ flex: 1, padding: "0.45rem 0.5rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textSecondary, cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem", transition: "border-color 0.15s" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          <span>ZIP</span>
        </button>
        {/* GitHub push */}
        <button
          className="zivo-btn"
          onClick={() => {
            if (connectedGithubRepo) {
              handleGithubPush();
            } else {
              setGithubModalOpen(true);
            }
          }}
          disabled={githubPushing}
          title="Push to GitHub"
          style={{ flex: 1, padding: "0.45rem 0.5rem", background: githubPushing ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: "8px", color: COLORS.accent, cursor: githubPushing ? "not-allowed" : "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem" }}
        >
          {githubPushing ? (
            <span style={{ display: "inline-block", width: "11px", height: "11px", border: "2px solid rgba(99,102,241,0.3)", borderTop: "2px solid currentColor", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
          )}
          <span>{githubPushing ? "Pushing…" : "GitHub"}</span>
        </button>
        {/* Deploy */}
        <button
          className="zivo-btn"
          onClick={() => handleDeploy("vercel")}
          disabled={deploying}
          title="Deploy to Vercel"
          style={{ flex: 1, padding: "0.45rem 0.5rem", background: deploying ? "rgba(16,185,129,0.06)" : "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.28)", borderRadius: "8px", color: COLORS.success, cursor: deploying ? "not-allowed" : "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem" }}
        >
          {deploying ? (
            <span style={{ display: "inline-block", width: "11px", height: "11px", border: "2px solid rgba(16,185,129,0.3)", borderTop: "2px solid currentColor", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
          )}
          <span>{deploying ? "Deploying…" : "Deploy"}</span>
        </button>
        {/* Save / copy all */}
        <button
          className="zivo-btn"
          onClick={() => {
            const all = output?.files?.map((f) => `// ${f.path}\n${f.content}`).join("\n\n---\n\n") ?? "";
            navigator.clipboard.writeText(all).then(() => {
              setCopyLabel("saved");
              setTimeout(() => setCopyLabel("save"), 2000);
            }).catch(() => {});
          }}
          title="Copy all files to clipboard"
          style={{ flex: 1, padding: "0.45rem 0.5rem", background: copyLabel === "saved" ? "rgba(16,185,129,0.12)" : "transparent", border: `1px solid ${copyLabel === "saved" ? "rgba(16,185,129,0.3)" : COLORS.border}`, borderRadius: "8px", color: copyLabel === "saved" ? COLORS.success : COLORS.textSecondary, cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem", transition: "background 0.2s, border-color 0.2s, color 0.2s" }}
        >
          {copyLabel === "saved" ? (
            <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><span>Saved!</span></>
          ) : (
            <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/></svg><span>Save</span></>
          )}
        </button>
      </div>
    </div>
  );
}
