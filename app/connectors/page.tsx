'use client';

import { useEffect, useState } from "react";

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

function GithubIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  );
}

function ConnectorCard({ connector, onConnect, isConnected }: { connector: Connector; onConnect: (id: string) => void; isConnected: boolean }) {
  const [hovered, setHovered] = useState(false);
  const clickable = connector.id === "github" || connector.id === "supabase";
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => clickable && onConnect(connector.id)}
      style={{
        background: COLORS.bgPanel,
        border: `1px solid ${hovered ? COLORS.borderHover : COLORS.border}`,
        borderRadius: "12px",
        padding: "1.25rem",
        cursor: clickable ? "pointer" : "default",
        transition: "border-color 0.15s",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      {(connector.id === "github" || connector.id === "supabase") && isConnected && (
        <span style={{ position: "absolute", top: "0.75rem", right: "0.75rem", fontSize: "0.7rem", fontWeight: 600, color: COLORS.success, background: "rgba(16,185,129,0.12)", padding: "2px 7px", borderRadius: "4px" }}>
          Connected
        </span>
      )}
      {(connector.id === "github" || connector.id === "supabase") && !isConnected && connector.enabled && (
        <span style={{ position: "absolute", top: "0.75rem", right: "0.75rem", fontSize: "0.7rem", fontWeight: 600, color: COLORS.accent, background: "rgba(99,102,241,0.12)", padding: "2px 7px", borderRadius: "4px" }}>
          Connect
        </span>
      )}
      {connector.id !== "github" && connector.id !== "supabase" && connector.enabled && (
        <span style={{ position: "absolute", top: "0.75rem", right: "0.75rem", fontSize: "0.7rem", fontWeight: 600, color: COLORS.success, background: "rgba(16,185,129,0.12)", padding: "2px 7px", borderRadius: "4px" }}>
          Enabled
        </span>
      )}
      {!connector.enabled && connector.id !== "github" && connector.id !== "supabase" && (
        <span style={{ position: "absolute", top: "0.75rem", right: "0.75rem", fontSize: "0.7rem", fontWeight: 600, color: COLORS.textMuted, background: "rgba(255,255,255,0.05)", padding: "2px 7px", borderRadius: "4px" }}>
          Soon
        </span>
      )}
      <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: connector.iconBg, border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: connector.iconColor, fontWeight: 700, fontSize: "0.875rem" }}>
        {connector.id === "github" ? <GithubIcon /> : connector.initials}
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: "0.9375rem", color: COLORS.textPrimary, marginBottom: "0.25rem" }}>{connector.name}</div>
        <div style={{ fontSize: "0.8125rem", color: COLORS.textSecondary }}>{connector.description}</div>
      </div>
    </div>
  );
}

type ConnectorState = {
  githubConnected: boolean;
  modalToken: string;
  modalRepo: string;
  supabaseConnected: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
};

function loadConnectorState(): ConnectorState {
  if (typeof window === "undefined") {
    return { githubConnected: false, modalToken: "", modalRepo: "", supabaseConnected: false, supabaseUrl: "", supabaseAnonKey: "" };
  }
  const token = localStorage.getItem("zivo_github_token") ?? "";
  const repo  = localStorage.getItem("zivo_github_repo") ?? "";
  const sbUrl = localStorage.getItem("supabase_url") ?? "";
  const sbKey = localStorage.getItem("supabase_anon_key") ?? "";
  return {
    githubConnected:   Boolean(token && repo),
    modalToken:        token,
    modalRepo:         repo,
    supabaseConnected: Boolean(sbUrl && sbKey),
    supabaseUrl:       sbUrl,
    supabaseAnonKey:   sbKey,
  };
}

