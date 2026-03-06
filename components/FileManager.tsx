'use client';

import { useCallback, useState } from "react";
import JSZip from "jszip";

export interface ManagedFile {
  path: string;
  content: string;
  action?: "create" | "update" | "delete";
  language?: string;
}

interface FileManagerProps {
  files: ManagedFile[];
  onFileChange?: (file: ManagedFile) => void;
  onFileDelete?: (path: string) => void;
  onFileAdd?: (file: ManagedFile) => void;
}

function _getLanguageFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const languageMap: Record<string, string> = {
    ts: "typescript",
    tsx: "tsx",
    js: "javascript",
    jsx: "jsx",
    css: "css",
    json: "json",
    md: "markdown",
    sql: "sql",
    py: "python",
    sh: "bash",
    yaml: "yaml",
    yml: "yaml",
    dockerfile: "dockerfile",
    go: "go",
    rs: "rust",
    html: "html",
    xml: "xml",
  };
  return languageMap[ext] ?? "text";
}

function _buildFileTree(files: ManagedFile[]): Record<string, ManagedFile[]> {
  const tree: Record<string, ManagedFile[]> = { "/": [] };
  for (const file of files) {
    const parts = file.path.split("/");
    if (parts.length === 1) {
      tree["/"].push(file);
    } else {
      const dir = parts.slice(0, -1).join("/");
      if (!tree[dir]) tree[dir] = [];
      tree[dir].push(file);
    }
  }
  return tree;
}

function FileIcon({ path }: { path: string }) {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const icons: Record<string, string> = {
    ts: "🔷",
    tsx: "⚛️",
    js: "🟨",
    jsx: "⚛️",
    css: "🎨",
    json: "📋",
    md: "📝",
    sql: "🗄️",
    py: "🐍",
    sh: "⚙️",
    yaml: "📄",
    yml: "📄",
    dockerfile: "🐳",
    go: "🔵",
    rs: "🦀",
    html: "🌐",
  };
  return <span style={{ marginRight: 6, fontSize: 13 }}>{icons[ext] ?? "📄"}</span>;
}

