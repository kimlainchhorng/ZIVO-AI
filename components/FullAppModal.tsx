'use client';

import { useState } from "react";

const COLORS = {
  bg: "rgba(0,0,0,0.85)",
  panel: "#0f1120",
  border: "rgba(255,255,255,0.1)",
  accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  success: "#10b981",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#475569",
  bgCard: "rgba(255,255,255,0.04)",
};

export type AppType = "saas" | "ecommerce" | "dashboard" | "blog" | "custom";

export interface FullAppOptions {
  appName: string;
  appType: AppType;
  features: Array<"auth" | "dashboard" | "database" | "api">;
  prompt: string;
}

interface FullAppModalProps {
  onClose: () => void;
  onConfirm: (options: FullAppOptions) => void;
  isLoading?: boolean;
}

const APP_TYPE_OPTIONS: Array<{ value: AppType; label: string; icon: string; description: string }> = [
  { value: "saas", label: "SaaS App", icon: "🚀", description: "Subscription-based app with auth, billing, and dashboard" },
  { value: "ecommerce", label: "E-commerce", icon: "🛒", description: "Online store with products, cart, and checkout" },
  { value: "dashboard", label: "Dashboard", icon: "📊", description: "Analytics dashboard with charts and data tables" },
  { value: "blog", label: "Blog / CMS", icon: "✍️", description: "Content platform with posts, tags, and comments" },
  { value: "custom", label: "Custom", icon: "⚙️", description: "Describe exactly what you want in the prompt" },
];

const FEATURE_OPTIONS: Array<{ value: "auth" | "dashboard" | "database" | "api"; label: string; icon: string }> = [
  { value: "auth", label: "Authentication", icon: "🔐" },
  { value: "dashboard", label: "Dashboard", icon: "📊" },
  { value: "database", label: "Database", icon: "🗄️" },
  { value: "api", label: "API Routes", icon: "🔌" },
];

const APP_TYPE_PROMPTS: Record<AppType, string> = {
  saas: "Build a complete SaaS application with user authentication, subscription management, a team dashboard, user settings, and billing integration with Stripe.",
  ecommerce: "Build an e-commerce store with product listings, product detail pages, shopping cart, checkout flow, order management, and user account pages.",
  dashboard: "Build an analytics dashboard with real-time statistics, interactive charts (line, bar, pie), data tables with filtering and sorting, and user management.",
  blog: "Build a blog platform with homepage listing posts, single post pages with markdown, categories, tags, author profiles, and an admin editor.",
  custom: "",
};

