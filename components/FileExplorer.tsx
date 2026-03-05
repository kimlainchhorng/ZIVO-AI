"use client";

import React, { useState, useMemo } from "react";

export interface ExplorerFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

interface FileExplorerProps {
  files: ExplorerFile[];
  activeFilePath: string | null;
  onFileSelect: (file: ExplorerFile) => void;
  changedPaths?: Set<string>;
  onAddFile?: () => void;
}

const COLORS = {
  bg: "#0a0b14",
  bgPanel: "#0f1120",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  accent: "#6366f1",
  success: "#10b981",
  error: "#ef4444",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#475569",
};

function getFileIcon(path: string): React.ReactElement {
  const ext = path.split(".").pop()?.toLowerCase();
  const s: React.CSSProperties = { display: "inline-block", flexShrink: 0 };
  if (ext === "css" || ext === "scss")
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}>
        <path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" />
        <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1 1.02 2.34 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z" />
      </svg>
    );
  if (ext === "json")
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}>
        <path d="m7.5 4.27 9 5.15" />
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
      </svg>
    );
  if (ext === "tsx" || ext === "jsx")
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#61dafb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}>
        <circle cx="12" cy="12" r="2" />
        <ellipse cx="12" cy="12" rx="10" ry="4.5" />
        <ellipse cx="12" cy="12" rx="10" ry="4.5" style={{ transform: "rotate(60deg)", transformOrigin: "12px 12px" }} />
        <ellipse cx="12" cy="12" rx="10" ry="4.5" style={{ transform: "rotate(120deg)", transformOrigin: "12px 12px" }} />
      </svg>
    );
  if (ext === "ts")
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3178c6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}>
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M7 8h4" />
        <path d="M9 8v8" />
        <path d="M13 16c.27.39.7.65 1.2.65A1.8 1.8 0 0 0 16 15v-3h-2" />
      </svg>
    );
  if (ext === "md")
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={COLORS.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}>
        <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
        <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
        <path d="M7 3v4a1 1 0 0 0 1 1h7" />
      </svg>
    );
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={COLORS.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </svg>
  );
}

function ActionBadge({ action }: { action: ExplorerFile["action"] }): React.ReactElement {
  const styles: Record<ExplorerFile["action"], { color: string; label: string }> = {
    create: { color: COLORS.success, label: "+" },
    update: { color: COLORS.accent, label: "~" },
    delete: { color: COLORS.error, label: "-" },
  };
  const { color, label } = styles[action];
  return (
    <span
      style={{
        fontSize: "0.65rem",
        fontWeight: 700,
        color,
        flexShrink: 0,
        lineHeight: 1,
      }}
      title={action}
      aria-label={action}
    >
      {label}
    </span>
  );
}

interface FolderNode {
  name: string;
  fullPath: string;
  children: FolderNode[];
  files: ExplorerFile[];
}

function buildTree(files: ExplorerFile[]): FolderNode {
  const root: FolderNode = { name: "", fullPath: "", children: [], files: [] };

  for (const file of files) {
    const parts = file.path.split("/");
    let node = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      let child = node.children.find((c) => c.name === part);
      if (!child) {
        child = {
          name: part,
          fullPath: parts.slice(0, i + 1).join("/"),
          children: [],
          files: [],
        };
        node.children.push(child);
      }
      node = child;
    }
    node.files.push(file);
  }

  return root;
}

interface TreeNodeProps {
  node: FolderNode;
  depth: number;
  activeFilePath: string | null;
  onFileSelect: (file: ExplorerFile) => void;
  changedPaths?: Set<string>;
}