export default function FileManager({
  files,
  onFileChange,
  onFileDelete,
  onFileAdd,
}: FileManagerProps) {
  const [selectedFile, setSelectedFile] = useState<ManagedFile | null>(null);
  const [editContent, setEditContent] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(["app", "components", "lib"]));
  const [copySuccess, setCopySuccess] = useState(false);

  const tree = _buildFileTree(files);

  const _selectFile = useCallback((file: ManagedFile) => {
    setSelectedFile(file);
    setEditContent(file.content);
    setIsEditing(false);
  }, []);

  const _handleSave = useCallback(() => {
    if (selectedFile && onFileChange) {
      const updated: ManagedFile = { ...selectedFile, content: editContent, action: "update" };
      onFileChange(updated);
      setSelectedFile(updated);
    }
    setIsEditing(false);
  }, [selectedFile, editContent, onFileChange]);

  const _handleDelete = useCallback(
    (path: string) => {
      if (onFileDelete) {
        onFileDelete(path);
        if (selectedFile?.path === path) {
          setSelectedFile(null);
          setEditContent("");
        }
      }
    },
    [onFileDelete, selectedFile]
  );

  const _handleAddFile = useCallback(() => {
    if (!newFileName.trim()) return;
    const newFile: ManagedFile = {
      path: newFileName.trim(),
      content: "",
      action: "create",
      language: _getLanguageFromPath(newFileName.trim()),
    };
    if (onFileAdd) onFileAdd(newFile);
    setNewFileName("");
    setShowNewFileInput(false);
    setSelectedFile(newFile);
    setEditContent("");
    setIsEditing(true);
  }, [newFileName, onFileAdd]);

  const _handleDownloadZip = useCallback(async () => {
    const zip = new JSZip();
    for (const file of files) {
      if (file.action !== "delete") {
        zip.file(file.path, file.content);
      }
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "project.zip";
    a.click();
    URL.revokeObjectURL(url);
  }, [files]);

  const _handleCopyContent = useCallback(() => {
    if (selectedFile) {
      navigator.clipboard.writeText(selectedFile.content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  }, [selectedFile]);

  const _toggleDir = useCallback((dir: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(dir)) {
        next.delete(dir);
      } else {
        next.add(dir);
      }
      return next;
    });
  }, []);

  const sortedDirs = Object.keys(tree).sort((a, b) => {
    if (a === "/") return -1;
    if (b === "/") return 1;
    return a.localeCompare(b);
  });

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        minHeight: 500,
        background: "#0f1120",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        overflow: "hidden",
        fontFamily: "monospace",
      }}
    >
      {/* File Tree Sidebar */}
      <div
        style={{
          width: 240,
          minWidth: 200,
          borderRight: "1px solid rgba(255,255,255,0.08)",
          overflowY: "auto",
          background: "#0a0b14",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Sidebar Header */}
        <div
          style={{
            padding: "12px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Files ({files.length})
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setShowNewFileInput((v) => !v)}
              title="New file"
              style={{
                background: "none",
                border: "none",
                color: "#6366f1",
                cursor: "pointer",
                fontSize: 16,
                padding: "0 2px",
                lineHeight: 1,
              }}
            >
              +
            </button>
            <button
              onClick={_handleDownloadZip}
              title="Download as ZIP"
              style={{
                background: "none",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                fontSize: 13,
                padding: "0 2px",
                lineHeight: 1,
              }}
            >
              ↓
            </button>
          </div>
        </div>

        {/* New File Input */}
        {showNewFileInput && (
          <div style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <input
              autoFocus
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") _handleAddFile();
                if (e.key === "Escape") setShowNewFileInput(false);
              }}
              placeholder="path/file.ts"
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(99,102,241,0.5)",
                borderRadius: 4,
                color: "#f1f5f9",
                fontSize: 12,
                padding: "4px 8px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        )}

        {/* Tree */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {sortedDirs.map((dir) => {
            const dirFiles = tree[dir];
            const isRoot = dir === "/";
            const isExpanded = isRoot || expandedDirs.has(dir);

            return (
              <div key={dir}>
                {!isRoot && (
                  <button
                    onClick={() => _toggleDir(dir)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                      padding: "3px 14px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#94a3b8",
                      fontSize: 12,
                      textAlign: "left",
                    }}
                  >
                    <span style={{ marginRight: 6, fontSize: 10 }}>{isExpanded ? "▼" : "▶"}</span>
                    <span style={{ marginRight: 6 }}>📁</span>
                    {dir.split("/").pop()}
                  </button>
                )}
                {isExpanded &&
                  dirFiles.map((file) => {
                    const fileName = file.path.split("/").pop() ?? file.path;
                    const isActive = selectedFile?.path === file.path;
                    return (
                      <div
                        key={file.path}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: `3px 14px 3px ${isRoot ? 14 : 28}px`,
                          cursor: "pointer",
                          background: isActive ? "rgba(99,102,241,0.12)" : "transparent",
                          borderLeft: isActive ? "2px solid #6366f1" : "2px solid transparent",
                          transition: "background 0.1s",
                        }}
                        onClick={() => _selectFile(file)}
                      >
                        <FileIcon path={file.path} />
                        <span
                          style={{
                            color: isActive ? "#f1f5f9" : "#94a3b8",
                            fontSize: 12,
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {fileName}
                        </span>
                        {onFileDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              _handleDelete(file.path);
                            }}
                            title="Delete file"
                            style={{
                              background: "none",
                              border: "none",
                              color: "#475569",
                              cursor: "pointer",
                              fontSize: 11,
                              padding: "0 2px",
                              opacity: 0,
                              lineHeight: 1,
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0"; (e.currentTarget as HTMLButtonElement).style.color = "#475569"; }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Editor Panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {selectedFile ? (
          <>
            {/* Editor Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                background: "#0a0b14",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FileIcon path={selectedFile.path} />
                <span style={{ color: "#f1f5f9", fontSize: 13, fontWeight: 500 }}>
                  {selectedFile.path}
                </span>
                {selectedFile.action && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background:
                        selectedFile.action === "create"
                          ? "rgba(16,185,129,0.15)"
                          : selectedFile.action === "delete"
                          ? "rgba(239,68,68,0.15)"
                          : "rgba(245,158,11,0.15)",
                      color:
                        selectedFile.action === "create"
                          ? "#10b981"
                          : selectedFile.action === "delete"
                          ? "#ef4444"
                          : "#f59e0b",
                    }}
                  >
                    {selectedFile.action}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={_handleCopyContent}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 6,
                    color: copySuccess ? "#10b981" : "#94a3b8",
                    cursor: "pointer",
                    fontSize: 12,
                    padding: "4px 10px",
                  }}
                >
                  {copySuccess ? "Copied!" : "Copy"}
                </button>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    style={{
                      background: "rgba(99,102,241,0.1)",
                      border: "1px solid rgba(99,102,241,0.3)",
                      borderRadius: 6,
                      color: "#6366f1",
                      cursor: "pointer",
                      fontSize: 12,
                      padding: "4px 10px",
                    }}
                  >
                    Edit
                  </button>
                ) : (
                  <>
                    <button
                      onClick={_handleSave}
                      style={{
                        background: "rgba(16,185,129,0.1)",
                        border: "1px solid rgba(16,185,129,0.3)",
                        borderRadius: 6,
                        color: "#10b981",
                        cursor: "pointer",
                        fontSize: 12,
                        padding: "4px 10px",
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditContent(selectedFile.content);
                      }}
                      style={{
                        background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.3)",
                        borderRadius: 6,
                        color: "#ef4444",
                        cursor: "pointer",
                        fontSize: 12,
                        padding: "4px 10px",
                      }}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* File Content */}
            {isEditing ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                style={{
                  flex: 1,
                  background: "#0f1120",
                  border: "none",
                  color: "#e2e8f0",
                  fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                  fontSize: 13,
                  lineHeight: 1.6,
                  outline: "none",
                  padding: 20,
                  resize: "none",
                  width: "100%",
                  boxSizing: "border-box",
                  tabSize: 2,
                }}
                spellCheck={false}
              />
            ) : (
              <pre
                style={{
                  flex: 1,
                  background: "#0f1120",
                  color: "#e2e8f0",
                  fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                  fontSize: 13,
                  lineHeight: 1.6,
                  margin: 0,
                  overflow: "auto",
                  padding: 20,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                }}
              >
                {selectedFile.content || <span style={{ color: "#475569", fontStyle: "italic" }}>Empty file</span>}
              </pre>
            )}
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#475569",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 40 }}>📁</span>
            <p style={{ margin: 0, fontSize: 14 }}>Select a file to view or edit</p>
            <p style={{ margin: 0, fontSize: 12 }}>
              {files.length} file{files.length !== 1 ? "s" : ""} in project
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
