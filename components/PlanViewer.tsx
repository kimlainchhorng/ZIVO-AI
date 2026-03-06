"use client";

import React, { useState } from "react";
import type { ProjectPlan, ProjectTask } from "@/lib/ai/project-planner";

interface PlanViewerProps {
  plan: ProjectPlan | null;
  isLoading: boolean;
  onGenerateTask?: (task: ProjectTask) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function complexityColor(c: ProjectPlan["complexity"]): { bg: string; text: string; border: string } {
  switch (c) {
    case "low":
      return { bg: "rgba(16,185,129,0.12)", text: "#10b981", border: "rgba(16,185,129,0.3)" };
    case "medium":
      return { bg: "rgba(245,158,11,0.12)", text: "#f59e0b", border: "rgba(245,158,11,0.3)" };
    case "high":
      return { bg: "rgba(239,68,68,0.12)", text: "#ef4444", border: "rgba(239,68,68,0.3)" };
  }
}

const STACK_COLORS = [
  { bg: "rgba(99,102,241,0.15)", text: "#a5b4fc", border: "rgba(99,102,241,0.35)" },
  { bg: "rgba(14,165,233,0.15)", text: "#7dd3fc", border: "rgba(14,165,233,0.35)" },
  { bg: "rgba(168,85,247,0.15)", text: "#d8b4fe", border: "rgba(168,85,247,0.35)" },
  { bg: "rgba(236,72,153,0.15)", text: "#f9a8d4", border: "rgba(236,72,153,0.35)" },
  { bg: "rgba(20,184,166,0.15)", text: "#5eead4", border: "rgba(20,184,166,0.35)" },
];

function taskStatusStyle(status: ProjectTask["status"]): {
  color: string;
  bg: string;
  border: string;
  icon: string;
  pulse: boolean;
} {
  switch (status) {
    case "pending":
      return { color: "#94a3b8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.25)", icon: "○", pulse: false };
    case "running":
      return { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", icon: "◉", pulse: true };
    case "done":
      return { color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)", icon: "✓", pulse: false };
    case "error":
      return { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", icon: "✕", pulse: false };
  }
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonBlock({ width = "100%", height = 14 }: { width?: string | number; height?: number }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 6,
        background: "rgba(255,255,255,0.06)",
        animation: "pulse 1.4s ease-in-out infinite",
      }}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
      <SkeletonBlock width="60%" height={18} />
      <div style={{ display: "flex", gap: 8 }}>
        {[80, 100, 70].map((w, i) => (
          <SkeletonBlock key={i} width={w} height={26} />
        ))}
      </div>
      <SkeletonBlock width="40%" height={14} />
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <SkeletonBlock width="75%" height={14} />
          <SkeletonBlock width="55%" height={11} />
        </div>
      ))}
    </div>
  );
}

// ─── Task Item ───────────────────────────────────────────────────────────────

