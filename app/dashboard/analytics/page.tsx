"use client";

import { useEffect, useState } from "react";

interface AnalyticsData {
  generationCount: number;
  successRate: number;
  totalCost: number;
  avgGenerationTime: number;
  apiUsage: { date: string; calls: number; tokens: number; cost: number }[];
  trends: { week: string; generations: number; avgTime: number; successRate: number }[];
}

const s = {
  page: { minHeight: "100vh", background: "#0a0a0a", color: "#f0f0f0", padding: "32px" } as React.CSSProperties,
  title: { fontSize: 32, fontWeight: 900, margin: 0, color: "#fff" } as React.CSSProperties,
  subtitle: { color: "#888", marginTop: 8, fontSize: 16, marginBottom: 32 } as React.CSSProperties,
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 40 } as React.CSSProperties,
  statCard: { background: "#111", borderRadius: 16, padding: 24, border: "1px solid #222" } as React.CSSProperties,
  statLabel: { color: "#888", fontSize: 13, marginBottom: 8 } as React.CSSProperties,
  statValue: { fontSize: 32, fontWeight: 900, color: "#fff" } as React.CSSProperties,
  sectionTitle: { fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 16 } as React.CSSProperties,
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: 14 },
  th: { textAlign: "left" as const, color: "#666", fontWeight: 600, padding: "10px 14px", borderBottom: "1px solid #1a1a1a" },
  td: { padding: "12px 14px", borderBottom: "1px solid #111", color: "#ccc" },
  card: { background: "#111", borderRadius: 16, padding: 24, border: "1px solid #222", marginBottom: 32 } as React.CSSProperties,
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={s.page}><div style={{ color: "#888", textAlign: "center", marginTop: 80 }}>Loading analytics…</div></div>;
  if (!data) return <div style={s.page}><div style={{ color: "#f44336", textAlign: "center", marginTop: 80 }}>Failed to load analytics.</div></div>;

  return (
    <div style={s.page}>
      <h1 style={s.title}>Analytics Dashboard</h1>
      <p style={s.subtitle}>Track your AI generation usage and performance</p>

      <div style={s.statsGrid}>
        <div style={s.statCard}>
          <div style={s.statLabel}>Total Generations</div>
          <div style={s.statValue}>{data.generationCount.toLocaleString()}</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>Success Rate</div>
          <div style={{ ...s.statValue, color: "#4caf50" }}>{data.successRate}%</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>Total Cost</div>
          <div style={s.statValue}>${data.totalCost.toFixed(2)}</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>Avg Gen Time</div>
          <div style={s.statValue}>{data.avgGenerationTime}s</div>
        </div>
      </div>

      <div style={s.sectionTitle}>API Usage (Last 7 Days)</div>
      <div style={s.card}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Date</th>
              <th style={s.th}>API Calls</th>
              <th style={s.th}>Tokens Used</th>
              <th style={s.th}>Cost</th>
            </tr>
          </thead>
          <tbody>
            {data.apiUsage.map((row) => (
              <tr key={row.date}>
                <td style={s.td}>{row.date}</td>
                <td style={s.td}>{row.calls}</td>
                <td style={s.td}>{row.tokens.toLocaleString()}</td>
                <td style={s.td}>${row.cost.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={s.sectionTitle}>Weekly Trends</div>
      <div style={s.card}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Week</th>
              <th style={s.th}>Generations</th>
              <th style={s.th}>Avg Time</th>
              <th style={s.th}>Success Rate</th>
            </tr>
          </thead>
          <tbody>
            {data.trends.map((row) => (
              <tr key={row.week}>
                <td style={s.td}>{row.week}</td>
                <td style={s.td}>{row.generations}</td>
                <td style={s.td}>{row.avgTime}s</td>
                <td style={{ ...s.td, color: "#4caf50" }}>{row.successRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
