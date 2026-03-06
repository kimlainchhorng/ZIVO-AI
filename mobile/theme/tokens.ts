// mobile/theme/tokens.ts — Design tokens for the generated Expo Router app

export const colors = {
  // Brand
  primary: "#6366f1",
  primaryDark: "#4f46e5",
  primaryLight: "#818cf8",
  primaryAlpha10: "rgba(99,102,241,0.10)",
  primaryAlpha20: "rgba(99,102,241,0.20)",
  primaryAlpha40: "rgba(99,102,241,0.40)",

  // Backgrounds
  background: "#0a0b14",
  surface: "#0f1120",
  surfaceRaised: "#151728",
  card: "#1a1d2e",

  // Borders
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.16)",

  // Text
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#475569",

  // Semantic
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
} as const;

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
} as const;

export const typography = {
  fontFamily: {
    regular: "System",
    medium: "System",
    bold: "System",
  },
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    "2xl": 28,
    "3xl": 34,
  },
  fontWeight: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
} as const;

export const tokens = { colors, spacing, borderRadius, typography } as const;
export default tokens;
