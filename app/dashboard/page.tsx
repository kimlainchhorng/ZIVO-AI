'use client';

import Link from 'next/link';
import { useState } from "react";
import UsageDashboard from "@/components/UsageDashboard";

const QUICK_ACTIONS = [
  { href: '/ai', icon: '🤖', title: 'AI Builder', desc: 'Generate apps and sites with AI' },
  { href: '/schema-designer', icon: '🗃️', title: 'Schema Designer', desc: 'Design and export database schemas' },
  { href: '/api-generator', icon: '⚡', title: 'API Generator', desc: 'Generate REST API routes instantly' },
  { href: '/workflow', icon: '🔄', title: 'Workflow', desc: 'Build and automate data pipelines' },
  { href: '/component-library', icon: '🎨', title: 'Component Library', desc: 'Browse and copy UI components' },
  { href: '/api-client', icon: '🔌', title: 'API Client', desc: 'Generate typed clients from OpenAPI specs' },
];

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

interface Project {
  id: string;
  name: string;
  status: "success" | "building" | "failed";
  files: number;
  created: string;
}

const MOCK_PROJECTS: Project[] = [
  { id: "1", name: "SaaS Landing Page", status: "success", files: 8, created: "2026-03-01" },
  { id: "2", name: "E-commerce Store", status: "success", files: 14, created: "2026-02-28" },
  { id: "3", name: "Auth Flow App", status: "building", files: 5, created: "2026-02-27" },
  { id: "4", name: "Analytics Dashboard", status: "success", files: 11, created: "2026-02-25" },
  { id: "5", name: "Todo App", status: "failed", files: 3, created: "2026-02-24" },
];

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  success: { bg: "rgba(16,185,129,0.15)", color: "#10b981", label: "Success" },
  building: { bg: "rgba(245,158,11,0.15)", color: "#f59e0b", label: "Building" },
  failed: { bg: "rgba(239,68,68,0.15)", color: "#ef4444", label: "Failed" },
};

