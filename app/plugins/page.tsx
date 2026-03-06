'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const COLORS = {
  bg: "#0a0b14",
  bgPanel: "#0f1120",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  borderHover: "rgba(255,255,255,0.16)",
  accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#475569",
};

interface Plugin {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: string;
}

interface PluginInstallState {
  status: "idle" | "loading" | "success" | "error";
  files?: Array<{ path: string; content: string }>;
  setupInstructions?: string;
  requiredEnvVars?: string[];
  error?: string;
}

const PLUGINS: Plugin[] = [
  { id: "stripe", name: "Stripe", icon: "💳", description: "Payment processing, subscriptions, and billing management", category: "Payments" },
  { id: "supabase", name: "Supabase", icon: "⚡", description: "Open-source Firebase alternative with Postgres and realtime", category: "Database" },
  { id: "firebase", name: "Firebase", icon: "🔥", description: "Google's app development platform with auth and Firestore", category: "Database" },
  { id: "mapbox", name: "Mapbox", icon: "🗺️", description: "Interactive maps, geocoding, and location services", category: "Maps" },
  { id: "resend", name: "Resend", icon: "📧", description: "Email API built for developers with React Email templates", category: "Email" },
  { id: "openai", name: "OpenAI", icon: "🤖", description: "GPT-4o, embeddings, DALL-E, and Whisper APIs", category: "AI" },
  { id: "clerk", name: "Clerk", icon: "🔐", description: "Complete authentication and user management solution", category: "Auth" },
  { id: "prisma", name: "Prisma", icon: "🔷", description: "Next-generation ORM with type-safe database queries", category: "Database" },
  { id: "pusher", name: "Pusher", icon: "📡", description: "Real-time WebSocket infrastructure for live features", category: "Realtime" },
];

