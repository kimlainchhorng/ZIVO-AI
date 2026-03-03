'use client';

import React, { useState } from "react";

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

function SvgIcon({ paths, size = 16 }: { paths: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}>
      {paths}
    </svg>
  );
}

interface Connector {
  id: string;
  abbr: string;
  abbrColor: string;
  name: string;
  description: string;
  enabled?: boolean;
}

const SHARED_CONNECTORS: Connector[] = [
  { id: "openai", abbr: "OA", abbrColor: "#10a37f", name: "OpenAI", description: "AI text & code generation", enabled: true },
  { id: "supabase", abbr: "SB", abbrColor: "#3ecf8e", name: "Supabase", description: "Database, auth & storage", enabled: true },
  { id: "github", abbr: "GH", abbrColor: "#6e40c9", name: "GitHub", description: "Connect your repositories", enabled: true },
  { id: "stripe", abbr: "ST", abbrColor: "#635bff", name: "Stripe", description: "Set up payments" },
  { id: "vercel", abbr: "VC", abbrColor: "#000", name: "Vercel", description: "Deploy your apps instantly" },
  { id: "elevenlabs", abbr: "EL", abbrColor: "#f97316", name: "ElevenLabs", description: "AI voice generation" },
  { id: "firecrawl", abbr: "FC", abbrColor: "#ef4444", name: "Firecrawl", description: "AI-powered web scraping" },
  { id: "perplexity", abbr: "PX", abbrColor: "#6366f1", name: "Perplexity", description: "AI-powered search" },
];

export default function ConnectorsPage() {
  const [search, setSearch] = useState("");

  const filtered = SHARED_CONNECTORS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .zivo-nav-link:hover { color: #f1f5f9 !important; }
        .connector-card:hover { border-color: rgba(255,255,255,0.18) !important; background: rgba(255,255,255,0.06) !important; }
        .connector-card { transition: border-color 0.2s, background 0.2s; }
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
                    background: label === "Connectors" ? "rgba(99,102,241,0.15)" : "transparent",
                    color: label === "Connectors" ? COLORS.accent : COLORS.textSecondary,
                    borderRadius: "6px",
                    border: label === "Connectors" ? `1px solid rgba(99,102,241,0.3)` : "1px solid transparent",
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

          {/* Header */}
          <div style={{ marginBottom: "1.75rem" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: "0 0 0.35rem", letterSpacing: "-0.02em" }}>Connectors</h1>
            <p style={{ fontSize: "0.9rem", color: COLORS.textSecondary, margin: 0 }}>Add integrations to your builds</p>
          </div>

          {/* Search */}
          <div style={{ position: "relative", marginBottom: "2rem", maxWidth: "400px" }}>
            <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: COLORS.textMuted, display: "flex", alignItems: "center" }}>
              <SvgIcon paths={<><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>} />
            </span>
            <input
              type="text"
              placeholder="Search connectors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "0.6rem 0.75rem 0.6rem 2.25rem", color: COLORS.textPrimary, fontSize: "0.875rem", outline: "none" }}
            />
          </div>

          {/* Shared Connectors */}
          <div style={{ marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: "0.875rem", fontWeight: 600, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 1rem" }}>Shared connectors</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
              {filtered.map((connector) => (
                <div
                  key={connector.id}
                  className="connector-card"
                  style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "12px", padding: "1.25rem", position: "relative", cursor: "pointer" }}
                >
                  {connector.enabled && (
                    <span style={{ position: "absolute", top: "0.75rem", right: "0.75rem", padding: "0.15rem 0.5rem", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: COLORS.success, borderRadius: "20px", fontSize: "0.7rem", fontWeight: 600 }}>
                      Enabled
                    </span>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: connector.abbrColor, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.875rem", color: "#fff", flexShrink: 0 }}>
                      {connector.abbr}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.9375rem", color: COLORS.textPrimary }}>{connector.name}</div>
                      <div style={{ fontSize: "0.8125rem", color: COLORS.textSecondary, marginTop: "0.1rem" }}>{connector.description}</div>
                    </div>
                  </div>
                </div>
              ))}
              {/* View all card */}
              <div
                className="connector-card"
                style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "12px", padding: "1.25rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: COLORS.textSecondary, cursor: "pointer", fontSize: "0.875rem" }}
              >
                <SvgIcon paths={<><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></>} /> View all
              </div>
            </div>
          </div>

          {/* Personal Connectors */}
          <div>
            <h2 style={{ fontSize: "0.875rem", fontWeight: 600, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 1rem" }}>Personal connectors</h2>
            <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: "12px", padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", color: COLORS.textMuted, textAlign: "center" }}>
              <SvgIcon paths={<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>} size={28} />
              <p style={{ margin: 0, fontSize: "0.875rem" }}>No personal connectors yet.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
