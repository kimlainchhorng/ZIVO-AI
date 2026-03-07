"use client";

import { useState } from "react";
import type { ComponentType, ComponentGeneratorResponse } from "@/app/api/component-generator/route";

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

interface ComponentDefinition {
  type: ComponentType;
  label: string;
  description: string;
  category: string;
  icon: string;
}

const COMPONENTS: ComponentDefinition[] = [
  // Layout
  { type: "navbar", label: "Navbar", description: "Top navigation bar with links, logo, and CTA", category: "Layout", icon: "☰" },
  { type: "sidebar", label: "Sidebar", description: "Collapsible side navigation with sections", category: "Layout", icon: "◧" },
  { type: "footer", label: "Footer", description: "Site footer with links, social icons, and copyright", category: "Layout", icon: "▬" },
  // Marketing
  { type: "hero", label: "Hero", description: "Full-width hero section with headline and CTA", category: "Marketing", icon: "🚀" },
  { type: "features", label: "Features", description: "Feature grid with icons, titles, and descriptions", category: "Marketing", icon: "⭐" },
  { type: "pricing", label: "Pricing", description: "Pricing cards with tiers, features, and CTAs", category: "Marketing", icon: "💰" },
  { type: "testimonials", label: "Testimonials", description: "Customer testimonial cards with avatars and quotes", category: "Marketing", icon: "💬" },
  // Data Display
  { type: "dashboard", label: "Dashboard", description: "Stats overview with KPI cards and chart placeholders", category: "Data Display", icon: "📊" },
  { type: "table", label: "Data Table", description: "Sortable, filterable data table with pagination", category: "Data Display", icon: "📋" },
  { type: "card", label: "Card", description: "Versatile content card with image, title, and actions", category: "Data Display", icon: "🃏" },
  // Forms
  { type: "form", label: "Form", description: "Multi-field form with validation and submit handler", category: "Forms", icon: "📝" },
  { type: "auth", label: "Auth", description: "Login / signup form with social auth options", category: "Forms", icon: "🔐" },
];

const CATEGORIES = Array.from(new Set(COMPONENTS.map((c) => c.category)));

type TabMode = "preview" | "code";

interface GeneratedComponent {
  type: ComponentType;
  response: ComponentGeneratorResponse;
}