function TaskItem({ task, onGenerateTask }: { task: ProjectTask; onGenerateTask?: (task: ProjectTask) => void }) {
  const [localStatus, setLocalStatus] = useState<ProjectTask["status"]>(task.status);
  const [prevPropStatus, setPrevPropStatus] = useState<ProjectTask["status"]>(task.status);

  // Sync local status when the prop changes using the React "adjusting state during render" pattern
  // (avoids useEffect which triggers cascading-render lint errors).
  if (prevPropStatus !== task.status) {
    setPrevPropStatus(task.status);
    setLocalStatus(task.status);
  }

  const st = taskStatusStyle(localStatus);

  const handleToggleDone = () => {
    setLocalStatus((s) => (s === "done" ? "pending" : "done"));
  };

  return (
    <div
      style={{
        background: "#0a0b14",
        border: `1px solid ${st.border}`,
        borderRadius: 7,
        padding: "10px 12px",
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
      }}
    >
      {/* Status icon / checkbox */}
      <button
        onClick={handleToggleDone}
        title={localStatus === "done" ? "Mark as Todo" : "Mark as Done"}
        style={{
          flexShrink: 0,
          width: 22,
          height: 22,
          borderRadius: 5,
          background: st.bg,
          border: `1px solid ${st.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          color: st.color,
          marginTop: 1,
          cursor: "pointer",
          padding: 0,
          ...(st.pulse
            ? { boxShadow: `0 0 6px ${st.color}` }
            : {}),
        }}
      >
        {st.icon}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{task.title}</div>
        {task.description && (
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3, lineHeight: 1.5 }}>
            {task.description}
          </div>
        )}
        {task.files.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
            {task.files.map((f, i) => (
              <span
                key={i}
                style={{
                  fontSize: 10,
                  fontFamily: "monospace",
                  color: "#94a3b8",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 4,
                  padding: "2px 6px",
                }}
              >
                {f}
              </span>
            ))}
          </div>
        )}
        {/* Estimated file count */}
        {task.files.length > 0 && (
          <div style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>
            ~{task.files.length} file{task.files.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
        <span
          style={{
            fontSize: 11,
            color: st.color,
            background: st.bg,
            border: `1px solid ${st.border}`,
            borderRadius: 4,
            padding: "2px 7px",
            textTransform: "capitalize",
          }}
        >
          {localStatus}
        </span>

        {onGenerateTask && (
          <button
            onClick={() => onGenerateTask(task)}
            style={{
              padding: "3px 9px",
              borderRadius: 5,
              border: "1px solid rgba(99,102,241,0.4)",
              background: "rgba(99,102,241,0.1)",
              color: "#a5b4fc",
              fontSize: 11,
              cursor: "pointer",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            ▶ Generate
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function PlanViewer({ plan, isLoading, onGenerateTask }: PlanViewerProps): React.JSX.Element {
  if (isLoading) {
    return (
      <div
        style={{
          background: "#0f1120",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            background: "#0a0b14",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            fontSize: 13,
            fontWeight: 600,
            color: "#f1f5f9",
          }}
        >
          Project Plan
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (!plan) {
    return (
      <div
        style={{
          background: "#0f1120",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8,
          padding: "48px 16px",
          textAlign: "center",
          color: "#94a3b8",
          fontSize: 13,
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 10 }}>📋</div>
        <div style={{ fontWeight: 600, color: "#f1f5f9", marginBottom: 6 }}>No plan yet</div>
        <div>Describe your project and a plan will appear here.</div>
      </div>
    );
  }

  const complexity = complexityColor(plan.complexity);
  const doneTasks = plan.tasks.filter((t) => t.status === "done").length;

  return (
    <div
      style={{
        background: "#0f1120",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "10px 14px",
          background: "#0a0b14",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>Project Plan</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>
            {doneTasks}/{plan.tasks.length} tasks
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: complexity.text,
              background: complexity.bg,
              border: `1px solid ${complexity.border}`,
              borderRadius: 4,
              padding: "2px 8px",
              textTransform: "capitalize",
            }}
          >
            {plan.complexity}
          </span>
        </div>
      </div>

      <div style={{ padding: "14px 14px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Goal */}
        <div>
          <div style={{ fontSize: 11, color: "#6366f1", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>
            Goal
          </div>
          <p style={{ margin: 0, fontSize: 14, color: "#f1f5f9", lineHeight: 1.6 }}>{plan.goal}</p>
        </div>

        {/* Tech stack */}
        {plan.techStack.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: "#6366f1", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 7 }}>
              Tech Stack
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {plan.techStack.map((tech, i) => {
                const c = STACK_COLORS[i % STACK_COLORS.length];
                return (
                  <span
                    key={i}
                    title={tech.reason}
                    style={{
                      fontSize: 12,
                      color: c.text,
                      background: c.bg,
                      border: `1px solid ${c.border}`,
                      borderRadius: 99,
                      padding: "4px 12px",
                      cursor: "default",
                    }}
                  >
                    {tech.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: "flex", gap: 16 }}>
          <div
            style={{
              flex: 1,
              background: "#0a0b14",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 7,
              padding: "10px 12px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 700, color: "#6366f1" }}>
              {plan.estimatedFiles}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Est. files</div>
          </div>
          <div
            style={{
              flex: 1,
              background: "#0a0b14",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 7,
              padding: "10px 12px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 700, color: "#6366f1" }}>
              {plan.tasks.length}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Tasks</div>
          </div>
        </div>

        {/* Tasks */}
        {plan.tasks.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: "#6366f1", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
              Tasks
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {plan.tasks.map((task) => (
                <TaskItem key={task.id} task={task} onGenerateTask={onGenerateTask} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
