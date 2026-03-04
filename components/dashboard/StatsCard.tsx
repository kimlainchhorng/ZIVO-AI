'use client';

import type { ReactNode } from "react";

export interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: { value: number; label?: string };
  color?: string;
}

export default function StatsCard({ label, value, icon, trend, color = "#6366f1" }: StatsCardProps): React.ReactElement {
  const trendPositive = trend ? trend.value >= 0 : null;

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        fontFamily: "'Inter',system-ui,sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {icon && <div style={{ color }}>{icon}</div>}
        {trend !== undefined && (
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: trendPositive ? "#10b981" : "#ef4444",
              background: trendPositive ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            {trendPositive ? "↑" : "↓"} {Math.abs(trend.value)}%{trend.label ? ` ${trend.label}` : ""}
          </span>
        )}
      </div>
      <div>
        <div style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#f1f5f9" }}>
          {value}
        </div>
        <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.1rem" }}>{label}</div>
      </div>
    </div>
  );
}