export default function FullAppModal({ onClose, onConfirm, isLoading = false }: FullAppModalProps) {
  const [appName, setAppName] = useState("");
  const [appType, setAppType] = useState<AppType>("saas");
  const [features, setFeatures] = useState<Array<"auth" | "dashboard" | "database" | "api">>(["auth", "dashboard", "database"]);
  const [prompt, setPrompt] = useState(APP_TYPE_PROMPTS.saas);

  function toggleFeature(f: "auth" | "dashboard" | "database" | "api") {
    setFeatures((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  }

  function handleAppTypeChange(type: AppType) {
    setAppType(type);
    if (APP_TYPE_PROMPTS[type]) {
      setPrompt(APP_TYPE_PROMPTS[type]);
    }
  }

  function handleConfirm() {
    if (!prompt.trim()) return;
    onConfirm({
      appName: appName.trim() || "My App",
      appType,
      features,
      prompt,
    });
  }

  return (
    <>
      <style>{`@keyframes modalFadeIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>
      <div
        style={{ position: "fixed", inset: 0, zIndex: 9999, background: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          style={{ width: "100%", maxWidth: "580px", background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: "16px", overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.8)", animation: "modalFadeIn 0.2s ease" }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", borderBottom: `1px solid ${COLORS.border}` }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: COLORS.textPrimary, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.25rem" }}>⚡</span> Build Full App
              </h2>
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: COLORS.textSecondary }}>
                Generate a complete multi-page app with all features
              </p>
            </div>
            <button onClick={onClose} style={{ background: "transparent", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: "1.375rem", lineHeight: 1 }}>×</button>
          </div>

          {/* Body */}
          <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem", maxHeight: "70vh", overflowY: "auto" }}>

            {/* App Name */}
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: COLORS.textSecondary, display: "block", marginBottom: "0.4rem" }}>
                App Name
              </label>
              <input
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="My Awesome App"
                style={{ width: "100%", padding: "0.5rem 0.75rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textPrimary, fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {/* App Type */}
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: COLORS.textSecondary, display: "block", marginBottom: "0.5rem" }}>
                App Type
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                {APP_TYPE_OPTIONS.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => handleAppTypeChange(opt.value)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleAppTypeChange(opt.value); } }}
                    style={{
                      padding: "0.65rem 0.875rem", borderRadius: "10px", cursor: "pointer",
                      background: appType === opt.value ? "rgba(99,102,241,0.12)" : COLORS.bgCard,
                      border: `1px solid ${appType === opt.value ? "rgba(99,102,241,0.4)" : COLORS.border}`,
                      transition: "border-color 0.15s, background 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
                      <span style={{ fontSize: "1rem" }}>{opt.icon}</span>
                      <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: appType === opt.value ? COLORS.accent : COLORS.textPrimary }}>{opt.label}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.7rem", color: COLORS.textMuted, lineHeight: 1.4 }}>{opt.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: COLORS.textSecondary, display: "block", marginBottom: "0.5rem" }}>
                Features
              </label>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {FEATURE_OPTIONS.map((opt) => {
                  const isSelected = features.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => toggleFeature(opt.value)}
                      style={{
                        padding: "0.35rem 0.75rem", borderRadius: "20px", cursor: "pointer",
                        background: isSelected ? "rgba(99,102,241,0.15)" : COLORS.bgCard,
                        border: `1px solid ${isSelected ? "rgba(99,102,241,0.4)" : COLORS.border}`,
                        color: isSelected ? COLORS.accent : COLORS.textSecondary,
                        fontSize: "0.8125rem", fontWeight: isSelected ? 600 : 400,
                        display: "flex", alignItems: "center", gap: "0.35rem",
                        transition: "border-color 0.15s, background 0.15s",
                      }}
                    >
                      <span>{opt.icon}</span>
                      {opt.label}
                      {isSelected && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prompt */}
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: COLORS.textSecondary, display: "block", marginBottom: "0.4rem" }}>
                Describe your app
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what your app does, its key features, target users, and any specific requirements..."
                rows={4}
                style={{ width: "100%", padding: "0.6rem 0.75rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textPrimary, fontSize: "0.875rem", resize: "vertical", outline: "none", lineHeight: 1.6, fontFamily: "inherit", boxSizing: "border-box" }}
              />
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: "flex", gap: "0.75rem", padding: "1rem 1.5rem", borderTop: `1px solid ${COLORS.border}` }}>
            <button
              onClick={onClose}
              style={{ flex: 1, padding: "0.6rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textSecondary, cursor: "pointer", fontSize: "0.875rem", fontWeight: 500 }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading || !prompt.trim()}
              style={{
                flex: 2, padding: "0.6rem", background: isLoading || !prompt.trim() ? "rgba(99,102,241,0.3)" : COLORS.accentGradient,
                border: "none", borderRadius: "8px", color: "#fff",
                cursor: isLoading || !prompt.trim() ? "not-allowed" : "pointer",
                fontSize: "0.875rem", fontWeight: 600,
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              }}
            >
              {isLoading ? (
                <>
                  <span style={{ display: "inline-block", width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  Generating Full App…
                </>
              ) : (
                <>
                  <span>⚡</span>
                  Generate Full App
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
