"use client";

import React, { useCallback, useMemo, useState } from "react";

export interface DiffFile {
  path: string;
  oldContent: string;
  newContent: string;
}

interface DiffViewerProps {
  files: DiffFile[];
  onApply?: (filePath: string) => void;
  onUndo?: (filePath: string) => void;
}

type DiffLineType = "add" | "remove" | "context";

interface DiffLine {
  type: DiffLineType;
  content: string;
  oldLineNum: number | null;
  newLineNum: number | null;
}

// Compute longest common subsequence indices for two string arrays
function lcs(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp;
}

function computeDiff(oldLines: string[], newLines: string[]): DiffLine[] {
  const dp = lcs(oldLines, newLines);
  const result: DiffLine[] = [];
  let i = oldLines.length;
  let j = newLines.length;
  const ops: Array<{ type: DiffLineType; oldIdx: number | null; newIdx: number | null }> = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      ops.push({ type: "context", oldIdx: i - 1, newIdx: j - 1 });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({ type: "add", oldIdx: null, newIdx: j - 1 });
      j--;
    } else {
      ops.push({ type: "remove", oldIdx: i - 1, newIdx: null });
      i--;
    }
  }

  ops.reverse();

  let oldNum = 1;
  let newNum = 1;
  for (const op of ops) {
    if (op.type === "context") {
      result.push({ type: "context", content: oldLines[op.oldIdx!], oldLineNum: oldNum++, newLineNum: newNum++ });
    } else if (op.type === "add") {
      result.push({ type: "add", content: newLines[op.newIdx!], oldLineNum: null, newLineNum: newNum++ });
    } else {
      result.push({ type: "remove", content: oldLines[op.oldIdx!], oldLineNum: oldNum++, newLineNum: null });
    }
  }

  return result;
}

const LINE_STYLES: Record<DiffLineType, { bg: string; prefix: string; prefixColor: string }> = {
  add: { bg: "rgba(16,185,129,0.15)", prefix: "+", prefixColor: "#10b981" },
  remove: { bg: "rgba(239,68,68,0.15)", prefix: "-", prefixColor: "#ef4444" },
  context: { bg: "transparent", prefix: " ", prefixColor: "#94a3b8" },
};

interface FileDiffPanelProps {
  file: DiffFile;
  onApply?: (filePath: string) => void;
  onUndo?: (filePath: string) => void;
}

