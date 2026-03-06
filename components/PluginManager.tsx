"use client";

import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import type { Plugin } from "@/lib/plugins";

const THEME = {
  bg: "#0a0b14",
  panel: "#0f1120",
  accent: "#6366f1",
  border: "rgba(255,255,255,0.08)",
  textPrimary: "#f1f5f9",
  textMuted: "#94a3b8",
  success: "#22c55e",
  error: "#f87171",
};

interface InstallState {
  loading: boolean;
  installed: boolean;
  error: string | null;
  envVars: string[];
}

export default function PluginManager(): ReactElement {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [installState, setInstallState] = useState<Record<string, InstallState>>({});

  useEffect(() => {
    fetch("/api/plugins")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ plugins: Plugin[] }>;
      })
      .then(({ plugins: list }) => {
        setPlugins(list);
        const initial: Record<string, InstallState> = {};
        for (const p of list) {
          initial[p.id] = { loading: false, installed: p.installed, error: null, envVars: [] };
        }
        setInstallState(initial);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setFetchError(err instanceof Error ? err.message : "Failed to load plugins");
        setLoading(false);
      });
  }, []);

  async function handleInstall(pluginId: string): Promise<void> {
    setInstallState((prev) => ({
      ...prev,
      [pluginId]: { ...(prev[pluginId] ?? { loading: false, installed: false, error: null, envVars: [] }), loading: true, error: null },
    }));
    try {
      const res = await fetch("/api/plugins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "install", pluginId }),
      });
      const data = await res.json() as {
        success?: boolean;
        plugin?: Plugin;
        envVarsNeeded?: string[];
        error?: string;
      };
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Install failed");
      }
      setInstallState((prev) => ({
        ...prev,
        [pluginId]: {
          loading: false,
          installed: true,
          error: null,
          envVars: data.envVarsNeeded ?? [],
        },
      }));
    } catch (err: unknown) {
      setInstallState((prev) => ({
        ...prev,
        [pluginId]: {
          ...(prev[pluginId] ?? { loading: false, installed: false, error: null, envVars: [] }),
          loading: false,
          installed: false,
          error: err instanceof Error ? err.message : "Unknown error",
        },
      }));
    }
  }

  // Group plugins by category
  const categories = [...new Set(plugins.map((p) => p.category))];

  if (loading) {
    return (
      <div style={{ background: THEME.bg, minHeight: "100vh", padding: "2rem" }}>
        <p style={{ color: THEME.textMuted, textAlign: "center" }}>Loading plugins…</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div style={{ background: THEME.bg, minHeight: "100vh", padding: "2rem" }}>
        <p style={{ color: THEME.error, textAlign: "center" }}>Error: {fetchError}</p>
      </div>
    );
  }

  return (
    <div style={{ background: THEME.bg, minHeight: "100vh", padding: "2rem", fontFamily: "inherit" }}>
      <h1 style={{ color: THEME.textPrimary, fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        Plugin Manager
      </h1>
      <p style={{ color: THEME.textMuted, marginBottom: "2rem", fontSize: "0.875rem" }}>
        Browse and install integrations to extend your app.
      </p>

      {categories.map((category) => (
        <div key={category} style={{ marginBottom: "2rem" }}>
          <h2
            style={{
              color: THEME.textMuted,
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "1rem",
            }}
          >
            {category}
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1rem",
            }}
          >
            {plugins
              .filter((p) => p.category === category)
              .map((plugin) => {
                const state = installState[plugin.id] ?? {
                  loading: false,
                  installed: plugin.installed,
                  error: null,
                  envVars: [],
                };
                return (
                  <div
                    key={plugin.id}
                    style={{
                      background: THEME.panel,
                      border: `1px solid ${THEME.border}`,
                      borderRadius: "0.75rem",
                      padding: "1.25rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ fontSize: "1.75rem" }}>{plugin.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: THEME.textPrimary, fontWeight: 600, fontSize: "0.95rem" }}>
                          {plugin.name}
                        </div>
                        <span
                          style={{
                            background: "rgba(99,102,241,0.15)",
                            color: THEME.accent,
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: "9999px",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {plugin.category}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p style={{ color: THEME.textMuted, fontSize: "0.8125rem", margin: 0, lineHeight: 1.5 }}>
                      {plugin.description}
                    </p>

                    {/* Feature tags */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                      {plugin.tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            background: "rgba(255,255,255,0.05)",
                            color: THEME.textMuted,
                            fontSize: "0.7rem",
                            padding: "2px 8px",
                            borderRadius: "9999px",
                            border: `1px solid ${THEME.border}`,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Env vars count */}
                    <div style={{ color: THEME.textMuted, fontSize: "0.75rem" }}>
                      {plugin.envVarsNeeded.length} env var{plugin.envVarsNeeded.length !== 1 ? "s" : ""} needed
                      {" · "}
                      {plugin.generatedFiles.length} file{plugin.generatedFiles.length !== 1 ? "s" : ""} generated
                    </div>

                    {/* Install button */}
                    {state.installed ? (
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            color: THEME.success,
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                          }}
                        >
                          <span>✓</span> Installed
                        </div>
                        {state.envVars.length > 0 && (
                          <pre
                            style={{
                              marginTop: "0.75rem",
                              background: "rgba(0,0,0,0.3)",
                              border: `1px solid ${THEME.border}`,
                              borderRadius: "0.5rem",
                              padding: "0.75rem",
                              fontSize: "0.7rem",
                              color: "#a5f3fc",
                              overflowX: "auto",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {state.envVars.join("\n")}
                          </pre>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => void handleInstall(plugin.id)}
                        disabled={state.loading}
                        style={{
                          background: state.loading ? "rgba(99,102,241,0.4)" : THEME.accent,
                          color: "#fff",
                          border: "none",
                          borderRadius: "0.5rem",
                          padding: "0.5rem 1rem",
                          cursor: state.loading ? "not-allowed" : "pointer",
                          fontWeight: 600,
                          fontSize: "0.8125rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          width: "fit-content",
                        }}
                      >
                        {state.loading ? (
                          <>
                            <span
                              style={{
                                display: "inline-block",
                                width: "0.75rem",
                                height: "0.75rem",
                                border: "2px solid rgba(255,255,255,0.3)",
                                borderTopColor: "#fff",
                                borderRadius: "50%",
                                animation: "spin 0.6s linear infinite",
                              }}
                            />
                            Installing…
                          </>
                        ) : (
                          "Install"
                        )}
                      </button>
                    )}

                    {/* Error message */}
                    {state.error && (
                      <p style={{ color: THEME.error, fontSize: "0.75rem", margin: 0 }}>{state.error}</p>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      ))}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
