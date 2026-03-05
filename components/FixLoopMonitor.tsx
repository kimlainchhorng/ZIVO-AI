"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GeneratedFile } from "@/lib/build-runner";

const COLORS = {
  bgPanel: "#0f1120",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  accent: "#6366f1",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#475569",
  success: "#10b981",
  error: "#ef4444",
  warning: "#f59e0b",
};

type SSEEventType = "progress" | "fixed" | "done" | "error";

interface SSEEvent {
  type: SSEEventType;
  message: string;
  files?: { path: string; content: string }[];
  iteration?: number;
  errors?: { message: string; file?: string }[];
  success?: boolean;
  finalErrors?: { message: string; file?: string }[];
}

interface FixStep {
  id: string;
  label: string;
  status: "pending" | "running" | "done" | "error";
  detail?: string;
}

interface FixLoopMonitorProps {
  files: GeneratedFile[];
  maxRetries?: number;
  onComplete: (files: GeneratedFile[]) => void;
  onError: (err: string) => void;
}

const INITIAL_STEPS: Omit<FixStep, "status">[] = [
  { id: "run", label: "Running build checks…" },
  { id: "analyze", label: "AI analyzing errors…" },
  { id: "fix", label: "Applying fixes…" },
  { id: "rebuild", label: "Rebuilding…" },
];

export default function FixLoopMonitor({ files, maxRetries = 3, onComplete, onError }: FixLoopMonitorProps) {
  const [steps, setSteps] = useState<FixStep[]>(
    INITIAL_STEPS.map((s) => ({ ...s, status: "pending" }))
  );
  const [iteration, setIteration] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [stopped, setStopped] = useState(false);
  const [done, setDone] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    if (stopped || done) return;

    const abortController = new AbortController();
    abortRef.current = abortController;

    const runStream = async () => {
      setSteps(INITIAL_STEPS.map((s, i) => ({ ...s, status: i === 0 ? "running" : "pending" })));

      try {
        const response = await fetch("/api/fix-loop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ files, maxRetries }),
          signal: abortController.signal,
        });

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { value, done: streamDone } = await reader.read();
          if (streamDone) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split("\n\n").filter((l) => l.startsWith("data: "));

          for (const line of lines) {
            const jsonStr = line.replace("data: ", "");
            try {
              const event = JSON.parse(jsonStr) as SSEEvent;
              handleEvent(event);
            } catch (parseErr: unknown) {
              console.warn("[fix-loop] Malformed SSE event:", jsonStr, parseErr);
            }
          }
        }
      } catch (err: unknown) {
        if ((err as Error).name === "AbortError") return;
        onError((err as Error)?.message ?? "Fix loop failed");
      }
    };

    const handleEvent = (event: SSEEvent) => {
      setLogs((prev) => [...prev, `[${event.type.toUpperCase()}] ${event.message}`]);

      if (event.type === "progress") {
        setIteration(event.iteration ?? 0);
        setSteps((prev) =>
          prev.map((s, i) => ({
            ...s,
            status: i === 0 ? "done" : i === 1 ? "running" : "pending",
            detail: i === 1 ? `${event.errors?.length ?? 0} error(s) found` : s.detail,
          }))
        );
      }

      if (event.type === "fixed") {
        setSteps((prev) =>
          prev.map((s) => ({ ...s, status: "done" }))
        );
      }

      if (event.type === "done") {
        setDone(true);
        setSteps((prev) =>
          prev.map((s) => ({ ...s, status: event.success ? "done" : "error" }))
        );
        if (event.files) {
          onComplete(event.files as GeneratedFile[]);
        }
      }

      if (event.type === "error") {
        setSteps((prev) =>
          prev.map((s) => (s.status === "running" ? { ...s, status: "error", detail: event.message } : s))
        );
        onError(event.message);
      }
    };

    void runStream();

    return () => {
      abortController.abort();
    };
  }, [files, maxRetries, stopped, done, onComplete, onError]);

  const handleStop = () => {
    setStopped(true);
    abortRef.current?.abort();
    setSteps((prev) => prev.map((s) => (s.status === "running" ? { ...s, status: "error", detail: "Stopped by user" } : s)));
  };

  const stepIconMap: Record<FixStep["status"], string> = {
    pending: "○",
    running: "⟳",
    done: "✓",
    error: "✗",
  };

  const stepColorMap: Record<FixStep["status"], string> = {
    pending: COLORS.textMuted,
    running: COLORS.accent,
    done: COLORS.success,
    error: COLORS.error,
  };

  return (
    <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: "12px", padding: "1.25rem", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: COLORS.textPrimary, margin: "0 0 0.125rem" }}>
            🔧 AI Fix Loop
          </h3>
          <p style={{ fontSize: "0.75rem", color: COLORS.textMuted, margin: 0 }}>
            Iteration {iteration} / {maxRetries}
          </p>
        </div>
        {!done && !stopped && (
          <button
            onClick={handleStop}
            style={{ padding: "0.375rem 0.875rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", color: COLORS.error, cursor: "pointer", fontSize: "0.8125rem", fontWeight: 500 }}
          >
            ⏹ Stop
          </button>
        )}
      </div>

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "1rem" }}>
        <AnimatePresence>
          {steps.map((step) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.375rem 0" }}
            >
              <span style={{ color: stepColorMap[step.status], fontSize: "0.875rem", fontWeight: 700, minWidth: "16px" }}>
                {stepIconMap[step.status]}
              </span>
              <span style={{ fontSize: "0.8125rem", color: step.status === "pending" ? COLORS.textMuted : COLORS.textPrimary, flex: 1 }}>
                {step.label}
              </span>
              {step.detail && (
                <span style={{ fontSize: "0.6875rem", color: step.status === "error" ? COLORS.error : COLORS.textMuted }}>
                  {step.detail}
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Logs */}
      <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "6px", padding: "0.625rem", maxHeight: "120px", overflowY: "auto", fontFamily: "monospace", fontSize: "0.6875rem", color: COLORS.textSecondary }}>
        {logs.length === 0 ? (
          <span style={{ color: COLORS.textMuted }}>Starting…</span>
        ) : (
          logs.map((log, i) => (
            <div key={i} style={{ marginBottom: "2px" }}>{log}</div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}
