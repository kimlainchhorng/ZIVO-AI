'use client';

import { useState } from "react";

interface ConnectorCard {
  id: string;
  name: string;
  description: string;
  icon: string;
  authType: "oauth" | "apikey";
  envKey?: string;
}

const CONNECTORS: ConnectorCard[] = [
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    description: "Voice AI — generate voice integration boilerplate for your app.",
    icon: "🎙️",
    authType: "apikey",
    envKey: "ELEVENLABS_API_KEY",
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Payments — generate Stripe checkout + webhook code.",
    icon: "💳",
    authType: "apikey",
    envKey: "STRIPE_SECRET_KEY",
  },
  {
    id: "github",
    name: "GitHub",
    description: "Two-way sync — view repo status and push/pull changes.",
    icon: "🐙",
    authType: "oauth",
  },
  {
    id: "supabase",
    name: "Supabase",
    description: "Database + auth — connect your Supabase project.",
    icon: "🗄️",
    authType: "apikey",
    envKey: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  },
  {
    id: "vercel",
    name: "Vercel",
    description: "One-click deployment to Vercel.",
    icon: "▲",
    authType: "apikey",
    envKey: "VERCEL_TOKEN",
  },
  {
    id: "netlify",
    name: "Netlify",
    description: "One-click deployment to Netlify.",
    icon: "🌐",
    authType: "apikey",
    envKey: "NETLIFY_TOKEN",
  },
];

export default function ConnectorsPage() {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [inputVisible, setInputVisible] = useState<Record<string, boolean>>({});
  const [oauthNotice, setOauthNotice] = useState<Record<string, boolean>>({});

  function handleConnect(connector: ConnectorCard) {
    if (connector.authType === "oauth") {
      setOauthNotice((prev) => ({ ...prev, [connector.id]: true }));
      return;
    }
    setInputVisible((prev) => ({ ...prev, [connector.id]: true }));
  }

  function handleSaveKey(connector: ConnectorCard) {
    const key = apiKeys[connector.id];
    if (!key?.trim()) return;
    localStorage.setItem(connector.envKey ?? connector.id, key.trim());
    setSaved((prev) => ({ ...prev, [connector.id]: true }));
    setInputVisible((prev) => ({ ...prev, [connector.id]: false }));
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>🔌 Connectors Hub</h1>
      <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
        Connect third-party services to supercharge your ZIVO AI apps.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {CONNECTORS.map((connector) => (
          <div
            key={connector.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "1.25rem",
              background: "#fff",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <div style={{ fontSize: "2rem" }}>{connector.icon}</div>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>{connector.name}</h2>
              <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: "0.25rem 0 0" }}>
                {connector.description}
              </p>
            </div>

            {saved[connector.id] ? (
              <div style={{ color: "#065f46", background: "#d1fae5", borderRadius: "6px", padding: "0.4rem 0.75rem", fontSize: "0.875rem" }}>
                ✅ Connected
              </div>
            ) : (
              <button
                onClick={() => handleConnect(connector)}
                style={{
                  padding: "0.5rem 1rem",
                  background: "#2563eb",
                  color: "#fff",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 500,
                  alignSelf: "flex-start",
                }}
              >
                Connect
              </button>
            )}

            {oauthNotice[connector.id] && (
              <div style={{ background: "#fffbeb", border: "1px solid #fbbf24", borderRadius: "6px", padding: "0.5rem 0.75rem", fontSize: "0.8rem", color: "#92400e" }}>
                ⚠️ OAuth flow for <strong>{connector.name}</strong> is not yet configured. Set up your OAuth app and add the callback URL, then store the token in <code>.env.local</code>.
                <button onClick={() => setOauthNotice((prev) => ({ ...prev, [connector.id]: false }))} style={{ marginLeft: "0.5rem", background: "none", border: "none", cursor: "pointer", color: "#92400e", fontWeight: 600 }}>✕</button>
              </div>
            )}

            {inputVisible[connector.id] && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ background: "#fef3c7", border: "1px solid #fbbf24", borderRadius: "6px", padding: "0.4rem 0.6rem", fontSize: "0.75rem", color: "#92400e" }}>
                  ⚠️ <strong>Security notice:</strong> API keys stored in localStorage can be accessed by any script on the page. For production, always store secrets in <code>.env.local</code> and never expose them to the browser.
                </div>
                <label style={{ fontSize: "0.75rem", color: "#374151" }}>
                  Enter API key:
                </label>
                <input
                  type="password"
                  value={apiKeys[connector.id] ?? ""}
                  onChange={(e) =>
                    setApiKeys((prev) => ({ ...prev, [connector.id]: e.target.value }))
                  }
                  placeholder={connector.envKey ?? "API key"}
                  style={{
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    padding: "0.4rem 0.6rem",
                    fontSize: "0.875rem",
                  }}
                />
                <button
                  onClick={() => handleSaveKey(connector)}
                  style={{
                    padding: "0.4rem 0.75rem",
                    background: "#059669",
                    color: "#fff",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                    alignSelf: "flex-start",
                    fontSize: "0.875rem",
                  }}
                >
                  Save Key
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
