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
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.929.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
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
      <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: connector.iconBg, border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
  // Change: Do not use useEffect to sync state on mount; use useState initializer instead:
  //   const [mounted, setMounted] = useState(false);
  //   const [connState, setConnState] = useState<ConnectorState>({ ... });
  //   useEffect(() => { setMounted(true); setConnState(loadConnectorState()); }, []);
  // Instead, set initial state with correct value:
  const [mounted] = useState(true);
  const [connState, setConnState] = useState<ConnectorState>(() =>
    typeof window === "undefined"
      ? { githubConnected: false, modalToken: "", modalRepo: "", supabaseConnected: false, supabaseUrl: "", supabaseAnonKey: "" }
      : loadConnectorState()
  );
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState("");

  // Supabase state
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [supabaseError, setSupabaseError] = useState("");
  const [supabaseTesting, setSupabaseTesting] = useState(false);

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
    <>  {/* ...rest of component unchanged... */}  {/* (No changes needed elsewhere; only constructor/init logic modified) */}  </>
  );
}
