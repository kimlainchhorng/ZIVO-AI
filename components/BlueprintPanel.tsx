'use client';

import { useEffect, useRef, useState, useCallback } from "react";
import type { AppBlueprint } from "@/app/api/app-blueprint/route";

const COLORS = {
  bg: "#0a0b14",
  bgPanel: "#0f1120",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  success: "#10b981",
  warning: "#f59e0b",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#475569",
};

interface BlueprintPanelProps {
  prompt: string;
}

function SkeletonLine({ width = "100%" }: { width?: string }) {
  return (
    <div
      style={{
        height: "14px",
        borderRadius: "6px",
        background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
        width,
        marginBottom: "6px",
      }}
    />
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: "0.6875rem",
        fontWeight: 700,
        color: COLORS.textMuted,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: "0.375rem",
        marginTop: "0.75rem",
      }}
    >
      {children}
    </div>
  );
}

function Tag({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.15rem 0.5rem",
        borderRadius: "12px",
        fontSize: "0.75rem",
        fontWeight: 500,
        background: color ? `${color}20` : COLORS.bgCard,
        border: `1px solid ${color ? `${color}40` : COLORS.border}`,
        color: color ?? COLORS.textSecondary,
        marginRight: "4px",
        marginBottom: "4px",
      }}
    >
      {children}
    </span>
  );
}

export default function BlueprintPanel({ prompt }: BlueprintPanelProps) {
  const [blueprint, setBlueprint] = useState<AppBlueprint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPromptRef = useRef<string>("");

  const fetchBlueprint = useCallback(async (p: string) => {
    if (!p.trim() || p === lastPromptRef.current) return;
    lastPromptRef.current = p;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/app-blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Failed to fetch blueprint");
      }
      const data = await res.json() as AppBlueprint;
      setBlueprint(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!prompt.trim()) {
      setBlueprint(null);
      setError(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchBlueprint(prompt);
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [prompt, fetchBlueprint]);

  if (!prompt.trim()) {
    return (
      <div
        style={{
          padding: "1.5rem 1rem",
          textAlign: "center",
          color: COLORS.textMuted,
          fontSize: "0.8125rem",
        }}
      >
        <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🗺️</div>
        <div>Enter a prompt to generate a blueprint</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: "0.75rem", animation: "fadeIn 0.3s ease" }}>
        <div style={{ fontSize: "0.8125rem", color: COLORS.textSecondary, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ display: "inline-block", width: "12px", height: "12px", border: "2px solid rgba(99,102,241,0.3)", borderTop: "2px solid #6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          Analyzing prompt…
        </div>
        <SkeletonLine width="60%" />
        <SkeletonLine width="90%" />
        <SkeletonLine width="75%" />
        <SkeletonLine width="50%" />
        <SkeletonLine width="85%" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "0.75rem", fontSize: "0.8125rem", color: "#ef4444", background: "rgba(239,68,68,0.08)", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.2)" }}>
        ⚠️ {error}
      </div>
    );
  }

  if (!blueprint) return null;

  return (
    <div style={{ animation: "fadeIn 0.3s ease", fontSize: "0.8125rem" }}>
      {/* App Type */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
        <span
          style={{
            padding: "0.25rem 0.75rem",
            background: "rgba(99,102,241,0.15)",
            border: "1px solid rgba(99,102,241,0.35)",
            borderRadius: "20px",
            fontSize: "0.8125rem",
            fontWeight: 700,
            color: COLORS.accent,
          }}
        >
          {blueprint.intent.appType}
        </span>
        <span
          style={{
            padding: "0.2rem 0.6rem",
            background: COLORS.bgCard,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "20px",
            fontSize: "0.75rem",
            color: COLORS.textMuted,
          }}
        >
          {blueprint.framework}
        </span>
        <span
          style={{
            padding: "0.2rem 0.6rem",
            background: "rgba(16,185,129,0.1)",
            border: "1px solid rgba(16,185,129,0.3)",
            borderRadius: "20px",
            fontSize: "0.75rem",
            color: COLORS.success,
          }}
        >
          ~{blueprint.estimatedFiles} files
        </span>
      </div>

      {/* Pages */}
      {blueprint.pages.length > 0 && (
        <>
          <SectionLabel>📄 Pages</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "0.25rem" }}>
            {blueprint.pages.slice(0, 8).map((page) => (
              <Tag key={page.path}>{page.path}</Tag>
            ))}
            {blueprint.pages.length > 8 && (
              <Tag>+{blueprint.pages.length - 8} more</Tag>
            )}
          </div>
        </>
      )}

      {/* Components */}
      {blueprint.components.length > 0 && (
        <>
          <SectionLabel>🧩 Components</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "0.25rem" }}>
            {blueprint.components.slice(0, 8).map((comp) => (
              <Tag key={comp.name} color="#8b5cf6">{comp.name}</Tag>
            ))}
            {blueprint.components.length > 8 && (
              <Tag color="#8b5cf6">+{blueprint.components.length - 8} more</Tag>
            )}
          </div>
        </>
      )}

      {/* Database Tables */}
      {blueprint.database.length > 0 && (
        <>
          <SectionLabel>🗄️ Database</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "0.25rem" }}>
            {blueprint.database.map((t) => (
              <Tag key={t.table} color={COLORS.warning}>{t.table}</Tag>
            ))}
          </div>
        </>
      )}

      {/* Auth Strategy */}
      {blueprint.authStrategy && blueprint.authStrategy !== "None" && (
        <>
          <SectionLabel>🔐 Auth</SectionLabel>
          <div style={{ color: COLORS.textSecondary, fontSize: "0.8125rem", padding: "0.25rem 0" }}>
            {blueprint.authStrategy}
          </div>
        </>
      )}

      {/* Features */}
      {blueprint.intent.features.length > 0 && (
        <>
          <SectionLabel>✨ Features</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {blueprint.intent.features.map((f) => (
              <Tag key={f} color={COLORS.success}>{f}</Tag>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
