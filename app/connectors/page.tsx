'use client';

import { useState } from "react";

const COLORS = {
  bg: "#0a0b14",
  bgPanel: "#0f1120",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  borderHover: "rgba(255,255,255,0.16)",
  accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  success: "#10b981",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#475569",
};

interface Connector {
  id: string;
  name: string;
  description: string;
  iconBg: string;
  iconColor: string;
  initials: string;
  enabled: boolean;
  personal: boolean;
}

const CONNECTORS: Connector[] = [
  { id: "openai", name: "OpenAI", description: "AI text generation and embeddings.", iconBg: "#1a2a1a", iconColor: "#10b981", initials: "OA", enabled: true, personal: false },
  { id: "supabase", name: "Supabase", description: "Database & auth for your apps.", iconBg: "#1a2a1a", iconColor: "#3ecf8e", initials: "SB", enabled: true, personal: false },
  { id: "github", name: "GitHub", description: "Connect and sync your repositories.", iconBg: "#1e1e1e", iconColor: "#f1f5f9", initials: "GH", enabled: true, personal: false },
  { id: "stripe", name: "Stripe", description: "Set up payments and subscriptions.", iconBg: "#1a1a2e", iconColor: "#a78bfa", initials: "ST", enabled: false, personal: false },
  { id: "vercel", name: "Vercel", description: "Deploy your apps with one click.", iconBg: "#1e1e1e", iconColor: "#f1f5f9", initials: "VC", enabled: false, personal: false },
  { id: "elevenlabs", name: "ElevenLabs", description: "AI voice generation for your apps.", iconBg: "#1e1e1e", iconColor: "#94a3b8", initials: "EL", enabled: false, personal: false },
  { id: "firecrawl", name: "Firecrawl", description: "Web scraping and data extraction.", iconBg: "#2a1a0a", iconColor: "#f97316", initials: "FC", enabled: false, personal: false },
  { id: "anthropic", name: "Anthropic", description: "Claude AI models for your projects.", iconBg: "#1a1a1e", iconColor: "#c084fc", initials: "AN", enabled: false, personal: true },
  { id: "resend", name: "Resend", description: "Transactional email API.", iconBg: "#1e1e1e", iconColor: "#f1f5f9", initials: "RS", enabled: false, personal: true },
  { id: "upstash", name: "Upstash", description: "Redis and Kafka for serverless.", iconBg: "#0a1e1a", iconColor: "#34d399", initials: "UP", enabled: false, personal: true },
];

function ConnectorCard({ connector }: { connector: Connector }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: COLORS.bgPanel,
        border: `1px solid ${hovered ? COLORS.borderHover : COLORS.border}`,
        borderRadius: "12px",
        padding: "1.25rem",
        cursor: "pointer",
        transition: "border-color 0.15s",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      {connector.enabled && (
        <span style={{ position: "absolute", top: "0.75rem", right: "0.75rem", fontSize: "0.7rem", fontWeight: 600, color: COLORS.success, background: "rgba(16,185,129,0.12)", padding: "2px 7px", borderRadius: "4px" }}>
          Enabled
        </span>
      )}
      <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: connector.iconBg, border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: connector.iconColor, fontWeight: 700, fontSize: "0.875rem" }}>
        {connector.initials}
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: "0.9375rem", color: COLORS.textPrimary, marginBottom: "0.25rem" }}>{connector.name}</div>
        <div style={{ fontSize: "0.8125rem", color: COLORS.textSecondary }}>{connector.description}</div>
      </div>
    </div>
  );
}

