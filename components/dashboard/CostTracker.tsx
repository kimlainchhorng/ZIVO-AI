'use client';

export interface CostBreakdown {
  model: string;
  feature: string;
  requests: number;
  tokens: number;
  costUsd: number;
}

export interface CostTrackerProps {
  breakdown: CostBreakdown[];
  totalUsd?: number;
  budgetUsd?: number;
  title?: string;
}

function formatCost(usd: number): string {
  if (usd < 0.01) return `$${(usd * 100).toFixed(2)}¢`;
  return `$${usd.toFixed(4)}`;
}

export default function CostTracker({
  breakdown,
  totalUsd,
  budgetUsd,
  title = "Cost Tracker",
}: CostTrackerProps): React.ReactElement {
  const total = totalUsd ?? breakdown.reduce((s, b) => s + b.costUsd, 0);
  const budgetPct = budgetUsd ? Math.min(100, Math.round((total / budgetUsd) * 100)) : null;
  const budgetColor =
    budgetPct !== null
      ? budgetPct >= 90
        ? "#ef4444"
        : budgetPct >= 70
        ? "#f59e0b"
        : "#10b981"
      : "#6366f1";

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: "1.25rem",
        fontFamily: "'Inter',system-ui,sans-serif",
        color: "#f1f5f9",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h3 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 600 }}>{title}</h3>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em" }}>{formatCost(total)}</div>
          {budgetUsd && (
            <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>of {formatCost(budgetUsd)} budget</div>
          )}
        </div>
      </div>

      {budgetPct !== null && (
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem", fontSize: "0.75rem", color: "#64748b" }}>
            <span>Budget used</span>
            <span style={{ color: budgetColor, fontWeight: 600 }}>{budgetPct}%</span>
          </div>
          <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${budgetPct}%`,
                background: budgetColor,
                borderRadius: 3,
                transition: "width 0.4s",
              }}
            />
          </div>
        </div>
      )}

      {/* Breakdown table */}
      {breakdown.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {breakdown.map((row, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.4rem 0",
                borderBottom: idx < breakdown.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 500, color: "#f1f5f9" }}>{row.feature}</div>
                <div style={{ fontSize: "0.7rem", color: "#64748b" }}>{row.model} · {row.requests} req · {row.tokens.toLocaleString()} tokens</div>
              </div>
              <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#94a3b8", flexShrink: 0 }}>
                {formatCost(row.costUsd)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ textAlign: "center", color: "#475569", fontSize: "0.875rem", margin: 0 }}>
          No cost data yet
        </p>
      )}
    </div>
  );
}
