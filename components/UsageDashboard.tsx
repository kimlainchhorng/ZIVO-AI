"use client";

import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import type { ModelUsageStats } from "@/lib/ai/model-router";

interface UsageData {
  totalTokens: number;
  totalCost: number;
  byModel: ModelUsageStats[];
  requestsPerDay: { date: string; count: number }[];
  modelRecommendations: { task: string; recommended: string; cheapest: string }[];
}

const THEME = {
  bg: "#0a0b14",
  panel: "#0f1120",
  accent: "#6366f1",
  border: "rgba(255,255,255,0.08)",
  textPrimary: "#f1f5f9",
  textMuted: "#94a3b8",
};

export default function UsageDashboard(): ReactElement {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/usage")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<UsageData>;
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load usage data");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={containerStyle}>
        <p style={{ color: THEME.textMuted, textAlign: "center", padding: "2rem" }}>
          Loading usage data…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <p style={{ color: "#f87171", textAlign: "center", padding: "2rem" }}>Error: {error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={containerStyle}>
        <p style={{ color: THEME.textMuted, textAlign: "center", padding: "2rem" }}>
          No usage data available.
        </p>
      </div>
    );
  }

  const maxDayCount = Math.max(...data.requestsPerDay.map((d) => d.count), 1);

  return (
    <div style={containerStyle}>
      <h1 style={{ color: THEME.textPrimary, fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>
        Usage Dashboard
      </h1>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={panelStyle}>
          <p style={{ color: THEME.textMuted, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
            Total Tokens (all time)
          </p>
          <p style={{ color: THEME.textPrimary, fontSize: "2rem", fontWeight: 700 }}>
            {data.totalTokens.toLocaleString()}
          </p>
        </div>
        <div style={panelStyle}>
          <p style={{ color: THEME.textMuted, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
            Total Cost (all time)
          </p>
          <p style={{ color: THEME.accent, fontSize: "2rem", fontWeight: 700 }}>
            ${data.totalCost.toFixed(4)}
          </p>
        </div>
      </div>

      {/* Cost breakdown by model */}
      <div style={{ ...panelStyle, marginBottom: "1.5rem" }}>
        <h2 style={sectionHeading}>Cost Breakdown by Model</h2>
        {data.byModel.length === 0 ? (
          <p style={{ color: THEME.textMuted, fontSize: "0.875rem" }}>No model usage recorded yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr>
                  {["Model", "Calls", "Tokens", "Cost"].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.byModel.map((row) => (
                  <tr key={row.modelId} style={{ borderBottom: `1px solid ${THEME.border}` }}>
                    <td style={tdStyle}>
                      <span style={{ color: THEME.accent }}>{row.modelId}</span>
                    </td>
                    <td style={tdStyle}>{row.calls.toLocaleString()}</td>
                    <td style={tdStyle}>{row.totalTokens.toLocaleString()}</td>
                    <td style={tdStyle}>${row.totalCost.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Requests per day bar chart */}
      <div style={{ ...panelStyle, marginBottom: "1.5rem" }}>
        <h2 style={sectionHeading}>Requests per Day (Last 7 Days)</h2>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem", height: "120px" }}>
          {data.requestsPerDay.map((day) => {
            const pct = (day.count / maxDayCount) * 100;
            return (
              <div key={day.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%" }}>
                <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                  <div
                    style={{
                      width: "100%",
                      height: `${pct}%`,
                      background: THEME.accent,
                      borderRadius: "3px 3px 0 0",
                      minHeight: "4px",
                      transition: "height 0.3s ease",
                    }}
                    title={`${day.count} requests`}
                  />
                </div>
                <p style={{ color: THEME.textMuted, fontSize: "0.625rem", marginTop: "0.375rem", textAlign: "center" }}>
                  {day.date.slice(5)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Model recommendations */}
      <div style={panelStyle}>
        <h2 style={sectionHeading}>Model Recommendations by Task</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem" }}>
          {data.modelRecommendations.map((rec) => (
            <div key={rec.task} style={{ background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: "8px", padding: "0.875rem" }}>
              <p style={{ color: THEME.textMuted, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                {rec.task}
              </p>
              <p style={{ color: THEME.textPrimary, fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                <span style={{ color: THEME.textMuted }}>Best: </span>
                <span style={{ color: THEME.accent }}>{rec.recommended}</span>
              </p>
              <p style={{ color: THEME.textPrimary, fontSize: "0.8rem" }}>
                <span style={{ color: THEME.textMuted }}>Cheapest: </span>
                <span style={{ color: "#34d399" }}>{rec.cheapest}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  background: THEME.bg,
  minHeight: "100vh",
  padding: "2rem",
  fontFamily: "system-ui, -apple-system, sans-serif",
  color: THEME.textPrimary,
};

const panelStyle: React.CSSProperties = {
  background: THEME.panel,
  border: `1px solid ${THEME.border}`,
  borderRadius: "12px",
  padding: "1.25rem",
};

const sectionHeading: React.CSSProperties = {
  color: THEME.textPrimary,
  fontSize: "1rem",
  fontWeight: 600,
  marginBottom: "1rem",
};

const thStyle: React.CSSProperties = {
  color: THEME.textMuted,
  textAlign: "left",
  padding: "0.5rem 0.75rem",
  fontSize: "0.75rem",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  borderBottom: `1px solid ${THEME.border}`,
};

const tdStyle: React.CSSProperties = {
  color: THEME.textPrimary,
  padding: "0.625rem 0.75rem",
};
