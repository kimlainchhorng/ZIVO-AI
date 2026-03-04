'use client';

import { useState, useCallback } from "react";

export interface ThemeTokens {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  borderRadius: "none" | "sm" | "md" | "lg" | "full";
  style: "minimal" | "bold" | "playful" | "professional" | "dark";
}

export interface ThemeBuilderProps {
  onGenerate?: (tokens: ThemeTokens) => void;
  loading?: boolean;
}

const STYLE_OPTIONS: Array<{ value: ThemeTokens["style"]; label: string; desc: string }> = [
  { value: "minimal", label: "Minimal", desc: "Clean and simple" },
  { value: "bold", label: "Bold", desc: "High contrast" },
  { value: "playful", label: "Playful", desc: "Rounded, fun" },
  { value: "professional", label: "Professional", desc: "Corporate-ready" },
  { value: "dark", label: "Dark", desc: "Dark mode first" },
];

const FONT_OPTIONS = ["Inter", "Geist", "Roboto", "Poppins", "DM Sans", "Plus Jakarta Sans"];

const RADIUS_OPTIONS: Array<{ value: ThemeTokens["borderRadius"]; label: string }> = [
  { value: "none", label: "None" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "full", label: "Full" },
];

function ColorSwatch({ color, label, onChange }: { color: string; label: string; onChange: (v: string) => void }): React.ReactElement {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <label style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 500 }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: color,
            border: "2px solid rgba(255,255,255,0.15)",
            flexShrink: 0,
            cursor: "pointer",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }}
          />
        </div>
        <input
          type="text"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6,
            color: "#f1f5f9",
            padding: "0.3rem 0.5rem",
            fontSize: "0.8rem",
            width: 90,
            fontFamily: "monospace",
          }}
        />
      </div>
    </div>
  );
}

function PreviewCard({ tokens }: { tokens: ThemeTokens }): React.ReactElement {
  const radiusMap: Record<ThemeTokens["borderRadius"], string> = {
    none: "0px", sm: "4px", md: "8px", lg: "16px", full: "9999px",
  };
  const radius = radiusMap[tokens.borderRadius];

  return (
    <div
      style={{
        padding: "1.5rem",
        background: tokens.style === "dark" ? "#0a0b14" : "#ffffff",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.1)",
        fontFamily: tokens.fontFamily + ", system-ui, sans-serif",
      }}
    >
      <div style={{ marginBottom: "1rem" }}>
        <span
          style={{
            display: "inline-block",
            padding: "0.5rem 1rem",
            background: tokens.primaryColor,
            color: "#fff",
            borderRadius: radius,
            fontWeight: 600,
            fontSize: "0.875rem",
          }}
        >
          Primary Button
        </span>
        {" "}
        <span
          style={{
            display: "inline-block",
            padding: "0.5rem 1rem",
            background: tokens.secondaryColor,
            color: "#fff",
            borderRadius: radius,
            fontWeight: 600,
            fontSize: "0.875rem",
          }}
        >
          Secondary
        </span>
      </div>
      <div
        style={{
          padding: "1rem",
          background: tokens.accentColor + "20",
          borderRadius: radius,
          border: `1px solid ${tokens.accentColor}40`,
        }}
      >
        <p style={{ margin: 0, color: tokens.style === "dark" ? "#f1f5f9" : "#1e293b", fontSize: "0.875rem" }}>
          Accent card — {tokens.fontFamily} font, {tokens.style} style
        </p>
      </div>
    </div>
  );
}

export default function ThemeBuilder({ onGenerate, loading = false }: ThemeBuilderProps): React.ReactElement {
  const [tokens, setTokens] = useState<ThemeTokens>({
    primaryColor: "#6366f1",
    secondaryColor: "#8b5cf6",
    accentColor: "#06b6d4",
    fontFamily: "Inter",
    borderRadius: "md",
    style: "professional",
  });

  const update = useCallback(<K extends keyof ThemeTokens>(key: K, value: ThemeTokens[K]) => {
    setTokens((prev) => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "1.5rem",
        fontFamily: "'Inter',system-ui,sans-serif",
        color: "#f1f5f9",
      }}
    >
      {/* Controls */}
      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 600 }}>Design Tokens</h3>

        {/* Colors */}
        <div>
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Colors</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <ColorSwatch color={tokens.primaryColor} label="Primary" onChange={(v) => update("primaryColor", v)} />
            <ColorSwatch color={tokens.secondaryColor} label="Secondary" onChange={(v) => update("secondaryColor", v)} />
            <ColorSwatch color={tokens.accentColor} label="Accent" onChange={(v) => update("accentColor", v)} />
          </div>
        </div>

        {/* Font */}
        <div>
          <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Font Family</p>
          <select
            value={tokens.fontFamily}
            onChange={(e) => update("fontFamily", e.target.value)}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#f1f5f9", padding: "0.4rem 0.6rem", fontSize: "0.875rem", width: "100%" }}
          >
            {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        {/* Border Radius */}
        <div>
          <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Border Radius</p>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r.value}
                onClick={() => update("borderRadius", r.value)}
                style={{
                  padding: "0.3rem 0.6rem",
                  background: tokens.borderRadius === r.value ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${tokens.borderRadius === r.value ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 6,
                  color: tokens.borderRadius === r.value ? "#a5b4fc" : "#94a3b8",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Style */}
        <div>
          <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Style</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {STYLE_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => update("style", s.value)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.5rem 0.75rem",
                  background: tokens.style === s.value ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${tokens.style === s.value ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.06)"}`,
                  borderRadius: 8,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ fontWeight: 500, fontSize: "0.875rem", color: tokens.style === s.value ? "#a5b4fc" : "#f1f5f9" }}>{s.label}</span>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{s.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => onGenerate?.(tokens)}
          disabled={loading}
          style={{
            padding: "0.75rem 1.25rem",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            border: "none",
            borderRadius: 10,
            color: "#fff",
            fontWeight: 600,
            fontSize: "0.9rem",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Generating…" : "Generate Design System"}
        </button>
      </div>

      {/* Preview */}
      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
          padding: "1.25rem",
        }}
      >
        <h3 style={{ margin: "0 0 1rem", fontSize: "0.9375rem", fontWeight: 600 }}>Live Preview</h3>
        <PreviewCard tokens={tokens} />
      </div>
    </div>
  );
}
