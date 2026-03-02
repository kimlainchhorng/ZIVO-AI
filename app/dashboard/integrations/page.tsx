"use client";

import { useState } from "react";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  apiRoute?: string;
}

const INTEGRATIONS: Integration[] = [
  { id: "slack",   name: "Slack",   description: "Send notifications and alerts to your Slack channels.",        icon: "💬", connected: false, apiRoute: "/api/integrations/slack" },
  { id: "discord", name: "Discord", description: "Post updates to Discord servers and channels.",               icon: "🎮", connected: true  },
  { id: "github",  name: "GitHub",  description: "Push generated code directly to GitHub repositories.",        icon: "🐙", connected: true,  apiRoute: "/api/integrations/github-app" },
  { id: "vscode",  name: "VS Code", description: "Open and edit generated code in VS Code instantly.",          icon: "🔵", connected: false },
  { id: "figma",   name: "Figma",   description: "Import Figma designs and convert them to code.",              icon: "🎨", connected: false },
  { id: "notion",  name: "Notion",  description: "Export documentation and content directly to Notion.",        icon: "📝", connected: false },
  { id: "zapier",  name: "Zapier",  description: "Automate workflows by connecting ZIVO to 5,000+ apps.",      icon: "⚡", connected: false },
];

const s = {
  page: { minHeight: "100vh", background: "#0a0a0a", color: "#f0f0f0", padding: "32px" } as React.CSSProperties,
  title: { fontSize: 32, fontWeight: 900, margin: 0, color: "#fff" } as React.CSSProperties,
  subtitle: { color: "#888", marginTop: 8, fontSize: 16, marginBottom: 32 } as React.CSSProperties,
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 } as React.CSSProperties,
  card: { background: "#111", borderRadius: 16, padding: 24, border: "1px solid #222" } as React.CSSProperties,
  icon: { fontSize: 36, marginBottom: 12 } as React.CSSProperties,
  cardName: { fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 6 } as React.CSSProperties,
  cardDesc: { color: "#888", fontSize: 14, lineHeight: 1.5, marginBottom: 16 } as React.CSSProperties,
  footer: { display: "flex", justifyContent: "space-between", alignItems: "center" } as React.CSSProperties,
  status: { fontSize: 13, fontWeight: 700 } as React.CSSProperties,
  btn: { padding: "8px 18px", borderRadius: 10, border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer" } as React.CSSProperties,
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState(INTEGRATIONS);
  const [loading, setLoading] = useState<string | null>(null);

  async function toggle(integration: Integration) {
    setLoading(integration.id);
    if (integration.apiRoute) {
      await fetch(integration.apiRoute, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: integration.connected ? "disconnect" : "connect", token: "demo-token" }),
      });
    }
    setIntegrations((prev) => prev.map((i) => i.id === integration.id ? { ...i, connected: !i.connected } : i));
    setLoading(null);
  }

  return (
    <div style={s.page}>
      <h1 style={s.title}>Integrations</h1>
      <p style={s.subtitle}>Connect ZIVO AI with your favorite tools</p>
      <div style={s.grid}>
        {integrations.map((integration) => (
          <div key={integration.id} style={s.card}>
            <div style={s.icon}>{integration.icon}</div>
            <div style={s.cardName}>{integration.name}</div>
            <p style={s.cardDesc}>{integration.description}</p>
            <div style={s.footer}>
              <span style={{ ...s.status, color: integration.connected ? "#4caf50" : "#555" }}>
                {integration.connected ? "● Connected" : "○ Not connected"}
              </span>
              <button
                style={{
                  ...s.btn,
                  background: integration.connected ? "#1a1a1a" : "#6c47ff",
                  color: integration.connected ? "#f44336" : "#fff",
                  border: integration.connected ? "1px solid #333" : "none",
                  opacity: loading === integration.id ? 0.6 : 1,
                }}
                onClick={() => toggle(integration)}
                disabled={loading === integration.id}
              >
                {loading === integration.id ? "…" : integration.connected ? "Disconnect" : "Connect"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