export default function ConnectorsPage() {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [connState, setConnState] = useState<ConnectorState>({ githubConnected: false, modalToken: "", modalRepo: "", supabaseConnected: false, supabaseUrl: "", supabaseAnonKey: "" });
  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState("");

  // Supabase state
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [supabaseError, setSupabaseError] = useState("");
  const [supabaseTesting, setSupabaseTesting] = useState(false);

  useEffect(() => {
    setMounted(true);
    setConnState(loadConnectorState());
  }, []);

  function handleConnect(id: string) {
    if (id === "github") setShowModal(true);
    if (id === "supabase") setShowSupabaseModal(true);
  }

  function handleSaveGithub() {
    if (!connState.modalToken.trim()) { setModalError("Personal Access Token is required."); return; }
    if (!connState.modalRepo.trim() || !/^[^/]+\/[^/]+$/.test(connState.modalRepo.trim())) { setModalError("Repo must be in owner/repo format (e.g. myorg/myrepo)."); return; }
    localStorage.setItem("zivo_github_token", connState.modalToken.trim());
    localStorage.setItem("zivo_github_repo", connState.modalRepo.trim());
    setConnState(s => ({ ...s, githubConnected: true }));
    setShowModal(false);
    setModalError("");
  }

  function handleDisconnect() {
    localStorage.removeItem("zivo_github_token");
    localStorage.removeItem("zivo_github_repo");
    setConnState(s => ({ ...s, githubConnected: false, modalToken: "", modalRepo: "" }));
    setShowModal(false);
  }

  async function handleSaveSupabase() {
    if (!connState.supabaseUrl.trim()) {
      setSupabaseError("Supabase URL is required.");
      return;
    }
    if (!connState.supabaseAnonKey.trim()) {
      setSupabaseError("Supabase Anon Key is required.");
      return;
    }
    setSupabaseTesting(true);
    setSupabaseError("");
    try {
      const res = await fetch("/api/supabase-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supabaseUrl: connState.supabaseUrl.trim(), supabaseAnonKey: connState.supabaseAnonKey.trim() }),
      });
      const data = await res.json();
      if (data.connected) {
        localStorage.setItem("supabase_url", connState.supabaseUrl.trim());
        localStorage.setItem("supabase_anon_key", connState.supabaseAnonKey.trim());
        setConnState(s => ({ ...s, supabaseConnected: true }));
        setShowSupabaseModal(false);
        setSupabaseError("");
      } else {
        setSupabaseError(data.error || "Failed to connect to Supabase.");
      }
    } catch (err) {
      console.error("Supabase connection error:", err);
      setSupabaseError("Failed to connect to Supabase. Please check your credentials.");
    }
    setSupabaseTesting(false);
  }

  function handleDisconnectSupabase() {
    localStorage.removeItem("supabase_url");
    localStorage.removeItem("supabase_anon_key");
    setConnState(s => ({ ...s, supabaseConnected: false, supabaseUrl: "", supabaseAnonKey: "" }));
    setShowSupabaseModal(false);
  }

  const shared = CONNECTORS.filter((c) => !c.personal && c.name.toLowerCase().includes(search.toLowerCase()));
  const personal = CONNECTORS.filter((c) => c.personal && c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
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
              <div
                onClick={() => setShowModal(true)}
                style={{ fontSize: "0.8rem", color: mounted && connState.githubConnected ? COLORS.success : COLORS.textSecondary, padding: "0.35rem 0.5rem", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}
              >
                GitHub
                {mounted && connState.githubConnected && <span style={{ fontSize: "0.65rem", fontWeight: 600, color: COLORS.success, background: "rgba(16,185,129,0.12)", padding: "1px 5px", borderRadius: "3px" }}>●</span>}
              </div>
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
                  {shared.map((c) => (
                    <ConnectorCard
                      key={c.id}
                      connector={c}
                      onConnect={handleConnect}
                      isConnected={c.id === "github" ? (mounted && connState.githubConnected) : c.id === "supabase" ? (mounted && connState.supabaseConnected) : false}
                    />
                  ))}
                </div>
              </div>

              {/* Personal Connectors */}
              {personal.length > 0 && (
                <div style={{ animation: "fadeIn 0.5s ease" }}>
                  <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 0.25rem" }}>Personal connectors</h2>
                  <p style={{ fontSize: "0.8125rem", color: COLORS.textSecondary, margin: "0 0 1rem" }}>Your personal integrations.</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.875rem" }}>
                    {personal.map((c) => (
                      <ConnectorCard
                        key={c.id}
                        connector={c}
                        onConnect={handleConnect}
                        isConnected={false}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* GitHub Modal */}
      {showModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
        >
          <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: "16px", padding: "1.75rem", width: "100%", maxWidth: "440px", animation: "modalIn 0.2s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#1e1e1e", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f1f5f9" }}>
                <GithubIcon />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "1rem" }}>Connect GitHub</div>
                <div style={{ fontSize: "0.8125rem", color: COLORS.textSecondary }}>Push generated code directly to your repository</div>
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: COLORS.textSecondary, marginBottom: "0.4rem" }}>
                Personal Access Token
              </label>
              <input
                className="zivo-input"
                type="password"
                placeholder="ghp_xxxxxxxxxxxx"
                value={connState.modalToken}
                onChange={(e) => { setConnState(s => ({ ...s, modalToken: e.target.value })); setModalError(""); }}
                style={{ width: "100%", padding: "0.55rem 0.75rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textPrimary, fontSize: "0.875rem", transition: "border-color 0.2s" }}
              />
              <div style={{ fontSize: "0.75rem", color: COLORS.textMuted, marginTop: "0.35rem" }}>
                Needs <code style={{ color: COLORS.textSecondary }}>repo</code> scope.{" "}
                <a href="https://github.com/settings/tokens/new" target="_blank" rel="noreferrer" style={{ color: COLORS.accent, textDecoration: "none" }}>Create token →</a>
              </div>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: COLORS.textSecondary, marginBottom: "0.4rem" }}>
                Default Repository
              </label>
              <input
                className="zivo-input"
                type="text"
                placeholder="owner/repo-name"
                value={connState.modalRepo}
                onChange={(e) => { setConnState(s => ({ ...s, modalRepo: e.target.value })); setModalError(""); }}
                style={{ width: "100%", padding: "0.55rem 0.75rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textPrimary, fontSize: "0.875rem", transition: "border-color 0.2s" }}
              />
            </div>

            {modalError && (
              <div style={{ fontSize: "0.8125rem", color: "#ef4444", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", padding: "0.5rem 0.75rem", borderRadius: "6px", marginBottom: "1rem" }}>
                {modalError}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={handleSaveGithub}
                style={{ flex: 1, padding: "0.6rem", background: COLORS.accent, border: "none", borderRadius: "8px", color: "#fff", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}
              >
                {mounted && connState.githubConnected ? "Update" : "Connect"}
              </button>
              {mounted && connState.githubConnected && (
                <button
                  onClick={handleDisconnect}
                  style={{ padding: "0.6rem 1rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "8px", color: "#ef4444", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}
                >
                  Disconnect
                </button>
              )}
              <button
                onClick={() => { setShowModal(false); setModalError(""); }}
                style={{ padding: "0.6rem 1rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textSecondary, fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supabase Modal */}
      {showSupabaseModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) { setShowSupabaseModal(false); setSupabaseError(""); } }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
        >
          <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: "16px", padding: "1.75rem", width: "100%", maxWidth: "440px", animation: "modalIn 0.2s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#1a2a1a", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#3ecf8e", fontWeight: 700, fontSize: "0.875rem" }}>SB</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "1rem" }}>Connect Supabase</div>
                <div style={{ fontSize: "0.8125rem", color: COLORS.textSecondary }}>Connect your Supabase project for database &amp; auth</div>
              </div>
            </div>

            <div style={{ fontSize: "0.8125rem", color: COLORS.textSecondary, background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: "8px", padding: "0.65rem 0.75rem", marginBottom: "1.25rem" }}>
              Find your Project URL and anon key in your{" "}
              <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" style={{ color: COLORS.accent, textDecoration: "none" }}>Supabase dashboard</a>
              {" "}→ Settings → API.
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: COLORS.textSecondary, marginBottom: "0.4rem" }}>
                Project URL
              </label>
              <input
                className="zivo-input"
                type="text"
                placeholder="https://xxxxxxxxxxxx.supabase.co"
                value={connState.supabaseUrl}
                onChange={(e) => { setConnState(s => ({ ...s, supabaseUrl: e.target.value })); setSupabaseError(""); }}
                style={{ width: "100%", padding: "0.55rem 0.75rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textPrimary, fontSize: "0.875rem", transition: "border-color 0.2s" }}
              />
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: COLORS.textSecondary, marginBottom: "0.4rem" }}>
                Anon Key
              </label>
              <input
                className="zivo-input"
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={connState.supabaseAnonKey}
                onChange={(e) => { setConnState(s => ({ ...s, supabaseAnonKey: e.target.value })); setSupabaseError(""); }}
                style={{ width: "100%", padding: "0.55rem 0.75rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textPrimary, fontSize: "0.875rem", transition: "border-color 0.2s" }}
              />
            </div>

            {supabaseError && (
              <div style={{ fontSize: "0.8125rem", color: "#ef4444", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", padding: "0.5rem 0.75rem", borderRadius: "6px", marginBottom: "1rem" }}>
                {supabaseError}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={handleSaveSupabase}
                disabled={supabaseTesting}
                style={{ flex: 1, padding: "0.6rem", background: supabaseTesting ? "rgba(99,102,241,0.4)" : COLORS.accent, border: "none", borderRadius: "8px", color: "#fff", fontWeight: 600, fontSize: "0.875rem", cursor: supabaseTesting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
              >
                {supabaseTesting && <span style={{ display: "inline-block", width: "12px", height: "12px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />}
                {supabaseTesting ? "Verifying…" : (mounted && connState.supabaseConnected) ? "Update" : "Connect"}
              </button>
              {mounted && connState.supabaseConnected && (
                <button
                  onClick={handleDisconnectSupabase}
                  style={{ padding: "0.6rem 1rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "8px", color: "#ef4444", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}
                >
                  Disconnect
                </button>
              )}
              <button
                onClick={() => { setShowSupabaseModal(false); setSupabaseError(""); }}
                style={{ padding: "0.6rem 1rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textSecondary, fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

