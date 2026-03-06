"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const COLORS = {
  bg: "#0a0b14",
  bgPanel: "#0f1120",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#475569",
};

export interface GeneratedFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

type AgentStatus = "idle" | "thinking" | "working" | "done" | "error";

interface AgentState {
  name: string;
  emoji: string;
  status: AgentStatus;
  task: string;
}

interface SSEPayload {
  agent: string;
  status: AgentStatus;
  message: string;
  files?: GeneratedFile[];
}

interface Props {
  projectFiles: GeneratedFile[];
  onFilesUpdated: (files: GeneratedFile[]) => void;
}

const INITIAL_AGENTS: AgentState[] = [
  { name: "Architect", emoji: "🏗️", status: "idle", task: "Waiting..." },
  { name: "Frontend",  emoji: "🎨", status: "idle", task: "Waiting..." },
  { name: "Backend",   emoji: "⚙️",  status: "idle", task: "Waiting..." },
  { name: "Database",  emoji: "🗄️",  status: "idle", task: "Waiting..." },
  { name: "Debug",     emoji: "🐛", status: "idle", task: "Waiting..." },
];

const STATUS_COLOR: Record<AgentStatus, string> = {
  idle:     COLORS.textMuted,
  thinking: COLORS.warning,
  working:  COLORS.accent,
  done:     COLORS.success,
  error:    COLORS.error,
};

export default function AgentOrchestrator({ projectFiles, onFilesUpdated }: Props) {
  const [agents, setAgents] = useState<AgentState[]>(INITIAL_AGENTS);
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const appendLog = (msg: string) => {
    setLog((prev) => [...prev.slice(-49), msg]);
    requestAnimationFrame(() => {
      if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    });
  };

  const updateAgent = (name: string, patch: Partial<AgentState>) =>
    setAgents((prev) => prev.map((a) => (a.name === name ? { ...a, ...patch } : a)));

  const coordinate = async () => {
    setRunning(true);
    setAgents(INITIAL_AGENTS);
    setLog([]);

    const res = await fetch("/api/agents/coordinate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files: projectFiles, task: "Analyze and improve the project" }),
    });

    if (!res.ok || !res.body) {
      setRunning(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const payload = JSON.parse(line.slice(6)) as SSEPayload;
          appendLog(`[${payload.agent}] ${payload.message}`);
          if (payload.agent !== "Coordinator") {
            updateAgent(payload.agent, { status: payload.status, task: payload.message });
          }
          if (payload.files) onFilesUpdated(payload.files);
        } catch (err) {
          console.warn("[AgentOrchestrator] Malformed SSE line:", line, err);
        }
      }
    }

    setRunning(false);
  };

  return (
    <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20, fontFamily: "inherit" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ color: COLORS.textPrimary, margin: 0, fontSize: 16, fontWeight: 600 }}>Agent Orchestrator</h2>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={coordinate}
          disabled={running}
          style={{
            background: running ? COLORS.textMuted : COLORS.accentGradient,
            border: "none", borderRadius: 8, padding: "8px 16px",
            color: "#fff", cursor: running ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600,
          }}
        >
          {running ? "Running…" : "Coordinate All Agents"}
        </motion.button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 16 }}>
        {agents.map((agent) => (
          <AnimatePresence key={agent.name}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: COLORS.bgCard,
                border: `1px solid ${agent.status === "idle" ? COLORS.border : STATUS_COLOR[agent.status]}44`,
                borderRadius: 10, padding: "12px 8px", textAlign: "center",
              }}
            >
              <div style={{ fontSize: 22 }}>{agent.emoji}</div>
              <div style={{ color: COLORS.textPrimary, fontSize: 12, fontWeight: 600, marginTop: 4 }}>{agent.name}</div>
              <motion.div
                animate={{ opacity: agent.status === "thinking" || agent.status === "working" ? [1, 0.4, 1] : 1 }}
                transition={{ repeat: Infinity, duration: 1 }}
                style={{ color: STATUS_COLOR[agent.status], fontSize: 10, marginTop: 2, fontWeight: 500 }}
              >
                {agent.status}
              </motion.div>
              <div style={{ color: COLORS.textMuted, fontSize: 10, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={agent.task}>
                {agent.task}
              </div>
            </motion.div>
          </AnimatePresence>
        ))}
      </div>

      <div ref={logRef} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 10, height: 120, overflowY: "auto" }}>
        {log.length === 0
          ? <span style={{ color: COLORS.textMuted, fontSize: 12 }}>No activity yet.</span>
          : log.map((entry, i) => (
            <div key={i} style={{ color: COLORS.textSecondary, fontSize: 11, lineHeight: 1.6 }}>{entry}</div>
          ))
        }
      </div>
    </div>
  );
}
