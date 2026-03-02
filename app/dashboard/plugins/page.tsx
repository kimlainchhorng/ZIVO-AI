"use client";

import { useState } from "react";

interface Plugin {
  id: string;
  name: string;
  version: string;
  category: string;
  enabled: boolean;
  updateAvailable: boolean;
}

const INSTALLED_PLUGINS: Plugin[] = [
  { id: "plugin-004", name: "Auth Scaffold",     version: "3.1.0", category: "Authentication", enabled: true,  updateAvailable: false },
  { id: "plugin-001", name: "SEO Optimizer",     version: "1.1.2", category: "SEO",            enabled: true,  updateAvailable: true  },
  { id: "plugin-006", name: "Payment Gateway",   version: "2.1.0", category: "E-commerce",     enabled: false, updateAvailable: true  },
];

const s = {
  page: { minHeight: "100vh", background: "#0a0a0a", color: "#f0f0f0", padding: "32px" } as React.CSSProperties,
  title: { fontSize: 32, fontWeight: 900, margin: 0, color: "#fff" } as React.CSSProperties,
  subtitle: { color: "#888", marginTop: 8, fontSize: 16, marginBottom: 32 } as React.CSSProperties,
  card: { background: "#111", borderRadius: 16, padding: 0, border: "1px solid #222", overflow: "hidden" } as React.CSSProperties,
  row: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #1a1a1a" } as React.CSSProperties,
  badge: { fontSize: 12, padding: "4px 10px", borderRadius: 99, background: "#1a1a1a", color: "#888" } as React.CSSProperties,
  actionBtn: { padding: "7px 14px", borderRadius: 8, border: "1px solid #333", background: "transparent", color: "#ccc", fontSize: 13, cursor: "pointer", marginLeft: 8 } as React.CSSProperties,
};

export default function PluginsPage() {
  const [plugins, setPlugins] = useState<Plugin[]>(INSTALLED_PLUGINS);

  function toggle(id: string) {
    setPlugins((prev) => prev.map((p) => p.id === id ? { ...p, enabled: !p.enabled } : p));
  }

  function update(id: string) {
    setPlugins((prev) => prev.map((p) => p.id === id ? { ...p, updateAvailable: false } : p));
  }

  function uninstall(id: string) {
    setPlugins((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div style={s.page}>
      <h1 style={s.title}>Plugin Manager</h1>
      <p style={s.subtitle}>Manage your installed plugins</p>

      {plugins.length === 0 && (
        <div style={{ color: "#666", textAlign: "center", marginTop: 60 }}>
          No plugins installed. <a href="/dashboard/marketplace" style={{ color: "#6c47ff" }}>Browse Marketplace →</a>
        </div>
      )}

      <div style={s.card}>
        {plugins.map((plugin, i) => (
          <div key={plugin.id} style={{ ...s.row, borderBottom: i === plugins.length - 1 ? "none" : "1px solid #1a1a1a" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{ width: 10, height: 10, borderRadius: "50%", background: plugin.enabled ? "#4caf50" : "#444" }}
              />
              <div>
                <div style={{ fontWeight: 700, color: "#fff" }}>{plugin.name}</div>
                <div style={{ color: "#666", fontSize: 13 }}>v{plugin.version} · {plugin.category}</div>
              </div>
              {plugin.updateAvailable && (
                <span style={{ ...s.badge, color: "#f5a623", background: "#2a2000" }}>Update Available</span>
              )}
            </div>
            <div>
              <button style={{ ...s.actionBtn, color: plugin.enabled ? "#f44336" : "#4caf50" }} onClick={() => toggle(plugin.id)}>
                {plugin.enabled ? "Disable" : "Enable"}
              </button>
              {plugin.updateAvailable && (
                <button style={{ ...s.actionBtn, color: "#6c47ff", borderColor: "#6c47ff" }} onClick={() => update(plugin.id)}>
                  Update
                </button>
              )}
              <button style={{ ...s.actionBtn, color: "#f44336", borderColor: "#f44336" }} onClick={() => uninstall(plugin.id)}>
                Uninstall
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24 }}>
        <a href="/dashboard/marketplace" style={{ color: "#6c47ff", textDecoration: "none", fontWeight: 700 }}>
          + Browse Marketplace
        </a>
      </div>
    </div>
  );
}
