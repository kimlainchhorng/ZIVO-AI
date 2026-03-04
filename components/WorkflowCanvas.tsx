"use client";

import React, { useState, useCallback } from "react";
import type { WorkflowNode, WorkflowEdge, WorkflowRun } from "@/app/api/workflow/execute/route";

// ─── Types ─────────────────────────────────────────────────────────────────────

type NodeType = WorkflowNode["type"];

interface PaletteItem {
  type: NodeType;
  label: string;
  emoji: string;
  defaultConfig: Record<string, unknown>;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const PALETTE_ITEMS: PaletteItem[] = [
  { type: "http",      label: "HTTP Request", emoji: "🌐", defaultConfig: { url: "", method: "GET", headers: {}, body: "" } },
  { type: "ai",        label: "AI Prompt",    emoji: "🤖", defaultConfig: { prompt: "Describe yourself in one sentence." } },
  { type: "condition", label: "Condition",    emoji: "🔀", defaultConfig: { expression: "true" } },
  { type: "delay",     label: "Delay",        emoji: "⏱️", defaultConfig: { ms: 1000 } },
  { type: "db",        label: "Database",     emoji: "🗄️", defaultConfig: { query: "SELECT 1" } },
  { type: "auth",      label: "Auth",         emoji: "🔐", defaultConfig: { provider: "supabase" } },
  { type: "storage",   label: "Storage",      emoji: "📦", defaultConfig: { bucket: "default", key: "" } },
  { type: "email",     label: "Email",        emoji: "📧", defaultConfig: { to: "", subject: "", body: "" } },
  { type: "payments",  label: "Payments",     emoji: "💳", defaultConfig: { amount: 0, currency: "USD" } },
  { type: "code",      label: "Code",         emoji: "💻", defaultConfig: { script: "// your code here" } },
  { type: "loop",      label: "Loop",         emoji: "🔁", defaultConfig: { count: 3 } },
];

const THEME = {
  bg: "#0a0b14",
  surface: "#12131f",
  border: "#1e2035",
  accent: "#6366f1",
  accentHover: "#4f52d3",
  text: "#e2e4f0",
  muted: "#6b7280",
  success: "#22c55e",
  error: "#ef4444",
  warning: "#f59e0b",
  running: "#3b82f6",
};

// ─── Helper ────────────────────────────────────────────────────────────────────

function nodeStatusColor(status?: string): string {
  if (!status) return THEME.border;
  if (status === "success") return THEME.success;
  if (status === "error") return THEME.error;
  if (status === "running") return THEME.running;
  return THEME.border;
}

function newNode(type: NodeType, label: string, defaultConfig: Record<string, unknown>, index: number): WorkflowNode {
  return {
    id: `node_${Date.now()}_${index}`,
    type,
    label,
    config: { ...defaultConfig },
  };
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function PalettePanel({
  onAdd,
}: {
  onAdd: (item: PaletteItem) => void;
}): React.JSX.Element {
  return (
    <div
      style={{
        width: 200,
        flexShrink: 0,
        background: THEME.surface,
        borderRight: `1px solid ${THEME.border}`,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: 12,
        overflowY: "auto",
      }}
    >
      <p style={{ fontSize: 11, fontWeight: 700, color: THEME.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
        Node Palette
      </p>
      {PALETTE_ITEMS.map((item) => (
        <button
          key={item.type}
          onClick={() => onAdd(item)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 10px",
            borderRadius: 8,
            border: `1px solid ${THEME.border}`,
            background: "transparent",
            color: THEME.text,
            cursor: "pointer",
            fontSize: 13,
            textAlign: "left",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = THEME.border; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
        >
          <span style={{ fontSize: 16 }}>{item.emoji}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

function NodeCard({
  node,
  selected,
  statusColor,
  onSelect,
  onRemove,
}: {
  node: WorkflowNode;
  selected: boolean;
  statusColor: string;
  onSelect: () => void;
  onRemove: () => void;
}): React.JSX.Element {
  const palette = PALETTE_ITEMS.find((p) => p.type === node.type);
  return (
    <div
      onClick={onSelect}
      style={{
        position: "relative",
        padding: "10px 14px",
        borderRadius: 10,
        border: `2px solid ${selected ? THEME.accent : statusColor}`,
        background: THEME.surface,
        cursor: "pointer",
        userSelect: "none",
        minWidth: 150,
        flexShrink: 0,
        transition: "border-color 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 18 }}>{palette?.emoji ?? "⚙️"}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: THEME.text }}>{node.label}</span>
      </div>
      <span
        style={{
          fontSize: 11,
          color: THEME.muted,
          background: THEME.bg,
          borderRadius: 4,
          padding: "2px 6px",
        }}
      >
        {node.type}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        style={{
          position: "absolute",
          top: 6,
          right: 6,
          background: "transparent",
          border: "none",
          color: THEME.muted,
          cursor: "pointer",
          fontSize: 14,
          lineHeight: 1,
          padding: 2,
        }}
        title="Remove node"
      >
        ✕
      </button>
    </div>
  );
}

function ConfigPanel({
  node,
  onUpdate,
}: {
  node: WorkflowNode;
  onUpdate: (updated: WorkflowNode) => void;
}): React.JSX.Element {
  const handleLabelChange = (value: string) => onUpdate({ ...node, label: value });
  const handleConfigChange = (key: string, value: string) => {
    let parsed: unknown = value;
    try { parsed = JSON.parse(value); } catch { /* keep as string */ }
    onUpdate({ ...node, config: { ...node.config, [key]: parsed } });
  };

  return (
    <div
      style={{
        width: 240,
        flexShrink: 0,
        background: THEME.surface,
        borderLeft: `1px solid ${THEME.border}`,
        padding: 16,
        overflowY: "auto",
      }}
    >
      <p style={{ fontSize: 11, fontWeight: 700, color: THEME.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
        Node Config
      </p>
      <label style={{ display: "block", marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: THEME.muted, display: "block", marginBottom: 4 }}>Label</span>
        <input
          value={node.label}
          onChange={(e) => handleLabelChange(e.target.value)}
          style={inputStyle}
        />
      </label>
      {Object.entries(node.config).map(([key, val]) => (
        <label key={key} style={{ display: "block", marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: THEME.muted, display: "block", marginBottom: 4 }}>{key}</span>
          <textarea
            value={typeof val === "object" ? JSON.stringify(val, null, 2) : String(val ?? "")}
            onChange={(e) => handleConfigChange(key, e.target.value)}
            rows={key === "body" || key === "script" || key === "prompt" ? 4 : 2}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", fontSize: 12 }}
          />
        </label>
      ))}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: THEME.bg,
  border: `1px solid ${THEME.border}`,
  borderRadius: 6,
  color: THEME.text,
  padding: "6px 8px",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function WorkflowCanvas(): React.JSX.Element {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  // Edges are passed to the API for future flow-control support; edge creation UI is not yet implemented.
  const edges: WorkflowEdge[] = [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [run, setRun] = useState<WorkflowRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logsOpen, setLogsOpen] = useState(false);

  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null;

  const handleAddNode = useCallback((item: PaletteItem) => {
    setNodes((prev) => [...prev, newNode(item.type, item.label, item.defaultConfig, prev.length)]);
  }, []);

  const handleUpdateNode = useCallback((updated: WorkflowNode) => {
    setNodes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
  }, []);

  const handleRemoveNode = useCallback((id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));
  }, []);

  const handleRun = async () => {
    if (nodes.length === 0) {
      setError("Add at least one node before running.");
      return;
    }
    setError(null);
    setLoading(true);
    setRun(null);
    try {
      const res = await fetch("/api/workflow/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges }),
      });
      const data: WorkflowRun | { error: string } = await res.json();
      if (!res.ok) {
        setError((data as { error: string }).error ?? "Execution failed");
      } else {
        setRun(data as WorkflowRun);
        setLogsOpen(true);
      }
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setNodes([]);
    setSelectedId(null);
    setRun(null);
    setError(null);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: THEME.bg,
        color: THEME.text,
        fontFamily: "Inter, system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 16px",
          borderBottom: `1px solid ${THEME.border}`,
          background: THEME.surface,
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 15, color: THEME.text, marginRight: "auto" }}>
          ⚡ Workflow Builder
        </span>
        <button
          onClick={handleClear}
          disabled={loading}
          style={btnStyle(THEME.border, THEME.muted)}
        >
          🗑 Clear
        </button>
        <button
          onClick={handleRun}
          disabled={loading || nodes.length === 0}
          style={btnStyle(THEME.accent, THEME.text, loading || nodes.length === 0)}
        >
          {loading ? "⏳ Running…" : "▶ Run Workflow"}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div
          style={{
            padding: "8px 16px",
            background: "#2d0e0e",
            color: THEME.error,
            fontSize: 13,
            borderBottom: `1px solid ${THEME.error}33`,
            flexShrink: 0,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Main layout */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <PalettePanel onAdd={handleAddNode} />

        {/* Canvas */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: 24,
            gap: 16,
            overflowY: "auto",
            background: THEME.bg,
          }}
        >
          {nodes.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: THEME.muted,
                gap: 8,
                border: `2px dashed ${THEME.border}`,
                borderRadius: 16,
                minHeight: 200,
              }}
            >
              <span style={{ fontSize: 40 }}>⚡</span>
              <p style={{ fontSize: 15, fontWeight: 600 }}>No nodes yet</p>
              <p style={{ fontSize: 13 }}>Click a node type in the palette to add it</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {nodes.map((node) => {
                const result = run?.nodeResults?.[node.id];
                return (
                  <NodeCard
                    key={node.id}
                    node={node}
                    selected={selectedId === node.id}
                    statusColor={nodeStatusColor(result?.status)}
                    onSelect={() => setSelectedId(node.id)}
                    onRemove={() => handleRemoveNode(node.id)}
                  />
                );
              })}
            </div>
          )}

          {/* Run summary */}
          {run && (
            <div
              style={{
                background: THEME.surface,
                borderRadius: 10,
                border: `1px solid ${THEME.border}`,
                padding: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: 20,
                    background: run.status === "success" ? "#14532d" : run.status === "failed" ? "#7f1d1d" : "#1e3a5f",
                    color: run.status === "success" ? THEME.success : run.status === "failed" ? THEME.error : THEME.running,
                  }}
                >
                  {run.status.toUpperCase()}
                </span>
                <span style={{ fontSize: 12, color: THEME.muted }}>Run ID: {run.id}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.entries(run.nodeResults).map(([nodeId, result]) => {
                  const node = nodes.find((n) => n.id === nodeId);
                  return (
                    <div
                      key={nodeId}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: THEME.bg,
                        border: `1px solid ${nodeStatusColor(result.status)}44`,
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: nodeStatusColor(result.status),
                          flexShrink: 0,
                          marginTop: 4,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: THEME.text }}>
                            {node?.label ?? nodeId}
                          </span>
                          <span style={{ fontSize: 11, color: THEME.muted }}>{result.durationMs}ms</span>
                        </div>
                        {result.error && (
                          <p style={{ fontSize: 12, color: THEME.error, marginBottom: 4 }}>{result.error}</p>
                        )}
                        <pre
                          style={{
                            fontSize: 11,
                            color: THEME.muted,
                            background: THEME.border,
                            borderRadius: 4,
                            padding: "4px 8px",
                            overflow: "auto",
                            maxHeight: 80,
                            margin: 0,
                          }}
                        >
                          {JSON.stringify(result.output, null, 2)}
                        </pre>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Config panel */}
        {selectedNode && (
          <ConfigPanel node={selectedNode} onUpdate={handleUpdateNode} />
        )}
      </div>

      {/* Logs panel */}
      {run && (
        <div
          style={{
            flexShrink: 0,
            background: THEME.surface,
            borderTop: `1px solid ${THEME.border}`,
            maxHeight: logsOpen ? 200 : 36,
            overflow: "hidden",
            transition: "max-height 0.2s",
          }}
        >
          <button
            onClick={() => setLogsOpen((o) => !o)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              background: "transparent",
              border: "none",
              color: THEME.muted,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              textAlign: "left",
            }}
          >
            <span>{logsOpen ? "▾" : "▸"}</span>
            <span>Run Logs ({run.logs.length})</span>
          </button>
          {logsOpen && (
            <div
              style={{
                overflowY: "auto",
                maxHeight: 164,
                padding: "0 16px 12px",
                fontFamily: "monospace",
                fontSize: 11,
                color: THEME.muted,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {run.logs.map((log, i) => (
                <p key={i} style={{ margin: 0 }}>{log}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Style helpers ─────────────────────────────────────────────────────────────

function btnStyle(
  bg: string,
  color: string,
  disabled = false
): React.CSSProperties {
  return {
    padding: "7px 16px",
    borderRadius: 8,
    border: "none",
    background: disabled ? "#2a2b3d" : bg,
    color: disabled ? THEME.muted : color,
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 13,
    fontWeight: 600,
    transition: "opacity 0.15s",
    opacity: disabled ? 0.6 : 1,
  };
}