function FileDiffPanel({ file, onApply, onUndo }: FileDiffPanelProps): React.JSX.Element {
  const [collapsed, setCollapsed] = useState(false);
  const [copyLabel, setCopyLabel] = useState<"📋 Copy" | "✓ Copied">("📋 Copy");

  const { diffLines, additions, deletions } = useMemo(() => {
    if (!file.oldContent && !file.newContent) {
      return { diffLines: [], additions: 0, deletions: 0 };
    }
    const oldLines = file.oldContent ? file.oldContent.split("\n") : [];
    const newLines = file.newContent ? file.newContent.split("\n") : [];
    const lines = computeDiff(oldLines, newLines);
    const adds = lines.filter((l) => l.type === "add").length;
    const dels = lines.filter((l) => l.type === "remove").length;
    return { diffLines: lines, additions: adds, deletions: dels };
  }, [file.oldContent, file.newContent]);

  const isEmpty = !file.oldContent && !file.newContent;

  // Derive file status from content presence
  const isNew = !file.oldContent && !!file.newContent;
  const isDeleted = !!file.oldContent && !file.newContent;

  const handleCopy = useCallback(() => {
    const content = file.newContent || file.oldContent || "";
    const onCopied = () => {
      setCopyLabel("✓ Copied");
      setTimeout(() => setCopyLabel("📋 Copy"), 2000);
    };
    navigator.clipboard.writeText(content).then(onCopied).catch(() => {
      // Fallback for environments without clipboard API
      const el = document.createElement("textarea");
      el.value = content;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      onCopied();
    });
  }, [file.newContent, file.oldContent]);

  return (
    <div
      style={{
        background: "#0f1120",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8,
        overflow: "hidden",
        fontFamily: "inherit",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "#0a0b14",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand diff" : "Collapse diff"}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#94a3b8",
              padding: 2,
              lineHeight: 1,
              fontSize: 12,
            }}
          >
            {collapsed ? "▶" : "▼"}
          </button>
          <span
            title={file.path}
            style={{
              color: "#f1f5f9",
              fontSize: 13,
              fontFamily: "monospace",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {file.path || "(untitled)"}
          </span>

          {/* Status badge */}
          <span
            style={{
              padding: "1px 6px",
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 700,
              background: isNew
                ? "rgba(16,185,129,0.2)"
                : isDeleted
                  ? "rgba(239,68,68,0.2)"
                  : "rgba(99,102,241,0.2)",
              color: isNew ? "#10b981" : isDeleted ? "#ef4444" : "#a5b4fc",
              whiteSpace: "nowrap",
            }}
          >
            {isNew ? "NEW" : isDeleted ? "DELETED" : "MODIFIED"}
          </span>

          {!isEmpty && (
            <span style={{ fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" }}>
              <span style={{ color: "#10b981" }}>+{additions}</span>
              {" "}
              <span style={{ color: "#ef4444" }}>-{deletions}</span>
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Keyboard shortcut hints */}
          <span style={{ fontSize: 10, color: "#475569", whiteSpace: "nowrap" }}>
            A to apply, U to undo
          </span>

          <button
            onClick={handleCopy}
            title="Copy file content"
            style={{
              padding: "5px 10px",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.05)",
              color: "#94a3b8",
              fontSize: 11,
              cursor: "pointer",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            {copyLabel}
          </button>

          {onUndo && (
            <button
              onClick={() => onUndo(file.path)}
              title="Undo (U)"
              style={{
                padding: "5px 12px",
                borderRadius: 6,
                border: "1px solid rgba(239,68,68,0.4)",
                background: "rgba(239,68,68,0.1)",
                color: "#ef4444",
                fontSize: 12,
                cursor: "pointer",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              ↩ Undo
            </button>
          )}
          {onApply && (
            <button
              onClick={() => onApply(file.path)}
              title="Apply (A)"
              style={{
                padding: "5px 12px",
                borderRadius: 6,
                border: "1px solid rgba(16,185,129,0.4)",
                background: "rgba(16,185,129,0.1)",
                color: "#10b981",
                fontSize: 12,
                cursor: "pointer",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              ✓ Apply
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div style={{ overflowX: "auto" }}>
          {isEmpty ? (
            <div
              style={{
                padding: "32px 16px",
                textAlign: "center",
                color: "#94a3b8",
                fontSize: 13,
              }}
            >
              No content to diff.
            </div>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
                fontFamily: "monospace",
              }}
            >
              <colgroup>
                <col style={{ width: 44 }} />
                <col style={{ width: 44 }} />
                <col style={{ width: 20 }} />
                <col />
              </colgroup>
              <tbody>
                {diffLines.map((line, idx) => {
                  const style = LINE_STYLES[line.type];
                  return (
                    <tr key={idx} style={{ background: style.bg }}>
                      <td
                        style={{
                          padding: "1px 8px",
                          color: "#4b5563",
                          textAlign: "right",
                          userSelect: "none",
                          borderRight: "1px solid rgba(255,255,255,0.04)",
                          minWidth: 36,
                        }}
                      >
                        {line.oldLineNum ?? ""}
                      </td>
                      <td
                        style={{
                          padding: "1px 8px",
                          color: "#4b5563",
                          textAlign: "right",
                          userSelect: "none",
                          borderRight: "1px solid rgba(255,255,255,0.04)",
                          minWidth: 36,
                        }}
                      >
                        {line.newLineNum ?? ""}
                      </td>
                      <td
                        style={{
                          padding: "1px 6px",
                          color: style.prefixColor,
                          textAlign: "center",
                          userSelect: "none",
                          fontWeight: 700,
                        }}
                      >
                        {style.prefix}
                      </td>
                      <td
                        style={{
                          padding: "1px 8px 1px 4px",
                          color: line.type === "context" ? "#94a3b8" : "#f1f5f9",
                          whiteSpace: "pre",
                        }}
                      >
                        {line.content}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default function DiffViewer({
  files,
  onApply,
  onUndo,
}: DiffViewerProps): React.JSX.Element {
  const [activeIndex, setActiveIndex] = useState(0);

  // Totals across all files
  const totalAdded = useMemo(
    () =>
      files.reduce((acc, f) => {
        const newLines = f.newContent ? f.newContent.split("\n") : [];
        const oldLines = f.oldContent ? f.oldContent.split("\n") : [];
        const diff = computeDiff(oldLines, newLines);
        return acc + diff.filter((l) => l.type === "add").length;
      }, 0),
    [files]
  );

  const totalRemoved = useMemo(
    () =>
      files.reduce((acc, f) => {
        const newLines = f.newContent ? f.newContent.split("\n") : [];
        const oldLines = f.oldContent ? f.oldContent.split("\n") : [];
        const diff = computeDiff(oldLines, newLines);
        return acc + diff.filter((l) => l.type === "remove").length;
      }, 0),
    [files]
  );

  if (files.length === 0) {
    return (
      <div
        style={{
          padding: "48px 16px",
          textAlign: "center",
          color: "#94a3b8",
          fontSize: 13,
          background: "#0f1120",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8,
        }}
      >
        No changes to display.
      </div>
    );
  }

  const safeIndex = Math.min(activeIndex, files.length - 1);
  const activeFile = files[safeIndex];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Summary bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "#0a0b14",
          flexShrink: 0,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 12, color: "#94a3b8" }}>
          <span style={{ color: "#10b981", fontWeight: 700 }}>+{totalAdded}</span>
          {" added  "}
          <span style={{ color: "#ef4444", fontWeight: 700 }}>-{totalRemoved}</span>
          {" removed"}
          {files.length > 1 && (
            <span style={{ color: "#6366f1" }}>{"  ·  "}{files.length} files</span>
          )}
        </span>
        <div style={{ flex: 1 }} />
        {onApply && (
          <button
            onClick={() => files.forEach((f) => onApply(f.path))}
            style={{
              padding: "4px 14px",
              borderRadius: 6,
              border: "1px solid rgba(16,185,129,0.4)",
              background: "rgba(16,185,129,0.1)",
              color: "#10b981",
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Apply All
          </button>
        )}
        {onUndo && (
          <button
            onClick={() => files.forEach((f) => onUndo(f.path))}
            style={{
              padding: "4px 14px",
              borderRadius: 6,
              border: "1px solid rgba(239,68,68,0.4)",
              background: "rgba(239,68,68,0.1)",
              color: "#ef4444",
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Undo All
          </button>
        )}
      </div>

      {/* File selector tabs */}
      {files.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: 4,
            padding: "6px 10px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            background: "#0f1120",
            overflowX: "auto",
            flexShrink: 0,
          }}
        >
          {files.map((f, i) => (
            <button
              key={f.path}
              onClick={() => setActiveIndex(i)}
              style={{
                padding: "4px 10px",
                borderRadius: 5,
                border: `1px solid ${safeIndex === i ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.08)"}`,
                background: safeIndex === i ? "rgba(99,102,241,0.15)" : "transparent",
                color: safeIndex === i ? "#6366f1" : "#94a3b8",
                cursor: "pointer",
                fontSize: 11,
                fontFamily: "monospace",
                whiteSpace: "nowrap",
                transition: "background 0.12s",
              }}
            >
              {f.path}
            </button>
          ))}
        </div>
      )}

      {/* Active file diff */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {activeFile && (
          <FileDiffPanel
            key={activeFile.path}
            file={activeFile}
            onApply={onApply}
            onUndo={onUndo}
          />
        )}
      </div>
    </div>
  );
}