export default function DashboardPage() {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [showUsage, setShowUsage] = useState(false);

  const totalBuilds = MOCK_PROJECTS.length;
  const totalFiles = MOCK_PROJECTS.reduce((s, p) => s + p.files, 0);
  const tokensUsed = 184320;
  const mostUsedModel = "GPT-4o";
  const usageCost = "$2.45";

  const stats = [
    {
      label: "Total Builds",
      value: String(totalBuilds),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
          <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
          <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
        </svg>
      ),
    },
    {
      label: "Files Generated",
      value: String(totalFiles),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
          <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
        </svg>
      ),
    },
    {
      label: "Tokens Used",
      value: tokensUsed.toLocaleString(),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" x2="12" y1="20" y2="10"/>
          <line x1="18" x2="18" y1="20" y2="4"/>
          <line x1="6" x2="6" y1="20" y2="16"/>
        </svg>
      ),
    },
    {
      label: "Most Used Model",
      value: mostUsedModel,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a8 8 0 0 1 8 8v4a8 8 0 0 1-16 0v-4a8 8 0 0 1 8-8z"/>
          <path d="M9 10h.01M15 10h.01"/>
          <path d="M9.5 15a3.5 3.5 0 0 0 5 0"/>
        </svg>
      ),
    },
    {
      label: "Usage Cost (Month)",
      value: usageCost,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8"/>
          <line x1="12" x2="12" y1="6" y2="8"/>
          <line x1="12" x2="12" y1="16" y2="18"/>
        </svg>
      ),
    },
  ];

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .zivo-nav:hover { color: #f1f5f9 !important; }
        .zivo-btn:hover { opacity: 0.85; }
        .zivo-btn { transition: opacity 0.15s; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: COLORS.bg, color: COLORS.textPrimary, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", overflow: "hidden" }}>

        {/* Top Nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1.5rem", height: "52px", borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "28px", height: "28px", background: COLORS.accentGradient, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700 }}>Z</div>
            <span style={{ fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.01em" }}>ZIVO AI</span>
            <div style={{ width: "1px", height: "20px", background: COLORS.border, margin: "0 0.25rem" }} />
            <nav style={{ display: "flex", gap: "0.25rem" }}>
              {([["builder", "/ai"], ["dashboard", "/dashboard"], ["connectors", "/connectors"]] as const).map(([nav, href]) => (
                <a
                  key={nav}
                  href={href}
                  className="zivo-nav"
                  style={{ padding: "0.25rem 0.75rem", background: nav === "dashboard" ? "rgba(99,102,241,0.15)" : "transparent", color: nav === "dashboard" ? COLORS.accent : COLORS.textSecondary, borderRadius: "6px", border: nav === "dashboard" ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent", cursor: "pointer", fontSize: "0.8125rem", fontWeight: 500, textTransform: "capitalize", transition: "color 0.15s", textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                >
                  {nav.charAt(0).toUpperCase() + nav.slice(1)}
                </a>
              ))}
            </nav>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: COLORS.success, boxShadow: `0 0 6px ${COLORS.success}` }} />
            <span style={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>Ready</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: COLORS.accentGradient, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.875rem" }}>N</div>
          </div>
        </div>

        {/* Body */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* Sidebar */}
          <div style={{ width: "220px", flexShrink: 0, borderRight: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, overflowY: "auto", padding: "1rem 0" }}>
            <div style={{ padding: "0 1rem", marginBottom: "1.25rem" }}>
              <p style={{ fontSize: "0.65rem", fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 0.5rem" }}>Projects</p>
              {MOCK_PROJECTS.slice(0, 4).map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0.5rem", borderRadius: "6px", marginBottom: "2px", cursor: "pointer" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: STATUS_COLORS[p.status].color, flexShrink: 0 }} />
                  <span style={{ fontSize: "0.8rem", color: COLORS.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: `1px solid ${COLORS.border}`, margin: "0.75rem 0", padding: "0 1rem", paddingTop: "0.75rem" }}>
              <p style={{ fontSize: "0.65rem", fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 0.5rem" }}>Usage</p>
              <div style={{ fontSize: "0.75rem", color: COLORS.textSecondary, marginBottom: "0.4rem" }}>Tokens: {tokensUsed.toLocaleString()} / 500,000</div>
              <div style={{ height: "6px", background: COLORS.bgCard, borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(tokensUsed / 500000) * 100}%`, background: COLORS.accentGradient, borderRadius: "3px" }} />
              </div>
            </div>
            <div style={{ borderTop: `1px solid ${COLORS.border}`, margin: "0.75rem 0", padding: "0 1rem", paddingTop: "0.75rem" }}>
              <p style={{ fontSize: "0.65rem", fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 0.5rem" }}>Billing</p>
              <div style={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>Plan: <span style={{ color: COLORS.accent, fontWeight: 600 }}>Pro</span></div>
              <div style={{ fontSize: "0.75rem", color: COLORS.textMuted, marginTop: "0.25rem" }}>Renews Apr 1, 2026</div>
            </div>
          </div>

          {/* Main Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>

            {/* Stats Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem", animation: "fadeIn 0.4s ease" }}>
              {stats.map((s) => (
                <div key={s.label} style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: "12px", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ color: COLORS.accent }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em", color: COLORS.textPrimary }}>{s.value}</div>
                    <div style={{ fontSize: "0.8rem", color: COLORS.textSecondary, marginTop: "0.1rem" }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Projects Table */}
            <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: "12px", marginBottom: "1.5rem", animation: "fadeIn 0.5s ease", overflow: "hidden" }}>
              <div style={{ padding: "1rem 1.25rem", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 600 }}>Recent Projects</h2>
                <span style={{ fontSize: "0.75rem", color: COLORS.textMuted }}>{MOCK_PROJECTS.length} total</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    {["Name", "Status", "Files", "Created", "Actions"].map((h) => (
                      <th key={h} style={{ padding: "0.6rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_PROJECTS.map((p) => (
                    <tr
                      key={p.id}
                      onMouseEnter={() => setHoveredRow(p.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{ borderBottom: `1px solid ${COLORS.border}`, background: hoveredRow === p.id ? "rgba(255,255,255,0.02)" : "transparent", transition: "background 0.15s" }}
                    >
                      <td style={{ padding: "0.75rem 1.25rem", fontSize: "0.875rem", fontWeight: 500 }}>{p.name}</td>
                      <td style={{ padding: "0.75rem 1.25rem" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "2px 8px", borderRadius: "4px", ...STATUS_COLORS[p.status] }}>{STATUS_COLORS[p.status].label}</span>
                      </td>
                      <td style={{ padding: "0.75rem 1.25rem", fontSize: "0.875rem", color: COLORS.textSecondary }}>{p.files}</td>
                      <td style={{ padding: "0.75rem 1.25rem", fontSize: "0.875rem", color: COLORS.textSecondary }}>{p.created}</td>
                      <td style={{ padding: "0.75rem 1.25rem" }}>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          <a href="/ai" style={{ padding: "0.25rem 0.6rem", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "5px", color: COLORS.accent, fontSize: "0.75rem", fontWeight: 500, textDecoration: "none", cursor: "pointer" }}>Open</a>
                          <button className="zivo-btn" style={{ padding: "0.25rem 0.6rem", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "5px", color: COLORS.success, fontSize: "0.75rem", fontWeight: 500, cursor: "pointer" }}>Deploy</button>
                          <button className="zivo-btn" style={{ padding: "0.25rem 0.6rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "5px", color: COLORS.error, fontSize: "0.75rem", fontWeight: 500, cursor: "pointer" }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Quick Actions Grid */}
            <div style={{ marginBottom: "1.5rem", animation: "fadeIn 0.55s ease" }}>
              <h2 style={{ margin: "0 0 0.75rem", fontSize: "0.9375rem", fontWeight: 600, color: COLORS.textPrimary }}>Quick Actions</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
                {QUICK_ACTIONS.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="zivo-quick-card"
                  >
                    <div className="zivo-quick-card-icon">{action.icon}</div>
                    <span className="zivo-quick-card-title">{action.title}</span>
                    <span className="zivo-quick-card-desc">{action.desc}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Actions (legacy row) */}
            <div style={{ display: "flex", gap: "1rem", animation: "fadeIn 0.6s ease", flexWrap: "wrap" }}>
              <a href="/ai" style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.75rem 1.25rem", background: COLORS.accentGradient, borderRadius: "10px", color: "#fff", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
                New Project
              </a>
              <a href="/connectors" style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.75rem 1.25rem", background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: "10px", color: COLORS.textSecondary, textDecoration: "none", fontWeight: 500, fontSize: "0.9rem" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                View Connectors
              </a>
              <button
                className="zivo-btn"
                onClick={() => setShowUsage((v) => !v)}
                style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.75rem 1.25rem", background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: "10px", color: COLORS.textSecondary, fontWeight: 500, fontSize: "0.9rem", cursor: "pointer" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="18" y1="20" y2="4"/><line x1="12" x2="12" y1="20" y2="10"/><line x1="6" x2="6" y1="20" y2="16"/></svg>
                View Usage Stats
              </button>
            </div>

            {/* Memory Section */}
            <div style={{ marginTop: "1rem", padding: "0.875rem 1.25rem", background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", animation: "fadeIn 0.7s ease" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M21.18 8.02A10 10 0 0 0 12 2v10h10a10 10 0 0 0-.82-3.98z"/></svg>
                <span style={{ fontSize: "0.875rem", color: COLORS.textSecondary }}>
                  <span style={{ color: COLORS.textPrimary, fontWeight: 600 }}>Project Memory:</span>{" "}
                  <span style={{ color: COLORS.success }}>Active</span>
                  {" "}(5 decisions, 12 changes)
                </span>
              </div>
              <a href="/dashboard/memory" style={{ fontSize: "0.8rem", color: COLORS.accent, textDecoration: "none", fontWeight: 500 }}>View Memory Panel →</a>
            </div>

            {/* Usage Dashboard (collapsible) */}
            {showUsage && (
              <div id="usage" style={{ marginTop: "1.5rem", animation: "fadeIn 0.4s ease" }}>
                <UsageDashboard />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
