// lib/design/tokens.ts — Shared design tokens for ZIVO-AI generated projects
// All generated website and mobile code should reference these tokens.

export const colors = {
  // Brand
  primary: "#6366f1",
  primaryDark: "#4f46e5",
  primaryLight: "#818cf8",
  primaryForeground: "#ffffff",

  // Neutrals
  background: "#0a0b14",
  surface: "#0f1120",
  surfaceRaised: "#151728",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.16)",

  // Text
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#475569",
  textInverse: "#0a0b14",

  // Semantic
  success: "#10b981",
  successBg: "rgba(16,185,129,0.1)",
  warning: "#f59e0b",
  warningBg: "rgba(245,158,11,0.1)",
  error: "#ef4444",
  errorBg: "rgba(239,68,68,0.1)",
  info: "#3b82f6",
  infoBg: "rgba(59,130,246,0.1)",

  // Gradient
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
} as const;

export const typography = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  headingFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontSize: {
    xs: "0.75rem",
    sm: "0.8125rem",
    base: "0.875rem",
    md: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
  },
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
  },
  lineHeight: {
    tight: "1.25",
    snug: "1.375",
    normal: "1.5",
    relaxed: "1.625",
  },
} as const;

export const spacing = {
  0: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
} as const;

export const borderRadius = {
  sm: "4px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  "2xl": "20px",
  full: "9999px",
} as const;

export const shadows = {
  sm: "0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)",
  md: "0 4px 12px rgba(0,0,0,0.4)",
  lg: "0 8px 24px rgba(0,0,0,0.5)",
  glow: "0 0 20px rgba(99,102,241,0.3)",
} as const;

export const tokens = { colors, typography, spacing, borderRadius, shadows } as const;

export type DesignTokens = typeof tokens;
export default tokens;
