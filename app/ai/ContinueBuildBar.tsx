import { COLORS } from "./colors";

interface ContinueBuildBarProps {
  mode: string;
  hasFiles: boolean;
  loading: boolean;
  continueInstruction: string;
  setContinueInstruction: (value: string) => void;
  buildIterationCount: number;
  handleBuild: (instruction: string) => void;
}

export default function ContinueBuildBar({
  mode,
  hasFiles,
  loading,
  continueInstruction,
  setContinueInstruction,
  buildIterationCount,
  handleBuild,
}: ContinueBuildBarProps) {
  if (mode !== "code" || !hasFiles || loading) {
    return null;
  }

  return (
    <div style={{ borderTop: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, padding: "0.625rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0, animation: "fadeIn 0.3s ease" }}>
      <input
        className="zivo-input"
        value={continueInstruction}
        onChange={(e) => setContinueInstruction(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (continueInstruction.trim()) {
              const instruction = continueInstruction;
              setContinueInstruction("");
              handleBuild(instruction);
            }
          }
        }}
        placeholder="Describe what to add or change… (e.g. Add dark mode toggle)"
        maxLength={1000}
        style={{ flex: 1, background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.4rem 0.75rem", color: COLORS.textPrimary, fontSize: "0.8125rem", outline: "none" }}
      />
      {buildIterationCount > 0 && (
        <span style={{ padding: "0.2rem 0.55rem", background: "rgba(99,102,241,0.15)", border: `1px solid rgba(99,102,241,0.3)`, borderRadius: "20px", fontSize: "0.7rem", fontWeight: 700, color: COLORS.accent, flexShrink: 0 }}>
          #{buildIterationCount}
        </span>
      )}
      <button
        className="zivo-btn"
        disabled={!continueInstruction.trim() || loading}
        onClick={() => {
          if (continueInstruction.trim()) {
            const instruction = continueInstruction;
            setContinueInstruction("");
            handleBuild(instruction);
          }
        }}
        style={{ padding: "0.4rem 0.875rem", background: continueInstruction.trim() ? COLORS.accentGradient : "rgba(99,102,241,0.15)", border: "none", borderRadius: "8px", color: "#fff", cursor: !continueInstruction.trim() ? "not-allowed" : "pointer", fontSize: "0.8125rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.35rem", flexShrink: 0, opacity: !continueInstruction.trim() ? 0.5 : 1 }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        Continue Build ▶
      </button>
    </div>
  );
}