export default function ConnectorsPage() {
  const [search, setSearch] = useState("");

  const shared = CONNECTORS.filter((c) => !c.personal && c.name.toLowerCase().includes(search.toLowerCase()));
  const personal = CONNECTORS.filter((c) => c.personal && c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .zivo-nav:hover { color: #f1f5f9 !important; }
        .zivo-input:focus { outline: none; border-color: #6366f1 !important; }
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
                  style={{ padding: "0.25rem 0.75rem", background: nav === "connectors" ? "rgba(99,102,241,0.15)" : "transparent", color: nav === "connectors" ? COLORS.accent : COLORS.textSecondary, borderRadius: "6px", border: nav === "connectors" ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent", cursor: "pointer", fontSize: "0.8125rem", fontWeight: 500, textTransform: "capitalize", transition: "color 0.15s", textDecoration: "none", display: "inline-flex", alignItems: "center" }}
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
              <a href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: COLORS.textSecondary, textDecoration: "none", marginBottom: "1rem" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                Back
              </a>
              <p style={{ fontSize: "0.65rem", fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 0.5rem" }}>Workspace</p>
              <div style={{ fontSize: "0.8rem", color: COLORS.textSecondary, padding: "0.35rem 0.5rem", borderRadius: "6px", fontWeight: 500 }}>ZIVO Team</div>
            </div>
            <div style={{ borderTop: `1px solid ${COLORS.border}`, margin: "0.75rem 0", padding: "0 1rem", paddingTop: "0.75rem" }}>
              <p style={{ fontSize: "0.65rem", fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 0.5rem" }}>Account</p>
              <div style={{ fontSize: "0.8rem", color: COLORS.textSecondary, padding: "0.35rem 0.5rem", borderRadius: "6px" }}>Profile</div>
              <div style={{ fontSize: "0.8rem", color: COLORS.textSecondary, padding: "0.35rem 0.5rem", borderRadius: "6px" }}>Labs</div>
            </div>
            <div style={{ borderTop: `1px solid ${COLORS.border}`, margin: "0.75rem 0", padding: "0 1rem", paddingTop: "0.75rem" }}>
              <p style={{ fontSize: "0.65rem", fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 0.5rem" }}>Connectors</p>
              <a href="/connectors" style={{ fontSize: "0.8rem", color: COLORS.accent, background: "rgba(99,102,241,0.1)", padding: "0.35rem 0.5rem", borderRadius: "6px", display: "block", fontWeight: 600, textDecoration: "none" }}>Connectors</a>
              <div style={{ fontSize: "0.8rem", color: COLORS.textSecondary, padding: "0.35rem 0.5rem", borderRadius: "6px" }}>GitHub</div>
            </div>
          </div>

          {/* Main Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
            <div style={{ maxWidth: "860px" }}>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.25rem", letterSpacing: "-0.02em" }}>Connectors</h1>
              <p style={{ fontSize: "0.875rem", color: COLORS.textSecondary, margin: "0 0 1.5rem" }}>Connect third-party services to supercharge your ZIVO AI apps.</p>

              {/* Search */}
              <div style={{ position: "relative", marginBottom: "2rem" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: COLORS.textMuted, pointerEvents: "none" }}>
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  className="zivo-input"
                  type="text"
                  placeholder="Search connectors..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: "100%", maxWidth: "320px", padding: "0.5rem 0.75rem 0.5rem 2.25rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textPrimary, fontSize: "0.875rem", transition: "border-color 0.2s" }}
                />
              </div>

              {/* Shared Connectors */}
              <div style={{ marginBottom: "2.5rem", animation: "fadeIn 0.4s ease" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 0.25rem" }}>Shared connectors</h2>
                <p style={{ fontSize: "0.8125rem", color: COLORS.textSecondary, margin: "0 0 1rem" }}>Add functionality to your apps.</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.875rem" }}>
                  {shared.map((c) => <ConnectorCard key={c.id} connector={c} />)}
                </div>
              </div>

              {/* Personal Connectors */}
              {personal.length > 0 && (
                <div style={{ animation: "fadeIn 0.5s ease" }}>
                  <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 0.25rem" }}>Personal connectors</h2>
                  <p style={{ fontSize: "0.8125rem", color: COLORS.textSecondary, margin: "0 0 1rem" }}>Your personal integrations.</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.875rem" }}>
                    {personal.map((c) => <ConnectorCard key={c.id} connector={c} />)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
