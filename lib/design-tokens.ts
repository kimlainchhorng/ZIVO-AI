// lib/design-tokens.ts — Design Token System

export interface BrandConfig {
  primaryColor: string; // hex color, e.g. "#3B82F6"
  brandName?: string;
  style?: "modern" | "playful" | "corporate" | "minimal";
}

export interface ColorScale {
  "50": string;
  "100": string;
  "200": string;
  "300": string;
  "400": string;
  "500": string;
  "600": string;
  "700": string;
  "800": string;
  "900": string;
  "950": string;
}

export interface DesignTokens {
  colors: {
    primary: ColorScale;
    secondary: ColorScale;
    accent: ColorScale;
    neutral: ColorScale;
  };
  spacing: Record<string, string>;
  typography: {
    fontSizes: Record<string, string>;
    fontWeights: Record<string, string>;
    lineHeights: Record<string, string>;
  };
  shadows: Record<string, string>;
  borderRadius: Record<string, string>;
}

export interface TailwindConfig {
  extend: {
    colors: Record<string, Record<string, string>>;
    spacing: Record<string, string>;
    fontSize: Record<string, string>;
    boxShadow: Record<string, string>;
    borderRadius: Record<string, string>;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  const a = (s * Math.min(l, 100 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color / 100).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function generateScale(baseHex: string, hueShift = 0): ColorScale {
  const [h, s] = hexToHsl(baseHex);
  const hue = (h + hueShift + 360) % 360;
  const lightnesses = [97, 94, 87, 76, 62, 48, 38, 28, 20, 14, 9];
  const keys = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"] as const;
  const scale = {} as ColorScale;
  keys.forEach((k, i) => { scale[k] = hslToHex(hue, Math.min(s + 5, 100), lightnesses[i]); });
  return scale;
}

/**
 * Generates a complete set of design tokens from a brand configuration.
 */
export function generateTokens(brand: BrandConfig): DesignTokens {
  const primary = generateScale(brand.primaryColor, 0);
  const secondary = generateScale(brand.primaryColor, 120);
  const accent = generateScale(brand.primaryColor, 240);
  const neutral = generateScale("#6B7280", 0);

  return {
    colors: { primary, secondary, accent, neutral },
    spacing: {
      "0": "0px", "1": "4px", "2": "8px", "3": "12px", "4": "16px",
      "5": "20px", "6": "24px", "8": "32px", "10": "40px", "12": "48px",
      "16": "64px", "20": "80px", "24": "96px", "32": "128px",
    },
    typography: {
      fontSizes: {
        xs: "0.75rem", sm: "0.875rem", base: "1rem", lg: "1.125rem",
        xl: "1.25rem", "2xl": "1.5rem", "3xl": "1.875rem", "4xl": "2.25rem",
        "5xl": "3rem", "6xl": "3.75rem",
      },
      fontWeights: {
        thin: "100", light: "300", normal: "400", medium: "500",
        semibold: "600", bold: "700", extrabold: "800", black: "900",
      },
      lineHeights: {
        none: "1", tight: "1.25", snug: "1.375", normal: "1.5", relaxed: "1.625", loose: "2",
      },
    },
    shadows: {
      sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
      md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
      xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
      "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    },
    borderRadius: {
      none: "0px", sm: "0.125rem", DEFAULT: "0.25rem", md: "0.375rem",
      lg: "0.5rem", xl: "0.75rem", "2xl": "1rem", "3xl": "1.5rem", full: "9999px",
    },
  };
}

/**
 * Converts DesignTokens to CSS custom properties string.
 */
export function tokensToCSS(tokens: DesignTokens): string {
  const lines: string[] = [":root {"];

  // Colors
  for (const [palette, scale] of Object.entries(tokens.colors)) {
    for (const [shade, value] of Object.entries(scale)) {
      lines.push(`  --color-${palette}-${shade}: ${value};`);
    }
  }
  // Spacing
  for (const [k, v] of Object.entries(tokens.spacing)) {
    lines.push(`  --spacing-${k}: ${v};`);
  }
  // Typography
  for (const [k, v] of Object.entries(tokens.typography.fontSizes)) {
    lines.push(`  --font-size-${k}: ${v};`);
  }
  // Shadows
  for (const [k, v] of Object.entries(tokens.shadows)) {
    const key = k === "DEFAULT" ? "default" : k;
    lines.push(`  --shadow-${key}: ${v};`);
  }
  // Border radius
  for (const [k, v] of Object.entries(tokens.borderRadius)) {
    const key = k === "DEFAULT" ? "default" : k;
    lines.push(`  --radius-${key}: ${v};`);
  }

  lines.push("}");
  return lines.join("\n");
}

// ─── ZIVO Brand Design System ─────────────────────────────────────────────────

export const ZIVO_COLORS = {
  bg: '#0a0b14',
  bgPanel: '#0f1120',
  bgCard: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  borderHover: 'rgba(255,255,255,0.16)',
  accent: '#6366f1',
  accentLight: '#818cf8',
  accentGradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
} as const;

export const ZIVO_RADII = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '20px',
  full: '9999px',
} as const;

export const ZIVO_SHADOWS = {
  card: '0 4px 24px rgba(0,0,0,0.3)',
  accent: '0 4px 24px rgba(99,102,241,0.35)',
  accentHover: '0 8px 32px rgba(99,102,241,0.5)',
  glow: '0 0 0 3px rgba(99,102,241,0.15)',
} as const;

/**
 * Converts DesignTokens to a Tailwind config extend block.
 */
export function tokensToTailwind(tokens: DesignTokens): TailwindConfig {
  const colors: Record<string, Record<string, string>> = {};
  for (const [palette, scale] of Object.entries(tokens.colors)) {
    colors[palette] = {};
    for (const [shade, value] of Object.entries(scale)) {
      colors[palette][shade] = value;
    }
  }

  return {
    extend: {
      colors,
      spacing: tokens.spacing,
      fontSize: tokens.typography.fontSizes,
      boxShadow: tokens.shadows,
      borderRadius: tokens.borderRadius,
    },
  };
}
