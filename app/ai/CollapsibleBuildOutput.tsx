import { COLORS } from "./colors";

interface LogEntry {
  type: "log" | "error" | "success";
  text: string;
}

interface CollapsibleBuildOutputProps {
  mode: string;
  loading: boolean;
  consoleLogs: LogEntry[];
  buildOutputOpen: boolean;
  setBuildOutputOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  buildIteration: number;
  buildIterationCount: number;
  consoleEndRef: React.RefObject<HTMLDivElement>;
}

export default function CollapsibleBuildOutput({
  mode,
  loading,
  consoleLogs,
  buildOutputOpen,
  setBuildOutputOpen,
  buildIteration,
  buildIterationCount,
  consoleEndRef,
}: CollapsibleBuildOutputProps) {
  if (mode !== "code" || (!loading && consoleLogs.length === 0)) {
    return null;
  }

  return (
    <div style={{ flexShrink: 0, borderBottom: `1px solid ${COLORS.border}` }}>
      {/* Header / toggle */}
      <button
        className="zivo-btn"
        onClick={() => setBuildOutputOpen((o) => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 1rem", background: COLORS.bgPanel, border: "none", borderBottom: buildOutputOpen ? `1px solid ${COLORS.border}` : "none", cursor: "pointer", textAlign: "left" }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={COLORS.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: buildOutputOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}><polyline points="9 18 15 12 9 6"/></svg>
        <span style={{ fontSize: "0.7rem", fontWeight: 600, color: COLORS.textSecondary, letterSpacing: "0.04em", textTransform: "uppercase" }}>Build Output</span>
        <div style={{ flex: 1 }} />
        {loading ? (
          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "1px 7px", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "20px", fontSize: "0.65rem", fontWeight: 700, color: COLORS.warning }}>
            <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: COLORS.warning, animation: "statusBlink 1.2s infinite" }} />
            Running…
          </span>
        ) : consoleLogs.some((l) => l.type === "error") ? (
          <span style={{ padding: "1px 7px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "20px", fontSize: "0.65rem", fontWeight: 700, color: COLORS.error }}>
            Errors
          </span>
        ) : buildIterationCount > 0 ? (
          <span style={{ padding: "1px 7px", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "20px", fontSize: "0.65rem", fontWeight: 700, color: COLORS.success }}>
            Pass {buildIterationCount} ✓
          </span>
        ) : null}
      </button>
      {/* Scrollable log area */}
      {buildOutputOpen && (
        <div>
          {/* Progress bar */}
          {(loading || buildIterationCount > 0) && (
            <div style={{ padding: "0.4rem 1rem 0.35rem", background: COLORS.bgPanel }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                <span style={{ fontSize: "0.65rem", color: COLORS.textMuted }}>
                  {loading ? `Pass ${buildIteration}/8` : `Completed ${buildIterationCount} pass${buildIterationCount !== 1 ? "es" : ""}`}
                </span>
                <span style={{ fontSize: "0.65rem", fontWeight: 600, color: loading ? COLORS.warning : consoleLogs.some((l) => l.type === "error") ? COLORS.error : COLORS.success }}>
                  {loading ? "Running…" : consoleLogs.some((l) => l.type === "error") ? "Errors found" : "Passed ✓"}
                </span>
              </div>
              <div style={{ height: "3px", background: "rgba(255,255,255,0.06)", borderRadius: "9999px", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  borderRadius: "9999px",
                  background: loading
                    ? COLORS.warning
                    : consoleLogs.some((l) => l.type === "error")
                    ? COLORS.error
                    : COLORS.success,
                  width: loading
                    ? `${Math.max(4, Math.round((buildIteration / 8) * 100))}%`
                    : "100%",
                  transition: "width 0.4s ease, background 0.3s ease",
                }} />
              </div>
            </div>
          )}
          <div style={{ maxHeight: "140px", overflowY: "auto", background: "#000", padding: "0.5rem 1rem" }}>
            <div style={{ fontFamily: "'Fira Code', 'SF Mono', monospace", fontSize: "0.75rem", lineHeight: 1.7 }}>
              {consoleLogs.slice(-60).map((log, i) => (
                <div key={i} style={{ color: log.type === "error" ? COLORS.error : log.type === "success" ? COLORS.success : "#4ade80" }}>
                  {log.text}
                </div>
              ))}
              {loading && (
                <span style={{ display: "inline-block", width: "7px", height: "1em", background: "#4ade80", verticalAlign: "middle", animation: "cursorBlink 1s step-end infinite" }} />
              )}
              <div ref={consoleEndRef} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
