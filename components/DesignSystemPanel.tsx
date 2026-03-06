'use client';

import { useState } from "react";
import type { DesignSystem } from "@/app/api/generate-design-system/route";

const COLORS_UI = {
  bg: "#0a0b14",
  bgPanel: "#0f1120",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  success: "#10b981",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#475569",
};

interface Props {
  onClose: () => void;
  onApply?: (cssVariables: string) => void;
}

const COLOR_KEYS: Array<keyof DesignSystem["colors"]> = [
  "primary",
  "secondary",
  "accent",
  "background",
  "foreground",
  "muted",
  "border",
];

export default function DesignSystemPanel({ onClose, onApply }: Props) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("modern");
  const [loading, setLoading] = useState(false);
  const [designSystem, setDesignSystem] = useState<DesignSystem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copyLabel, setCopyLabel] = useState<"copy" | "copied">("copy");
  const [activeTab, setActiveTab] = useState<"colors" | "typography" | "code">("colors");

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setDesignSystem(null);
    try {
      const res = await fetch("/api/generate-design-system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style }),
      });
      const data = await res.json() as DesignSystem & { error?: string };
      if (data.error) { setError(data.error); }
      else { setDesignSystem(data); setActiveTab("colors"); }
    } catch {
      setError("Failed to generate design system. Please try again.");
    }
    setLoading(false);
  }

  function handleCopyCSS() {
    if (!designSystem?.cssVariables) return;
    navigator.clipboard.writeText(designSystem.cssVariables).then(() => {
      setCopyLabel("copied");
      setTimeout(() => setCopyLabel("copy"), 2000);
    }).catch(() => {});
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1rem",
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "100%", maxWidth: "640px",
        background: COLORS_UI.bgPanel,
        border: `1px solid ${COLORS_UI.border}`,
        borderRadius: "16px",
        overflow: "hidden",
        display: "flex", flexDirection: "column",
        maxHeight: "90vh",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        animation: "fadeIn 0.2s ease",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: `1px solid ${COLORS_UI.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS_UI.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12.5" r="2.5"/><path d="M12 20.9a9.1 9.1 0 0 1-4.8-7.5A2 2 0 0 1 8 11.5c.6-.4 1.2-.5 1.8-.3C11.1 11.7 12 12.9 12 14.3c0 1.4 1.3 2.5 2.7 2.1 1.3-.4 2.1-1.8 1.7-3.1l-.7-2.8A7 7 0 0 1 21 17a9 9 0 0 1-9 4z"/></svg>
            <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>Design System Generator</span>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: COLORS_UI.textMuted, cursor: "pointer", fontSize: "1.25rem", padding: "0 0.25rem" }}>×</button>
        </div>

        {/* Prompt + Generate */}
        <div style={{ padding: "1rem 1.25rem", borderBottom: `1px solid ${COLORS_UI.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleGenerate(); }}
              placeholder="Describe your project (e.g. 'modern fintech SaaS')"
              style={{ flex: 1, background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: "8px", padding: "0.45rem 0.65rem", color: COLORS_UI.textPrimary, fontSize: "0.8125rem", outline: "none" }}
            />
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              style={{ background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: "8px", padding: "0.45rem 0.65rem", color: COLORS_UI.textPrimary, fontSize: "0.8125rem", cursor: "pointer" }}
            >
              {["modern", "minimal", "bold", "pastel", "dark", "corporate"].map((s) => (
                <option key={s} value={s} style={{ background: COLORS_UI.bgPanel }}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              style={{ padding: "0.45rem 1rem", background: loading || !prompt.trim() ? "rgba(99,102,241,0.3)" : COLORS_UI.accentGradient, border: "none", borderRadius: "8px", color: "#fff", cursor: loading || !prompt.trim() ? "not-allowed" : "pointer", fontSize: "0.8125rem", fontWeight: 600, whiteSpace: "nowrap" }}
            >
              {loading ? (
                <span style={{ display: "inline-block", width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", verticalAlign: "middle" }} />
              ) : "Generate"}
            </button>
          </div>
          {error && <div style={{ color: "#ef4444", fontSize: "0.8125rem" }}>{error}</div>}
        </div>

        {/* Tabs */}
        {designSystem && (
          <div style={{ display: "flex", gap: "4px", padding: "0.5rem 1.25rem 0", flexShrink: 0 }}>
            {(["colors", "typography", "code"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{ padding: "0.3rem 0.75rem", borderRadius: "6px 6px 0 0", border: "none", background: activeTab === tab ? COLORS_UI.bgCard : "transparent", color: activeTab === tab ? COLORS_UI.textPrimary : COLORS_UI.textMuted, cursor: "pointer", fontSize: "0.8125rem", fontWeight: activeTab === tab ? 600 : 400, borderBottom: activeTab === tab ? `2px solid ${COLORS_UI.accent}` : "2px solid transparent" }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.25rem 1.25rem" }}>
          {!designSystem && !loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "200px", gap: "0.75rem", color: COLORS_UI.textMuted, textAlign: "center" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12.5" r="2.5"/></svg>
              <p style={{ fontSize: "0.875rem" }}>Enter a description and click Generate to create your design system</p>
            </div>
          )}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "200px", gap: "1rem" }}>
              <span style={{ display: "inline-block", width: "36px", height: "36px", border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <p style={{ color: COLORS_UI.textSecondary, fontSize: "0.875rem" }}>Generating design system…</p>
            </div>
          )}

          {designSystem && activeTab === "colors" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <p style={{ margin: 0, fontSize: "0.8125rem", color: COLORS_UI.textSecondary }}><strong style={{ color: COLORS_UI.textPrimary }}>{designSystem.name}</strong></p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.5rem" }}>
                {COLOR_KEYS.map((key) => {
                  const scale = designSystem.colors[key];
                  if (!scale) return null;
                  return (
                    <div key={key} style={{ background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: "10px", overflow: "hidden" }}>
                      <div style={{ display: "flex", height: "40px" }}>
                        <div style={{ flex: 1, background: scale.light }} title={`light: ${scale.light}`} />
                        <div style={{ flex: 1, background: scale.DEFAULT }} title={`default: ${scale.DEFAULT}`} />
                        <div style={{ flex: 1, background: scale.dark }} title={`dark: ${scale.dark}`} />
                      </div>
                      <div style={{ padding: "0.4rem 0.5rem" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: COLORS_UI.textPrimary, textTransform: "capitalize" }}>{key}</div>
                        <div style={{ fontSize: "0.65rem", color: COLORS_UI.textMuted, fontFamily: "monospace" }}>{scale.DEFAULT}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {designSystem && activeTab === "typography" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: "10px", padding: "1rem" }}>
                <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", color: COLORS_UI.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Heading</p>
                <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: COLORS_UI.textPrimary, fontFamily: designSystem.fonts.heading }}>The quick brown fox</p>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: COLORS_UI.textMuted, fontFamily: "monospace" }}>{designSystem.fonts.heading}</p>
              </div>
              <div style={{ background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: "10px", padding: "1rem" }}>
                <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", color: COLORS_UI.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Body</p>
                <p style={{ margin: 0, fontSize: "1rem", color: COLORS_UI.textSecondary, fontFamily: designSystem.fonts.sans, lineHeight: 1.6 }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: COLORS_UI.textMuted, fontFamily: "monospace" }}>{designSystem.fonts.sans}</p>
              </div>
              <div style={{ background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: "10px", padding: "1rem" }}>
                <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", color: COLORS_UI.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Mono</p>
                <p style={{ margin: 0, fontSize: "0.875rem", color: COLORS_UI.textPrimary, fontFamily: designSystem.fonts.mono }}>const answer = 42;</p>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: COLORS_UI.textMuted, fontFamily: "monospace" }}>{designSystem.fonts.mono}</p>
              </div>
              <div style={{ background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: "8px", padding: "0.75rem" }}>
                <span style={{ fontSize: "0.75rem", color: COLORS_UI.textMuted }}>Border radius: </span>
                <span style={{ fontSize: "0.8125rem", color: COLORS_UI.textPrimary, fontFamily: "monospace" }}>{designSystem.borderRadius}</span>
              </div>
            </div>
          )}

          {designSystem && activeTab === "code" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ background: "#000", border: `1px solid ${COLORS_UI.border}`, borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0.75rem", borderBottom: `1px solid ${COLORS_UI.border}`, background: COLORS_UI.bgCard }}>
                  <span style={{ fontSize: "0.75rem", color: COLORS_UI.textMuted }}>globals.css — CSS Variables</span>
                  <button onClick={handleCopyCSS} style={{ padding: "0.2rem 0.5rem", background: "transparent", border: `1px solid ${COLORS_UI.border}`, borderRadius: "4px", color: COLORS_UI.textSecondary, cursor: "pointer", fontSize: "0.7rem" }}>
                    {copyLabel === "copied" ? "✓ Copied" : "Copy"}
                  </button>
                </div>
                <pre style={{ margin: 0, padding: "0.75rem", fontSize: "0.75rem", color: "#a5f3fc", fontFamily: "monospace", overflow: "auto", whiteSpace: "pre-wrap", maxHeight: "200px" }}>
                  {designSystem.cssVariables}
                </pre>
              </div>
              <div style={{ background: "#000", border: `1px solid ${COLORS_UI.border}`, borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", padding: "0.5rem 0.75rem", borderBottom: `1px solid ${COLORS_UI.border}`, background: COLORS_UI.bgCard }}>
                  <span style={{ fontSize: "0.75rem", color: COLORS_UI.textMuted }}>tailwind.config.ts — Theme extension</span>
                </div>
                <pre style={{ margin: 0, padding: "0.75rem", fontSize: "0.75rem", color: "#bbf7d0", fontFamily: "monospace", overflow: "auto", whiteSpace: "pre-wrap", maxHeight: "200px" }}>
                  {designSystem.tailwindConfig}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {designSystem && (
          <div style={{ padding: "0.875rem 1.25rem", borderTop: `1px solid ${COLORS_UI.border}`, display: "flex", gap: "0.5rem", flexShrink: 0 }}>
            <button
              onClick={() => onApply && onApply(designSystem.cssVariables)}
              style={{ flex: 1, padding: "0.55rem", background: COLORS_UI.accentGradient, border: "none", borderRadius: "8px", color: "#fff", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600 }}
            >
              Apply to Project
            </button>
            <button
              onClick={handleCopyCSS}
              style={{ padding: "0.55rem 0.875rem", background: COLORS_UI.bgCard, border: `1px solid ${COLORS_UI.border}`, borderRadius: "8px", color: COLORS_UI.textSecondary, cursor: "pointer", fontSize: "0.875rem" }}
            >
              {copyLabel === "copied" ? "✓ Copied" : "Copy CSS"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
