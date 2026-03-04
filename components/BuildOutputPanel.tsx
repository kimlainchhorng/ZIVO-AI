"use client";

import React, { useState } from "react";
import type { BuildError, BuildWarning } from "@/lib/ai/fix-loop";

interface BuildOutputPanelProps {
  errors: BuildError[];
  warnings: BuildWarning[];
  logs: string[];
  isRunning: boolean;
  iteration: number;
  maxIterations: number;
  onFix?: () => void;
}

const ERROR_ICON = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <circle cx="7" cy="7" r="6.5" stroke="#ef4444" />
    <path d="M7 4v3.5M7 9.5v.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const WARN_ICON = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M7 1.5L13 12.5H1L7 1.5Z" stroke="#f59e0b" strokeWidth="1.2" />
    <path d="M7 5.5v3M7 10v.5" stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const CHEVRON_DOWN = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CHEVRON_RIGHT = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function FileLocation({ file, line }: { file?: string; line?: number }) {
  if (!file) return null;
  return (
    <span style={{ color: "#94a3b8", fontSize: 11, fontFamily: "monospace" }}>
      {file}
      {line != null ? `:${line}` : ""}
    </span>
  );
}

export default function BuildOutputPanel({
  errors,
  warnings,
  logs,
  isRunning,
  iteration,
  maxIterations,
  onFix,
}: BuildOutputPanelProps): React.JSX.Element {
  const [panelOpen, setPanelOpen] = useState(true);
  const [warningsOpen, setWarningsOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);

  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;
  const hasLogs = logs.length > 0;

  const statusColor = isRunning ? "#f59e0b" : hasErrors ? "#ef4444" : "#10b981";
  const statusLabel = isRunning ? "Running…" : hasErrors ? "Failed" : "Passed";

  return (
    <div
      style={{
        background: "#0f1120",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      {/* Panel header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          background: "#0a0b14",
          borderBottom: panelOpen ? "1px solid rgba(255,255,255,0.08)" : "none",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setPanelOpen((o) => !o)}
            aria-label={panelOpen ? "Collapse panel" : "Expand panel"}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#94a3b8",
              padding: 0,
              display: "flex",
              alignItems: "center",
            }}
          >
            {panelOpen ? CHEVRON_DOWN : CHEVRON_RIGHT}
          </button>
          <span style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 13 }}>Build Output</span>
          <span
            style={{
              fontSize: 11,
              color: "#94a3b8",
              background: "rgba(255,255,255,0.05)",
              borderRadius: 4,
              padding: "2px 7px",
            }}
          >
            Pass {iteration}/{maxIterations}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Status indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: statusColor,
                display: "inline-block",
                boxShadow: isRunning ? `0 0 6px ${statusColor}` : "none",
              }}
            />
            <span style={{ fontSize: 12, color: statusColor }}>{statusLabel}</span>
          </div>

          {/* Auto-Fix button */}
          {hasErrors && !isRunning && onFix && (
            <button
              onClick={onFix}
              style={{
                padding: "5px 14px",
                borderRadius: 6,
                border: "1px solid rgba(99,102,241,0.4)",
                background: "rgba(99,102,241,0.15)",
                color: "#a5b4fc",
                fontSize: 12,
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Auto-Fix
            </button>
          )}
        </div>
      </div>

      {panelOpen && (
        <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Errors */}
          {hasErrors && (
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#ef4444",
                  marginBottom: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {ERROR_ICON}
                {errors.length} Error{errors.length !== 1 ? "s" : ""}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {errors.map((err, i) => (
                  <div
                    key={i}
                    style={{
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      borderRadius: 6,
                      padding: "8px 10px",
                    }}
                  >
                    <FileLocation file={err.file} line={err.line} />
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "#fca5a5", lineHeight: 1.5 }}>
                      {err.message}
                    </p>
                    {err.type && (
                      <span
                        style={{
                          fontSize: 10,
                          color: "#94a3b8",
                          background: "rgba(255,255,255,0.05)",
                          borderRadius: 3,
                          padding: "1px 5px",
                          marginTop: 4,
                          display: "inline-block",
                        }}
                      >
                        {err.type}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings (collapsible) */}
          {hasWarnings && (
            <div>
              <button
                onClick={() => setWarningsOpen((o) => !o)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: 0,
                  marginBottom: warningsOpen ? 6 : 0,
                }}
              >
                <span style={{ color: "#94a3b8", display: "flex", alignItems: "center" }}>
                  {warningsOpen ? CHEVRON_DOWN : CHEVRON_RIGHT}
                </span>
                {WARN_ICON}
                <span style={{ fontSize: 12, fontWeight: 600, color: "#f59e0b" }}>
                  {warnings.length} Warning{warnings.length !== 1 ? "s" : ""}
                </span>
              </button>
              {warningsOpen && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {warnings.map((w, i) => (
                    <div
                      key={i}
                      style={{
                        background: "rgba(245,158,11,0.07)",
                        border: "1px solid rgba(245,158,11,0.18)",
                        borderRadius: 6,
                        padding: "8px 10px",
                      }}
                    >
                      <FileLocation file={w.file} line={w.line} />
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: "#fcd34d", lineHeight: 1.5 }}>
                        {w.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Logs (collapsible) */}
          {hasLogs && (
            <div>
              <button
                onClick={() => setLogsOpen((o) => !o)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: 0,
                  marginBottom: logsOpen ? 6 : 0,
                }}
              >
                <span style={{ color: "#94a3b8", display: "flex", alignItems: "center" }}>
                  {logsOpen ? CHEVRON_DOWN : CHEVRON_RIGHT}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>
                  Logs ({logs.length})
                </span>
              </button>
              {logsOpen && (
                <div
                  style={{
                    background: "#0a0b14",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 6,
                    padding: "10px 12px",
                    maxHeight: 240,
                    overflowY: "auto",
                  }}
                >
                  {logs.map((log, i) => (
                    <pre
                      key={i}
                      style={{
                        margin: 0,
                        fontSize: 11,
                        color: "#94a3b8",
                        fontFamily: "monospace",
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-all",
                      }}
                    >
                      {log}
                    </pre>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {!hasErrors && !hasWarnings && !hasLogs && !isRunning && (
            <div style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "12px 0" }}>
              No output yet.
            </div>
          )}

          {/* Running state */}
          {isRunning && !hasErrors && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#f59e0b", fontSize: 13 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "#f59e0b",
                  display: "inline-block",
                  animation: "pulse 1.2s ease-in-out infinite",
                }}
              />
              Building…
            </div>
          )}
        </div>
      )}
    </div>
  );
}
