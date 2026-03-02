"use client";

import { useEffect, useState } from "react";

interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  downloads: number;
  rating: number;
  category: string;
  price: number;
  installed: boolean;
}

const s = {
  page: { minHeight: "100vh", background: "#0a0a0a", color: "#f0f0f0", padding: "32px" } as React.CSSProperties,
  header: { marginBottom: "32px" } as React.CSSProperties,
  title: { fontSize: 32, fontWeight: 900, margin: 0, color: "#fff" } as React.CSSProperties,
  subtitle: { color: "#888", marginTop: 8, fontSize: 16 } as React.CSSProperties,
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 } as React.CSSProperties,
  card: { background: "#111", borderRadius: 16, padding: 24, border: "1px solid #222" } as React.CSSProperties,
  cardName: { fontSize: 18, fontWeight: 800, color: "#fff", margin: 0 } as React.CSSProperties,
  cardMeta: { color: "#666", fontSize: 13, marginTop: 4 } as React.CSSProperties,
  cardDesc: { color: "#aaa", fontSize: 14, marginTop: 12, lineHeight: 1.5 } as React.CSSProperties,
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 } as React.CSSProperties,
  badge: { background: "#1a1a1a", color: "#888", fontSize: 12, padding: "4px 10px", borderRadius: 99 } as React.CSSProperties,
  installBtn: { padding: "8px 18px", borderRadius: 10, border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer" } as React.CSSProperties,
  stars: { color: "#f5a623", fontSize: 14 } as React.CSSProperties,
  loading: { color: "#888", textAlign: "center", marginTop: 80, fontSize: 18 } as React.CSSProperties,
};

export default function MarketplacePage() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/marketplace/plugins")
      .then((r) => r.json())
      .then((data) => {
        setPlugins(data.plugins ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleInstall(plugin: Plugin) {
    if (plugin.installed) return;
    setInstalling(plugin.id);
    await fetch("/api/marketplace/install", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pluginId: plugin.id, userId: "user-demo" }),
    });
    setPlugins((prev) => prev.map((p) => (p.id === plugin.id ? { ...p, installed: true } : p)));
    setInstalling(null);
  }

  if (loading) return <div style={s.page}><div style={s.loading}>Loading marketplace...</div></div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>Plugin Marketplace</h1>
        <p style={s.subtitle}>Extend ZIVO AI with powerful plugins</p>
      </div>
      <div style={s.grid}>
        {plugins.map((plugin) => (
          <div key={plugin.id} style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3 style={s.cardName}>{plugin.name}</h3>
                <div style={s.cardMeta}>by {plugin.author} · v{plugin.version}</div>
              </div>
              <span style={s.badge}>{plugin.category}</span>
            </div>
            <p style={s.cardDesc}>{plugin.description}</p>
            <div style={s.cardFooter}>
              <div>
                <span style={s.stars}>{"★".repeat(Math.round(plugin.rating))}</span>
                <span style={{ color: "#666", fontSize: 13, marginLeft: 6 }}>
                  {plugin.rating} · {plugin.downloads.toLocaleString()} installs
                </span>
              </div>
              <button
                style={{
                  ...s.installBtn,
                  background: plugin.installed ? "#1a3a1a" : "#6c47ff",
                  color: plugin.installed ? "#4caf50" : "#fff",
                  opacity: installing === plugin.id ? 0.6 : 1,
                }}
                onClick={() => handleInstall(plugin)}
                disabled={plugin.installed || installing === plugin.id}
              >
                {plugin.installed ? "Installed" : installing === plugin.id ? "Installing…" : plugin.price === 0 ? "Install Free" : `Install $${plugin.price}`}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
