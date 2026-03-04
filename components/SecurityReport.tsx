'use client';

import { useState } from "react";

export interface SecurityIssue {
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  description: string;
  line?: number | null;
  cwe?: string | null;
  recommendation: string;
}

export interface SecurityReportProps {
  issues: SecurityIssue[];
  score: number;
  summary: string;
  language: string;
  onFix?: (issue: SecurityIssue) => void;
}

const SEVERITY_CONFIG: Record<
  SecurityIssue["severity"],
  { bg: string; color: string; border: string; label: string }
> = {
  critical: { bg: "rgba(239,68,68,0.15)", color: "#ef4444", border: "rgba(239,68,68,0.4)", label: "Critical" },
  high: { bg: "rgba(249,115,22,0.15)", color: "#f97316", border: "rgba(249,115,22,0.4)", label: "High" },
  medium: { bg: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "rgba(245,158,11,0.4)", label: "Medium" },
  low: { bg: "rgba(59,130,246,0.15)", color: "#3b82f6", border: "rgba(59,130,246,0.4)", label: "Low" },
  info: { bg: "rgba(148,163,184,0.1)", color: "#94a3b8", border: "rgba(148,163,184,0.3)", label: "Info" },
};

function ScoreBadge({ score }: { score: number }): React.ReactElement {
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 64,
        height: 64,
        borderRadius: "50%",
        border: `3px solid ${color}`,
        fontSize: "1.25rem",
        fontWeight: 700,
        color,
      }}
    >
      {score}
    </div>
  );
}

export default function SecurityReport({
  issues,
  score,
  summary,
  language,
  onFix,
}: SecurityReportProps): React.ReactElement {
  const [expanded, setExpanded] = useState<string | null>(null);

  const counts = Object.fromEntries(
    (["critical", "high", "medium", "low", "info"] as const).map((s) => [
      s,
      issues.filter((i) => i.severity === s).length,
    ])
  );

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", color: "#f1f5f9" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
          padding: "1.25rem",
          background: "rgba(255,255,255,0.04)",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.08)",
          marginBottom: "1rem",
        }}
      >
        <ScoreBadge score={score} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.25rem" }}>
            Security Score: {score}/100 — {language}
          </div>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "#94a3b8" }}>{summary}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {(["critical", "high", "medium", "low", "info"] as const).map((s) =>
            counts[s] > 0 ? (
              <span
                key={s}
                style={{
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  background: SEVERITY_CONFIG[s].bg,
                  color: SEVERITY_CONFIG[s].color,
                  border: `1px solid ${SEVERITY_CONFIG[s].border}`,
                }}
              >
                {counts[s]} {SEVERITY_CONFIG[s].label}
              </span>
            ) : null
          )}
        </div>
      </div>

      {/* Issues list */}
      {issues.length === 0 ? (
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            color: "#10b981",
            background: "rgba(16,185,129,0.08)",
            borderRadius: "12px",
            border: "1px solid rgba(16,185,129,0.2)",
          }}
        >
          ✅ No security issues detected
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {issues.map((issue) => {
            const cfg = SEVERITY_CONFIG[issue.severity];
            const isOpen = expanded === issue.id;
            return (
              <div
                key={issue.id}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${isOpen ? cfg.border : "rgba(255,255,255,0.08)"}`,
                  borderRadius: "10px",
                  overflow: "hidden",
                  transition: "border-color 0.15s",
                }}
              >
                {/* Row */}
                <button
                  onClick={() => setExpanded(isOpen ? null : issue.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.875rem 1rem",
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    color: "#f1f5f9",
                  }}
                >
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      background: cfg.bg,
                      color: cfg.color,
                      border: `1px solid ${cfg.border}`,
                      flexShrink: 0,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {cfg.label}
                  </span>
                  <span style={{ flex: 1, fontWeight: 600, fontSize: "0.875rem" }}>
                    {issue.title}
                  </span>
                  {issue.line && (
                    <span style={{ fontSize: "0.75rem", color: "#475569", flexShrink: 0 }}>
                      line {issue.line}
                    </span>
                  )}
                  {issue.cwe && (
                    <span style={{ fontSize: "0.7rem", color: "#475569", flexShrink: 0 }}>
                      {issue.cwe}
                    </span>
                  )}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{
                      transform: isOpen ? "rotate(180deg)" : "none",
                      transition: "transform 0.2s",
                      flexShrink: 0,
                      color: "#475569",
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Detail panel */}
                {isOpen && (
                  <div
                    style={{
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                      padding: "1rem",
                      background: "rgba(0,0,0,0.2)",
                    }}
                  >
                    <p style={{ margin: "0 0 0.75rem", fontSize: "0.875rem", color: "#cbd5e1" }}>
                      {issue.description}
                    </p>
                    <div
                      style={{
                        padding: "0.75rem",
                        background: "rgba(16,185,129,0.08)",
                        border: "1px solid rgba(16,185,129,0.2)",
                        borderRadius: "8px",
                        marginBottom: "0.75rem",
                      }}
                    >
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "#10b981", fontWeight: 600 }}>
                        💡 Recommendation
                      </p>
                      <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "#94a3b8" }}>
                        {issue.recommendation}
                      </p>
                    </div>
                    {onFix && (
                      <button
                        onClick={() => onFix(issue)}
                        style={{
                          padding: "0.4rem 1rem",
                          background: cfg.bg,
                          border: `1px solid ${cfg.border}`,
                          borderRadius: "6px",
                          color: cfg.color,
                          fontWeight: 600,
                          fontSize: "0.8rem",
                          cursor: "pointer",
                        }}
                      >
                        Auto-fix this issue
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