function TreeNode({ node, depth, activeFilePath, onFileSelect, changedPaths }: TreeNodeProps): React.ReactElement {
  const [open, setOpen] = useState(true);
  const indent = depth * 12;

  return (
    <div>
      {node.name && (
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            width: "100%",
            background: "none",
            border: "none",
            padding: `0.25rem 0.5rem 0.25rem ${indent + 4}px`,
            cursor: "pointer",
            color: COLORS.textMuted,
            fontSize: "0.75rem",
            fontFamily: "monospace",
            textAlign: "left",
          }}
        >
          <span style={{ fontSize: "0.55rem", lineHeight: 1, flexShrink: 0 }}>
            {open ? "▼" : "▶"}
          </span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COLORS.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {node.name}
          </span>
        </button>
      )}

      {open && (
        <>
          {node.files.map((file) => {
            const filename = file.path.split("/").pop() ?? file.path;
            const isActive = file.path === activeFilePath;
            const isChanged = changedPaths?.has(file.path) ?? false;
            return (
              <button
                key={file.path}
                onClick={() => onFileSelect(file)}
                title={file.path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  width: "100%",
                  background: isActive ? "rgba(99,102,241,0.12)" : "none",
                  border: isActive ? "1px solid rgba(99,102,241,0.25)" : "1px solid transparent",
                  borderRadius: "5px",
                  padding: `0.3rem 0.5rem 0.3rem ${indent + (node.name ? 20 : 4)}px`,
                  cursor: "pointer",
                  color: isActive ? COLORS.textPrimary : COLORS.textSecondary,
                  fontSize: "0.8125rem",
                  fontFamily: "monospace",
                  textAlign: "left",
                  transition: "background 0.12s",
                }}
                className="zivo-file"
              >
                <span style={{ flexShrink: 0, lineHeight: 0 }}>{getFileIcon(file.path)}</span>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {filename}
                </span>
                {isChanged && (
                  <span
                    title="Recently changed"
                    style={{ fontSize: "0.6rem", color: COLORS.success, flexShrink: 0, lineHeight: 1 }}
                  >
                    ●
                  </span>
                )}
                <span style={{ fontSize: "0.6rem", color: COLORS.textMuted, flexShrink: 0, fontFamily: "monospace" }}>
                  {file.content.length < 1024
                    ? `${file.content.length}B`
                    : `${(file.content.length / 1024).toFixed(1)}KB`}
                </span>
                <ActionBadge action={file.action} />
              </button>
            );
          })}

          {node.children.map((child) => (
            <TreeNode
              key={child.fullPath}
              node={child}
              depth={depth + 1}
              activeFilePath={activeFilePath}
              onFileSelect={onFileSelect}
              changedPaths={changedPaths}
            />
          ))}
        </>
      )}
    </div>
  );
}

export default function FileExplorer({
  files,
  activeFilePath,
  onFileSelect,
  changedPaths,
  onAddFile,
}: FileExplorerProps): React.JSX.Element {
  const [search, setSearch] = useState("");
  const tree = useMemo(() => {
    const filtered = search.trim()
      ? files.filter((f) => f.path.toLowerCase().includes(search.toLowerCase()))
      : files;
    return buildTree(filtered);
  }, [files, search]);

  const totalSize = files.reduce((acc, f) => acc + f.content.length, 0);
  const creates = files.filter((f) => f.action === "create").length;
  const updates = files.filter((f) => f.action === "update").length;
  const deletes = files.filter((f) => f.action === "delete").length;

  if (files.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "3rem 1rem",
          color: COLORS.textMuted,
          textAlign: "center",
          gap: "0.75rem",
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", margin: "0 auto" }}>
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        <span style={{ fontSize: "0.8125rem" }}>Build a project to see files here.</span>
        {onAddFile && (
          <button
            onClick={onAddFile}
            style={{
              padding: "0.4rem 1rem",
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: 6,
              color: COLORS.accent,
              fontSize: "0.8rem",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            + Add File
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Stats header */}
      <div
        style={{
          padding: "0.5rem 0.75rem",
          borderBottom: `1px solid ${COLORS.border}`,
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          flexWrap: "wrap",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: "0.7rem", color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {files.length} files · {Math.round(totalSize / 1024)}KB
        </span>
        <div style={{ flex: 1 }} />
        {creates > 0 && (
          <span style={{ fontSize: "0.65rem", color: COLORS.success, fontWeight: 700 }}>+{creates}</span>
        )}
        {updates > 0 && (
          <span style={{ fontSize: "0.65rem", color: COLORS.accent, fontWeight: 700 }}>~{updates}</span>
        )}
        {deletes > 0 && (
          <span style={{ fontSize: "0.65rem", color: COLORS.error, fontWeight: 700 }}>-{deletes}</span>
        )}
        {onAddFile && (
          <button
            onClick={onAddFile}
            title="Add new file"
            style={{
              padding: "0.15rem 0.5rem",
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.25)",
              borderRadius: 5,
              color: COLORS.accent,
              fontSize: "0.7rem",
              cursor: "pointer",
              fontWeight: 700,
              lineHeight: 1.4,
            }}
          >
            + Add
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{ padding: "0.4rem 0.75rem", borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter files…"
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 5,
            padding: "0.25rem 0.5rem",
            color: COLORS.textSecondary,
            fontSize: "0.75rem",
            fontFamily: "monospace",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Tree */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0.25rem 0" }}>
        <TreeNode
          node={tree}
          depth={0}
          activeFilePath={activeFilePath}
          onFileSelect={onFileSelect}
          changedPaths={changedPaths}
        />
        {search.trim() && tree.files.length === 0 && tree.children.length === 0 && (
          <div style={{ padding: "1rem", textAlign: "center", color: COLORS.textMuted, fontSize: "0.75rem" }}>
            No files match &ldquo;{search}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}
