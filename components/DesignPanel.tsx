'use client';

import { useRef, useState } from "react";

const COLORS = {
  bg: "#0a0b14",
  bgPanel: "#0f1120",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#475569",
};

interface DesignPanelProps {
  onClose: () => void;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

const FONT_OPTIONS = [
  "Inter",
  "Plus Jakarta Sans",
  "Outfit",
  "DM Sans",
  "Geist",
  "Roboto",
  "Open Sans",
  "Poppins",
];

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#14b8a6",
  "#f59e0b", "#ef4444", "#10b981", "#3b82f6",
  "#f97316", "#06b6d4", "#84cc16", "#a855f7",
];

const RADIUS_OPTIONS = [
  { label: "None", value: "0px" },
  { label: "SM", value: "4px" },
  { label: "MD", value: "8px" },
  { label: "LG", value: "12px" },
  { label: "XL", value: "16px" },
  { label: "2XL", value: "24px" },
];

const SPACING_OPTIONS = [
  { label: "Compact", value: "0.75rem" },
  { label: "Default", value: "1rem" },
  { label: "Comfortable", value: "1.5rem" },
];

export default function DesignPanel({ onClose, iframeRef }: DesignPanelProps) {
  const [primaryColor, setPrimaryColor] = useState("#6366f1");
  const [secondaryColor, setSecondaryColor] = useState("#8b5cf6");
  const [bgColor, setBgColor] = useState("#0a0b14");
  const [textColor, setTextColor] = useState("#f1f5f9");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [borderRadius, setBorderRadius] = useState("8px");
  const [spacing, setSpacing] = useState("1rem");
  const [applied, setApplied] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  function injectCSSVariables() {
    try {
      const iframe = iframeRef.current;
      if (!iframe?.contentDocument?.documentElement) return;
      const root = iframe.contentDocument.documentElement;
      root.style.setProperty("--color-primary", primaryColor);
      root.style.setProperty("--color-secondary", secondaryColor);
      root.style.setProperty("--color-background", bgColor);
      root.style.setProperty("--color-text", textColor);
      root.style.setProperty("--font-family", fontFamily);
      root.style.setProperty("--border-radius", borderRadius);
      root.style.setProperty("--spacing-base", spacing);
      // Inject or update Google Fonts link when font changes
      const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;500;600;700&display=swap`;
      const existingFontLink = iframe.contentDocument.getElementById("__zivo_font__") as HTMLLinkElement | null;
      if (existingFontLink) {
        existingFontLink.href = fontUrl;
      } else {
        const link = iframe.contentDocument.createElement("link");
        link.id = "__zivo_font__";
        link.rel = "stylesheet";
        link.href = fontUrl;
        iframe.contentDocument.head.appendChild(link);
      }
    } catch {
      // cross-origin iframe; ignore
    }
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  }

  return (
    <>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
      <div
        ref={panelRef}
        style={{
          position: "fixed",
          top: "52px",
          right: 0,
          bottom: "28px",
          width: "320px",
          background: COLORS.bgPanel,
          borderLeft: `1px solid ${COLORS.border}`,
          display: "flex",
          flexDirection: "column",
          zIndex: 50,
          animation: "slideIn 0.2s ease",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.875rem 1rem", borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
          <span style={{ fontWeight: 600, fontSize: "0.9375rem", color: COLORS.textPrimary, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12.5" r="2.5"/></svg>
            Visual Design
          </span>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: "1.25rem", lineHeight: 1 }}>×</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Colors */}
          <section>
            <div style={{ fontSize: "0.7rem", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: "0.75rem" }}>Colors</div>

            {[
              { label: "Primary", value: primaryColor, set: setPrimaryColor },
              { label: "Secondary", value: secondaryColor, set: setSecondaryColor },
              { label: "Background", value: bgColor, set: setBgColor },
              { label: "Text", value: textColor, set: setTextColor },
            ].map(({ label, value, set }) => (
              <div key={label} style={{ marginBottom: "0.75rem" }}>
                <label style={{ fontSize: "0.8125rem", color: COLORS.textSecondary, display: "block", marginBottom: "0.35rem" }}>{label}</label>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    style={{ width: "36px", height: "36px", borderRadius: "8px", border: `1px solid ${COLORS.border}`, cursor: "pointer", padding: "2px", background: "transparent", flexShrink: 0 }}
                  />
                  <code style={{ fontSize: "0.8125rem", color: COLORS.textPrimary, fontFamily: "monospace", flex: 1 }}>{value}</code>
                </div>
              </div>
            ))}

            {/* Preset palette */}
            <div style={{ fontSize: "0.75rem", color: COLORS.textMuted, marginBottom: "0.35rem" }}>Quick palette (sets Primary)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setPrimaryColor(color)}
                  title={color}
                  style={{
                    width: "22px", height: "22px", borderRadius: "5px", background: color,
                    border: primaryColor === color ? "2px solid #fff" : "2px solid transparent",
                    cursor: "pointer", transition: "transform 0.1s",
                  }}
                />
              ))}
            </div>
          </section>

          {/* Typography */}
          <section>
            <div style={{ fontSize: "0.7rem", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: "0.75rem" }}>Typography</div>
            <label style={{ fontSize: "0.8125rem", color: COLORS.textSecondary, display: "block", marginBottom: "0.35rem" }}>Font Family</label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              style={{ width: "100%", padding: "0.4rem 0.65rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "6px", color: COLORS.textPrimary, fontSize: "0.875rem", cursor: "pointer" }}
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f} value={f} style={{ background: COLORS.bgPanel }}>{f}</option>
              ))}
            </select>
          </section>

          {/* Border Radius */}
          <section>
            <div style={{ fontSize: "0.7rem", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: "0.75rem" }}>Border Radius</div>
            <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
              {RADIUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setBorderRadius(opt.value)}
                  style={{
                    padding: "0.3rem 0.65rem", borderRadius: "6px", cursor: "pointer",
                    background: borderRadius === opt.value ? "rgba(99,102,241,0.15)" : COLORS.bgCard,
                    border: `1px solid ${borderRadius === opt.value ? "rgba(99,102,241,0.4)" : COLORS.border}`,
                    color: borderRadius === opt.value ? COLORS.accent : COLORS.textSecondary,
                    fontSize: "0.8125rem", fontWeight: 500,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: COLORS.textMuted }}>{borderRadius}</div>
          </section>

          {/* Spacing */}
          <section>
            <div style={{ fontSize: "0.7rem", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: "0.75rem" }}>Spacing Scale</div>
            <div style={{ display: "flex", gap: "0.375rem" }}>
              {SPACING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSpacing(opt.value)}
                  style={{
                    flex: 1, padding: "0.4rem 0.5rem", borderRadius: "6px", cursor: "pointer",
                    background: spacing === opt.value ? "rgba(99,102,241,0.15)" : COLORS.bgCard,
                    border: `1px solid ${spacing === opt.value ? "rgba(99,102,241,0.4)" : COLORS.border}`,
                    color: spacing === opt.value ? COLORS.accent : COLORS.textSecondary,
                    fontSize: "0.8125rem", fontWeight: 500,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Apply Button */}
        <div style={{ padding: "0.875rem 1rem", borderTop: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
          <button
            onClick={injectCSSVariables}
            style={{
              width: "100%", padding: "0.6rem", borderRadius: "8px", border: "none",
              background: applied ? "rgba(16,185,129,0.2)" : COLORS.accentGradient,
              color: applied ? "#10b981" : "#fff", cursor: "pointer",
              fontSize: "0.875rem", fontWeight: 600,
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
              transition: "background 0.2s, color 0.2s",
            }}
          >
            {applied ? (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Applied!</>
            ) : (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg> Apply to Preview</>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