export default function PluginsPage() {
  const router = useRouter();
  const [installStates, setInstallStates] = useState<Record<string, PluginInstallState>>(
    Object.fromEntries(PLUGINS.map((p) => [p.id, { status: "idle" }]))
  );
  const [expandedPlugin, setExpandedPlugin] = useState<string | null>(null);

  async function handleInstall(plugin: Plugin) {
    setInstallStates((prev) => ({ ...prev, [plugin.id]: { status: "loading" } }));
    try {
      const res = await fetch("/api/generate-plugin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plugin: plugin.name }),
      });
      const data = await res.json();
      if (data.error) {
        setInstallStates((prev) => ({ ...prev, [plugin.id]: { status: "error", error: data.error } }));
      } else {
        setInstallStates((prev) => ({
          ...prev,
          [plugin.id]: {
            status: "success",
            files: data.files ?? [],
            setupInstructions: data.setupInstructions ?? "",
            requiredEnvVars: data.requiredEnvVars ?? [],
          },
        }));
        setExpandedPlugin(plugin.id);
      }
    } catch {
      setInstallStates((prev) => ({
        ...prev,
        [plugin.id]: { status: "error", error: "Installation failed" },
      }));
    }
  }

  function viewInBuilder(plugin: Plugin, state: PluginInstallState) {
    if (!state.files?.length) return;
    const builtPrompt = `I have these integration files for ${plugin.name}. Help me integrate them into my project:\n${state.files.map((f) => f.path).join(", ")}`;
    router.push(`/ai?prompt=${encodeURIComponent(builtPrompt)}`);
  }

  const categoryGroups = PLUGINS.reduce<Record<string, Plugin[]>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        .plugin-card:hover { border-color: rgba(99,102,241,0.4) !important; transform: translateY(-2px); }
        .plugin-btn:hover { opacity: 0.85 !important; }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: COLORS.bg, color: COLORS.textPrimary, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
        <div style={{ flex: 1, padding: '2rem', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
          <div style={{ marginBottom: '2rem', animation: 'fadeIn 0.4s ease' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>Plugin Marketplace</h1>
            <p style={{ fontSize: '0.9375rem', color: COLORS.textSecondary, margin: 0 }}>
              Install integrations and get production-ready boilerplate in seconds
            </p>
          </div>

          {Object.entries(categoryGroups).map(([category, plugins]) => (
            <div key={category} style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '0.75rem', fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
                {category}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {plugins.map((plugin, i) => {
                  const state = installStates[plugin.id];
                  const isExpanded = expandedPlugin === plugin.id && state.status === "success";

                  return (
                    <div
                      key={plugin.id}
                      className="plugin-card"
                      style={{
                        background: COLORS.bgCard, border: `1px solid ${state.status === "success" ? 'rgba(16,185,129,0.3)' : COLORS.border}`,
                        borderRadius: '12px', overflow: 'hidden', transition: 'all 0.2s ease',
                        animation: `fadeIn 0.3s ease ${i * 0.04}s both`,
                      }}
                    >
                      <div style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.625rem' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', flexShrink: 0 }}>
                            {plugin.icon}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: COLORS.textPrimary, margin: 0 }}>{plugin.name}</h3>
                          </div>
                          {state.status === "success" && (
                            <span style={{ fontSize: '0.75rem', color: COLORS.success, flexShrink: 0 }}>✓ Installed</span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.8125rem', color: COLORS.textSecondary, marginBottom: '0.875rem', lineHeight: 1.45 }}>
                          {plugin.description}
                        </p>

                        {state.status === "error" && state.error && (
                          <p style={{ fontSize: '0.75rem', color: COLORS.error, marginBottom: '0.5rem' }}>{state.error}</p>
                        )}

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="plugin-btn"
                            onClick={() => handleInstall(plugin)}
                            disabled={state.status === "loading"}
                            style={{
                              flex: 1, padding: '0.4375rem 0.875rem',
                              background: state.status === "success" ? 'rgba(16,185,129,0.1)' : COLORS.accentGradient,
                              border: state.status === "success" ? '1px solid rgba(16,185,129,0.3)' : 'none',
                              borderRadius: '6px', color: state.status === "success" ? COLORS.success : '#fff',
                              cursor: state.status === "loading" ? 'not-allowed' : 'pointer',
                              fontSize: '0.8125rem', fontWeight: 600, opacity: state.status === "loading" ? 0.7 : 1,
                              transition: 'opacity 0.15s',
                            }}
                          >
                            {state.status === "loading" ? "Installing…" : state.status === "success" ? "Reinstall" : "Install"}
                          </button>
                          {state.status === "success" && (
                            <button
                              className="plugin-btn"
                              onClick={() => setExpandedPlugin(isExpanded ? null : plugin.id)}
                              style={{
                                padding: '0.4375rem 0.875rem', background: COLORS.bgCard,
                                border: `1px solid ${COLORS.border}`, borderRadius: '6px',
                                color: COLORS.textSecondary, cursor: 'pointer', fontSize: '0.8125rem',
                                fontWeight: 500, transition: 'opacity 0.15s',
                              }}
                            >
                              {isExpanded ? 'Hide' : 'View'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expanded: files + instructions */}
                      {isExpanded && state.files && (
                        <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: '0.875rem', background: 'rgba(0,0,0,0.2)' }}>
                          {state.files.length > 0 && (
                            <div style={{ marginBottom: '0.75rem' }}>
                              <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.375rem' }}>Generated Files</p>
                              {state.files.map((f) => (
                                <div key={f.path} style={{ fontSize: '0.75rem', color: COLORS.accent, fontFamily: 'monospace', marginBottom: '2px' }}>
                                  {f.path}
                                </div>
                              ))}
                            </div>
                          )}
                          {state.requiredEnvVars && state.requiredEnvVars.length > 0 && (
                            <div style={{ marginBottom: '0.75rem' }}>
                              <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.375rem' }}>Required Env Vars</p>
                              {state.requiredEnvVars.map((v) => (
                                <div key={v} style={{ fontSize: '0.75rem', color: COLORS.warning, fontFamily: 'monospace', marginBottom: '2px' }}>
                                  {v}
                                </div>
                              ))}
                            </div>
                          )}
                          <button
                            className="plugin-btn"
                            onClick={() => viewInBuilder(plugin, state)}
                            style={{
                              width: '100%', padding: '0.375rem 0.75rem', background: COLORS.accentGradient,
                              border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer',
                              fontSize: '0.8125rem', fontWeight: 600, transition: 'opacity 0.15s',
                            }}
                          >
                            Open in Builder →
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
