"use client";

import React, { useMemo, useState } from "react";

interface DiffViewerProps {
  oldContent: string;
  newContent: string;
  filePath: string;
  onAccept?: () => void;
  onReject?: () => void;
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

export default function DiffViewer({
  oldContent,
  newContent,
  filePath,
  onAccept,
  onReject,
}: DiffViewerProps): React.JSX.Element {
  const [collapsed, setCollapsed] = useState(false);

  const { diffLines, additions, deletions } = useMemo(() => {
    if (!oldContent && !newContent) {
      return { diffLines: [], additions: 0, deletions: 0 };
    }
    const oldLines = oldContent ? oldContent.split("\n") : [];
    const newLines = newContent ? newContent.split("\n") : [];
    const lines = computeDiff(oldLines, newLines);
    const adds = lines.filter((l) => l.type === "add").length;
    const dels = lines.filter((l) => l.type === "remove").length;
    return { diffLines: lines, additions: adds, deletions: dels };
  }, [oldContent, newContent]);

  const isEmpty = !oldContent && !newContent;

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
            title={filePath}
            style={{
              color: "#f1f5f9",
              fontSize: 13,
              fontFamily: "monospace",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {filePath || "(untitled)"}
          </span>
          {!isEmpty && (
            <span style={{ fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" }}>
              <span style={{ color: "#10b981" }}>+{additions}</span>
              {" / "}
              <span style={{ color: "#ef4444" }}>-{deletions}</span>
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {onReject && (
            <button
              onClick={onReject}
              style={{
                padding: "5px 14px",
                borderRadius: 6,
                border: "1px solid rgba(239,68,68,0.4)",
                background: "rgba(239,68,68,0.1)",
                color: "#ef4444",
                fontSize: 12,
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Reject
            </button>
          )}
          {onAccept && (
            <button
              onClick={onAccept}
              style={{
                padding: "5px 14px",
                borderRadius: 6,
                border: "1px solid rgba(16,185,129,0.4)",
                background: "rgba(16,185,129,0.1)",
                color: "#10b981",
                fontSize: 12,
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Accept
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