export default function ComponentLibraryPage() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedComponent, setSelectedComponent] = useState<ComponentDefinition | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedComponent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabMode>("preview");
  const [style, setStyle] = useState<"minimal" | "modern" | "corporate" | "playful">("modern");
  const [copyLabel, setCopyLabel] = useState<"Copy" | "Copied!">("Copy");

  const filtered = activeCategory === "All"
    ? COMPONENTS
    : COMPONENTS.filter((c) => c.category === activeCategory);

  async function handleGenerate(comp: ComponentDefinition) {
    setSelectedComponent(comp);
    setGenerating(true);
    setError(null);
    setGenerated(null);
    setActiveTab("preview");

    try {
      const res = await fetch("/api/component-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ componentType: comp.type, style, darkMode: true }),
      });
      const data = await res.json() as ComponentGeneratorResponse & { error?: string };
      if (data.error) {
        setError(data.error);
      } else {
        setGenerated({ type: comp.type, response: data });
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setGenerating(false);
  }

  function handleCopy() {
    const code = generated?.response.files?.[0]?.content ?? "";
    navigator.clipboard.writeText(code).then(() => {
      setCopyLabel("Copied!");
      setTimeout(() => setCopyLabel("Copy"), 2000);
    }).catch(() => {});
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: COLORS.bg,
        color: COLORS.textPrimary,
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .comp-card:hover { background: rgba(255,255,255,0.06) !important; border-color: rgba(99,102,241,0.4) !important; }
        .comp-card { transition: background 0.15s, border-color 0.15s; }
        .zivo-btn:hover { opacity: 0.85; transform: scale(1.02); }
        .zivo-btn { transition: opacity 0.15s, transform 0.15s; }
        ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>

      {/* Top Nav */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          padding: "0 1.5rem",
          height: "52px",
          borderBottom: `1px solid ${COLORS.border}`,
          background: COLORS.bgPanel,
          flexShrink: 0,
        }}
      >
        <a
          href="/ai"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", color: COLORS.textSecondary, fontSize: "0.8125rem" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
          </svg>
          Builder
        </a>
        <div style={{ width: "1px", height: "18px", background: COLORS.border }} />
        <div style={{ width: "24px", height: "24px", background: COLORS.accentGradient, borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>Z</div>
        <span style={{ fontWeight: 700, fontSize: "0.9375rem" }}>Component Library</span>
        <div style={{ flex: 1 }} />
        {/* Style selector */}
        <label style={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>Style:</label>
        <select
          value={style}
          onChange={(e) => setStyle(e.target.value as typeof style)}
          style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "6px", color: COLORS.textPrimary, padding: "0.3rem 0.6rem", fontSize: "0.75rem", cursor: "pointer" }}
        >
          <option value="modern" style={{ background: COLORS.bgPanel }}>Modern</option>
          <option value="minimal" style={{ background: COLORS.bgPanel }}>Minimal</option>
          <option value="corporate" style={{ background: COLORS.bgPanel }}>Corporate</option>
          <option value="playful" style={{ background: COLORS.bgPanel }}>Playful</option>
        </select>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left: component browser */}
        <div
          style={{
            width: "320px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            borderRight: `1px solid ${COLORS.border}`,
            background: COLORS.bgPanel,
            overflow: "hidden",
          }}
        >
          {/* Category filter */}
          <div style={{ padding: "0.875rem 1rem", borderBottom: `1px solid ${COLORS.border}`, display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
            {["All", ...CATEGORIES].map((cat) => (
              <button
                key={cat}
                className="zivo-btn"
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "0.2rem 0.6rem",
                  borderRadius: "20px",
                  border: `1px solid ${activeCategory === cat ? "rgba(99,102,241,0.4)" : COLORS.border}`,
                  background: activeCategory === cat ? "rgba(99,102,241,0.12)" : "transparent",
                  color: activeCategory === cat ? COLORS.accent : COLORS.textSecondary,
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: activeCategory === cat ? 600 : 400,
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Component list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {filtered.map((comp) => (
                <div
                  key={comp.type}
                  className="comp-card"
                  style={{
                    background: selectedComponent?.type === comp.type ? "rgba(99,102,241,0.1)" : COLORS.bgCard,
                    border: `1px solid ${selectedComponent?.type === comp.type ? "rgba(99,102,241,0.35)" : COLORS.border}`,
                    borderRadius: "10px",
                    padding: "0.75rem",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    if (!generating) handleGenerate(comp);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (!generating) handleGenerate(comp); } }}
                  aria-label={`Generate ${comp.label} component`}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                    <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>{comp.icon}</span>
                    <span style={{ fontWeight: 600, fontSize: "0.875rem", color: COLORS.textPrimary }}>{comp.label}</span>
                    <span style={{ marginLeft: "auto", fontSize: "0.65rem", color: COLORS.textMuted, background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "4px", padding: "1px 5px" }}>{comp.category}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: COLORS.textSecondary, lineHeight: 1.5 }}>{comp.description}</p>
                  {generating && selectedComponent?.type === comp.type && (
                    <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: COLORS.accent }}>
                      <span style={{ display: "inline-block", width: "10px", height: "10px", border: "2px solid rgba(99,102,241,0.3)", borderTop: "2px solid #6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                      Generating…
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: preview & code */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: COLORS.bg }}>
          {!selectedComponent && !generating && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: "1rem",
                animation: "fadeIn 0.4s ease",
                color: COLORS.textMuted,
                textAlign: "center",
                padding: "2rem",
              }}
            >
              <div style={{ width: "72px", height: "72px", borderRadius: "18px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>🧩</div>
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.5rem", color: COLORS.textPrimary }}>Select a component</h2>
                <p style={{ fontSize: "0.875rem", margin: 0 }}>Click any component on the left to generate it with AI</p>
              </div>
              <div style={{ fontSize: "0.8125rem", color: COLORS.textMuted }}>
                {COMPONENTS.length} components available
              </div>
            </div>
          )}

          {(generating || generated) && (
            <>
              {/* Toolbar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0 1rem",
                  height: "48px",
                  borderBottom: `1px solid ${COLORS.border}`,
                  background: COLORS.bgPanel,
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: COLORS.textPrimary }}>
                  {selectedComponent?.icon} {selectedComponent?.label}
                </span>
                <div style={{ flex: 1 }} />
                {/* Tab switcher */}
                {["preview", "code"].map((tab) => (
                  <button
                    key={tab}
                    className="zivo-btn"
                    onClick={() => setActiveTab(tab as TabMode)}
                    style={{
                      padding: "0.3rem 0.75rem",
                      borderRadius: "6px",
                      border: "none",
                      background: activeTab === tab ? "rgba(99,102,241,0.15)" : "transparent",
                      color: activeTab === tab ? COLORS.accent : COLORS.textMuted,
                      cursor: "pointer",
                      fontSize: "0.8125rem",
                      fontWeight: 500,
                      textTransform: "capitalize",
                    }}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
                {generated && activeTab === "code" && (
                  <button
                    className="zivo-btn"
                    onClick={handleCopy}
                    style={{
                      padding: "0.3rem 0.75rem",
                      borderRadius: "6px",
                      background: COLORS.bgCard,
                      border: `1px solid ${COLORS.border}`,
                      color: COLORS.textSecondary,
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                    }}
                  >
                    {copyLabel === "Copied!" ? (
                      <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg> Copied!</>
                    ) : (
                      <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /></svg> Copy</>
                    )}
                  </button>
                )}
              </div>

              {/* Content */}
              {generating && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", gap: "1rem", flexDirection: "column" }}>
                  <span style={{ display: "inline-block", width: "36px", height: "36px", border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  <p style={{ color: COLORS.textSecondary, fontSize: "0.875rem" }}>Generating {selectedComponent?.label} component…</p>
                </div>
              )}

              {error && !generating && (
                <div style={{ padding: "1.5rem", animation: "fadeIn 0.3s ease" }}>
                  <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "0.75rem", color: "#ef4444", fontSize: "0.8125rem" }}>
                    {error}
                  </div>
                </div>
              )}

              {generated && !generating && (
                <>
                  {/* Summary */}
                  {generated.response.summary && (
                    <div style={{ padding: "0.5rem 1rem", borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, fontSize: "0.75rem", color: COLORS.textSecondary, flexShrink: 0 }}>
                      {generated.response.summary}
                    </div>
                  )}

                  {activeTab === "preview" && (
                    <div style={{ flex: 1, overflow: "auto", animation: "fadeIn 0.3s ease" }}>
                      {generated.response.previewHtml ? (
                        <iframe
                          srcDoc={generated.response.previewHtml}
                          title="Component Preview"
                          style={{ width: "100%", height: "100%", border: "none" }}
                          sandbox="allow-scripts"
                        />
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                            gap: "0.75rem",
                            color: COLORS.textMuted,
                            textAlign: "center",
                          }}
                        >
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                          <p style={{ fontSize: "0.8125rem" }}>No HTML preview. View source in the Code tab.</p>
                          <button
                            className="zivo-btn"
                            onClick={() => setActiveTab("code")}
                            style={{ padding: "0.35rem 0.75rem", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "6px", color: COLORS.accent, cursor: "pointer", fontSize: "0.75rem" }}
                          >
                            View Code
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "code" && (
                    <div style={{ flex: 1, overflow: "auto", padding: "1rem", animation: "fadeIn 0.3s ease" }}>
                      {generated.response.files.map((file) => (
                        <div key={file.path} style={{ marginBottom: "1rem" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              padding: "0.4rem 0.75rem",
                              background: COLORS.bgPanel,
                              borderRadius: "6px 6px 0 0",
                              border: `1px solid ${COLORS.border}`,
                              borderBottom: "none",
                              fontSize: "0.8125rem",
                              color: COLORS.textSecondary,
                              fontFamily: "monospace",
                            }}
                          >
                            {file.path}
                          </div>
                          <pre
                            style={{
                              margin: 0,
                              padding: "1rem",
                              background: "#020410",
                              border: `1px solid ${COLORS.border}`,
                              borderRadius: "0 0 6px 6px",
                              fontSize: "0.8125rem",
                              lineHeight: 1.7,
                              color: COLORS.textPrimary,
                              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                              overflowX: "auto",
                              whiteSpace: "pre",
                            }}
                          >
                            <code>{file.content}</code>
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
