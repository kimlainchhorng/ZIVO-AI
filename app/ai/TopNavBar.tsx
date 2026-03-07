import { COLORS } from "./colors";

const SUPABASE_TOKEN_KEY = "zivo_supabase_token";

interface TopNavBarProps {
  pathname: string;
  loading: boolean;
  chatOpen: boolean;
  setChatOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  supabaseUserEmail: string | null;
  setSupabaseToken: (value: string | null) => void;
  setSupabaseUserEmail: (value: string | null) => void;
  setSavedProjectId: (value: string | null) => void;
}

export default function TopNavBar({
  pathname,
  loading,
  chatOpen,
  setChatOpen,
  supabaseUserEmail,
  setSupabaseToken,
  setSupabaseUserEmail,
  setSavedProjectId,
}: TopNavBarProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1.5rem", height: "48px", borderBottom: `1px solid ${COLORS.border}`, background: "#0a0b14", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{ width: "28px", height: "28px", background: COLORS.accentGradient, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700 }}>Z</div>
        <span style={{ fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.01em" }}>ZIVO AI</span>
        <div style={{ width: "1px", height: "20px", background: COLORS.border, margin: "0 0.25rem" }} />
        <nav style={{ display: "flex", gap: "0.25rem" }}>
          {([["Builder", "/ai"], ["Workflow", "/workflow"], ["Templates", "/templates"], ["History", "/history"], ["Connectors", "/connectors"]] as const).map(([label, href]) => {
            const isActive = pathname === href;
            return (
              <a
                key={href}
                href={href}
                className="zivo-nav"
                style={{ padding: "0.25rem 0.75rem", background: isActive ? "rgba(99,102,241,0.15)" : "transparent", color: isActive ? COLORS.accent : COLORS.textSecondary, borderRadius: "6px", border: isActive ? `1px solid rgba(99,102,241,0.3)` : "1px solid transparent", cursor: "pointer", fontSize: "0.8125rem", fontWeight: 500, transition: "color 0.15s", textDecoration: "none", display: "inline-flex", alignItems: "center" }}
              >
                {label}
              </a>
            );
          })}
        </nav>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: loading ? COLORS.warning : COLORS.success, boxShadow: `0 0 6px ${loading ? COLORS.warning : COLORS.success}`, animation: loading ? "statusBlink 1.5s ease-in-out infinite" : "none" }} aria-hidden="true" />
        <span style={{ fontSize: "0.75rem", color: COLORS.textSecondary }} aria-live="polite" aria-label={loading ? "Building project" : "Ready to build"}>{loading ? "Building..." : "Ready"}</span>
        <button
          className="zivo-btn"
          onClick={() => setChatOpen((o) => !o)}
          title="AI Chat"
          style={{ padding: "0.3rem 0.65rem", background: chatOpen ? "rgba(99,102,241,0.15)" : COLORS.bgCard, border: `1px solid ${chatOpen ? "rgba(99,102,241,0.4)" : COLORS.border}`, borderRadius: "6px", color: chatOpen ? COLORS.accent : COLORS.textSecondary, cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.35rem" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Chat
        </button>
        {supabaseUserEmail ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: COLORS.accentGradient, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer" }} title={supabaseUserEmail}>
              {supabaseUserEmail.charAt(0).toUpperCase()}
            </div>
            <button
              className="zivo-btn"
              onClick={() => {
                localStorage.removeItem(SUPABASE_TOKEN_KEY);
                setSupabaseToken(null);
                setSupabaseUserEmail(null);
                setSavedProjectId(null);
              }}
              style={{ padding: "0.3rem 0.65rem", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: "6px", color: COLORS.textMuted, cursor: "pointer", fontSize: "0.75rem" }}
            >
              Sign out
            </button>
          </div>
        ) : (
          <a
            href="/auth?next=/ai"
            style={{ padding: "0.3rem 0.75rem", background: COLORS.accentGradient, borderRadius: "6px", color: "#fff", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
          >
            Sign In
          </a>
        )}
      </div>
    </div>
  );
}
