'use client';

import React from "react";

const COLORS = {
  bg: "#0a0b14",
  bgPanel: "#0f1120",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  success: "#10b981",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#475569",
};

function SvgIcon({ paths, size = 18 }: { paths: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}>
      {paths}
    </svg>
  );
}

const STATS = [
  {
    label: "Total Builds",
    value: "12",
    icon: <SvgIcon paths={<polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>} size={22} />,
  },
  {
    label: "Files Generated",
    value: "87",
    icon: <SvgIcon paths={<><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></>} size={22} />,
  },
  {
    label: "Tokens Used",
    value: "45.2K",
    icon: <SvgIcon paths={<><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></>} size={22} />,
  },
  {
    label: "Last Build",
    value: "2.3s",
    icon: <SvgIcon paths={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>} size={22} />,
  },
];

const PROJECTS = [
  { name: "SaaS Landing Page", status: "complete", files: 8, date: "Mar 2, 2026" },
  { name: "E-commerce Store", status: "complete", files: 14, date: "Mar 1, 2026" },
  { name: "Auth Flow App", status: "in progress", files: 5, date: "Feb 28, 2026" },
];

export default function DashboardPage() {
  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .zivo-nav-link:hover { color: #f1f5f9 !important; }
        .zivo-card:hover { border-color: rgba(255,255,255,0.16) !important; }
        .zivo-btn-primary:hover { opacity: 0.85; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: COLORS.bg, color: COLORS.textPrimary, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>

        {/* Top Nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1.5rem", height: "52px", borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "28px", height: "28px", background: COLORS.accentGradient, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700 }}>Z</div>
            <span style={{ fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.01em" }}>ZIVO AI</span>
            <div style={{ width: "1px", height: "20px", background: COLORS.border, margin: "0 0.25rem" }} />
            <nav style={{ display: "flex", gap: "0.25rem" }}>
              {([["Builder", "/ai"], ["Dashboard", "/dashboard"], ["Connectors", "/connectors"]] as const).map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  className="zivo-nav-link"
                  style={{
                    padding: "0.25rem 0.75rem",
                    background: label === "Dashboard" ? "rgba(99,102,241,0.15)" : "transparent",
                    color: label === "Dashboard" ? COLORS.accent : COLORS.textSecondary,
                    borderRadius: "6px",
                    border: label === "Dashboard" ? `1px solid rgba(99,102,241,0.3)` : "1px solid transparent",
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    textDecoration: "none",
                    transition: "color 0.15s",
                  }}
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: COLORS.accentGradient, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.875rem" }}>N</div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, padding: "2rem", maxWidth: "960px", margin: "0 auto", width: "100%", animation: "fadeIn 0.4s ease" }}>

          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: "0 0 1.75rem", letterSpacing: "-0.02em" }}>Dashboard</h1>

          {/* Stats Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="zivo-card"
                style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: "12px", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem", transition: "border-color 0.2s" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.8125rem", color: COLORS.textSecondary }}>{stat.label}</span>
                  <span style={{ color: COLORS.accent }}>{stat.icon}</span>
                </div>
                <span style={{ fontSize: "2rem", fontWeight: 700, color: COLORS.textPrimary, letterSpacing: "-0.02em" }}>{stat.value}</span>
              </div>
            ))}
          </div>

          {/* Recent Projects */}
          <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: "12px", padding: "1.5rem", marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 1.25rem", color: COLORS.textPrimary }}>Recent Projects</h2>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Name", "Status", "Files", "Date"].map((col) => (
                    <th key={col} style={{ textAlign: "left", padding: "0.5rem 0.75rem", fontSize: "0.75rem", fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${COLORS.border}` }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PROJECTS.map((p, i) => (
                  <tr key={i}>
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem", color: COLORS.textPrimary, borderBottom: i < PROJECTS.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>{p.name}</td>
                    <td style={{ padding: "0.75rem", borderBottom: i < PROJECTS.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                      <span style={{ padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 500, background: p.status === "complete" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color: p.status === "complete" ? COLORS.success : "#f59e0b", border: `1px solid ${p.status === "complete" ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}` }}>
                        {p.status === "complete" ? "Complete" : "In Progress"}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem", color: COLORS.textSecondary, borderBottom: i < PROJECTS.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>{p.files}</td>
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem", color: COLORS.textSecondary, borderBottom: i < PROJECTS.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>{p.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 1rem", color: COLORS.textPrimary }}>Quick Actions</h2>
            <div style={{ display: "flex", gap: "1rem" }}>
              <a
                href="/ai"
                className="zivo-btn-primary"
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.65rem 1.25rem", background: COLORS.accentGradient, color: "#fff", borderRadius: "10px", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem", transition: "opacity 0.15s" }}
              >
                <SvgIcon paths={<polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>} /> New Build
              </a>
              <a
                href="/connectors"
                className="zivo-btn-primary"
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.65rem 1.25rem", background: "transparent", color: COLORS.textPrimary, borderRadius: "10px", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem", border: `1px solid ${COLORS.border}`, transition: "opacity 0.15s" }}
              >
                <SvgIcon paths={<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>} /> Manage Connectors
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
