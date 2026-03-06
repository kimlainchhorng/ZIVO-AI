"use client";

import { useState } from "react";
import type { ReactElement } from "react";

const THEME = {
  bg: "#0a0b14",
  panel: "#0f1120",
  accent: "#6366f1",
  border: "rgba(255,255,255,0.08)",
  textPrimary: "#f1f5f9",
  textMuted: "#94a3b8",
  success: "#22c55e",
};

interface Connector {
  id: string;
  name: string;
  description: string;
  icon: string;
  docsUrl: string;
  category: string;
}

const CONNECTORS: Connector[] = [
  {
    id: "github",
    name: "GitHub",
    description: "Connect your GitHub account to push code, create repos, and manage PRs.",
    icon: "🐙",
    docsUrl: "https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token",
    category: "Source Control",
  },
  {
    id: "vercel",
    name: "Vercel",
    description: "Deploy your projects directly to Vercel with one click.",
    icon: "▲",
    docsUrl: "https://vercel.com/docs/rest-api#authentication",
    category: "Deployment",
  },
  {
    id: "supabase",
    name: "Supabase",
    description: "Connect to your Supabase project for database, auth, and storage.",
    icon: "⚡",
    docsUrl: "https://supabase.com/docs/guides/api/api-keys",
    category: "Database",
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Enable payments, subscriptions, and billing in your app.",
    icon: "💳",
    docsUrl: "https://stripe.com/docs/keys",
    category: "Payments",
  },
  {
    id: "figma",
    name: "Figma",
    description: "Import designs from Figma and convert them to React components.",
    icon: "🎨",
    docsUrl: "https://www.figma.com/developers/api#access-tokens",
    category: "Design",
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "Use GPT-4o and other OpenAI models in your applications.",
    icon: "🤖",
    docsUrl: "https://platform.openai.com/api-keys",
    category: "AI",
  },
  {
    id: "resend",
    name: "Resend",
    description: "Send transactional and marketing emails with Resend.",
    icon: "📧",
    docsUrl: "https://resend.com/docs/api-reference/api-keys",
    category: "Email",
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    description: "Deploy to Cloudflare Pages and Workers at the edge.",
    icon: "🌐",
    docsUrl: "https://developers.cloudflare.com/fundamentals/api/get-started/create-token/",
    category: "Deployment",
  },
];

const STORAGE_KEY = "zivo_connectors";

function loadConnected(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveConnected(ids: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // ignore
  }
}

export default function ConnectorsPanel(): ReactElement {
  const [connected, setConnected] = useState<Set<string>>(() => loadConnected());

  function handleConnect(connector: Connector): void {
    if (connected.has(connector.id)) {
      // Disconnect
      const next = new Set(connected);
      next.delete(connector.id);
      setConnected(next);
      saveConnected(next);
    } else {
      // Mock OAuth: open docs in new tab, mark as connected
      window.open(connector.docsUrl, "_blank", "noopener,noreferrer");
      const next = new Set(connected);
      next.add(connector.id);
      setConnected(next);
      saveConnected(next);
    }
  }

  const categories = [...new Set(CONNECTORS.map((c) => c.category))];

  return (
    <div
      style={{
        background: THEME.bg,
        minHeight: "100vh",
        padding: "2rem",
        fontFamily: "inherit",
      }}
    >
      <h1
        style={{
          color: THEME.textPrimary,
          fontSize: "1.5rem",
          fontWeight: 700,
          marginBottom: "0.5rem",
        }}
      >
        Connectors
      </h1>
      <p style={{ color: THEME.textMuted, marginBottom: "2rem", fontSize: "0.875rem" }}>
        Connect your favorite services to unlock integrations across your workspace.
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
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1rem",
            }}
          >
            {CONNECTORS.filter((c) => c.category === category).map((connector) => {
              const isConnected = connected.has(connector.id);
              return (
                <div
                  key={connector.id}
                  style={{
                    background: THEME.panel,
                    border: `1px solid ${isConnected ? "rgba(34,197,94,0.3)" : THEME.border}`,
                    borderRadius: "0.75rem",
                    padding: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  {/* Header row */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span
                      style={{
                        fontSize: "1.75rem",
                        width: "2.5rem",
                        height: "2.5rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(255,255,255,0.05)",
                        borderRadius: "0.5rem",
                      }}
                    >
                      {connector.icon}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          color: THEME.textPrimary,
                          fontWeight: 600,
                          fontSize: "0.95rem",
                        }}
                      >
                        {connector.name}
                      </div>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: "9999px",
                          background: isConnected
                            ? "rgba(34,197,94,0.15)"
                            : "rgba(255,255,255,0.05)",
                          color: isConnected ? THEME.success : THEME.textMuted,
                        }}
                      >
                        {isConnected ? "Connected" : "Not connected"}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p
                    style={{
                      color: THEME.textMuted,
                      fontSize: "0.8125rem",
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    {connector.description}
                  </p>

                  {/* Action button */}
                  <button
                    onClick={() => handleConnect(connector)}
                    style={{
                      background: isConnected ? "rgba(255,255,255,0.05)" : THEME.accent,
                      color: isConnected ? THEME.textMuted : "#fff",
                      border: isConnected ? `1px solid ${THEME.border}` : "none",
                      borderRadius: "0.5rem",
                      padding: "0.5rem 1rem",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: "0.8125rem",
                      width: "fit-content",
                    }}
                  >
                    {isConnected ? "Disconnect" : "Connect"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
