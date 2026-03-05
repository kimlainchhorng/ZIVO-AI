// lib/design/tokens.ts — Design system lock: tokens + UI primitives registry

export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface TypographyTokens {
  fontFamily: {
    sans: string;
    serif: string;
    mono: string;
    display: string;
  };
  fontSize: Record<string, string>;
  fontWeight: Record<string, string>;
  lineHeight: Record<string, string>;
  letterSpacing: Record<string, string>;
}

export interface SpacingTokens {
  [key: string]: string;
}

export interface ShadowTokens {
  sm: string;
  DEFAULT: string;
  md: string;
  lg: string;
  xl: string;
  "2xl": string;
  inner: string;
  none: string;
}

export interface RadiusTokens {
  none: string;
  sm: string;
  DEFAULT: string;
  md: string;
  lg: string;
  xl: string;
  "2xl": string;
  "3xl": string;
  full: string;
}

export interface DesignSystemTokens {
  colors: {
    primary: ColorScale;
    neutral: ColorScale;
    success: ColorScale;
    warning: ColorScale;
    error: ColorScale;
    /** Semantic tokens */
    background: string;
    surface: string;
    border: string;
    text: string;
    textMuted: string;
  };
  typography: TypographyTokens;
  spacing: SpacingTokens;
  shadows: ShadowTokens;
  radii: RadiusTokens;
  /** Validated hex color allowlist — only these or token references should appear in generated code */
  allowedColors: string[];
}

/** Default ZIVO design system tokens */
export const DESIGN_TOKENS: DesignSystemTokens = {
  colors: {
    primary: {
      50: "#eef2ff",
      100: "#e0e7ff",
      200: "#c7d2fe",
      300: "#a5b4fc",
      400: "#818cf8",
      500: "#6366f1",
      600: "#4f46e5",
      700: "#4338ca",
      800: "#3730a3",
      900: "#312e81",
      950: "#1e1b4b",
    },
    neutral: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
      950: "#020617",
    },
    success: {
      50: "#f0fdf4",
      100: "#dcfce7",
      200: "#bbf7d0",
      300: "#86efac",
      400: "#4ade80",
      500: "#22c55e",
      600: "#16a34a",
      700: "#15803d",
      800: "#166534",
      900: "#14532d",
      950: "#052e16",
    },
    warning: {
      50: "#fffbeb",
      100: "#fef3c7",
      200: "#fde68a",
      300: "#fcd34d",
      400: "#fbbf24",
      500: "#f59e0b",
      600: "#d97706",
      700: "#b45309",
      800: "#92400e",
      900: "#78350f",
      950: "#451a03",
    },
    error: {
      50: "#fef2f2",
      100: "#fee2e2",
      200: "#fecaca",
      300: "#fca5a5",
      400: "#f87171",
      500: "#ef4444",
      600: "#dc2626",
      700: "#b91c1c",
      800: "#991b1b",
      900: "#7f1d1d",
      950: "#450a0a",
    },
    background: "#0a0b14",
    surface: "#0f1120",
    border: "rgba(255,255,255,0.08)",
    text: "#f1f5f9",
    textMuted: "#94a3b8",
  },
  typography: {
    fontFamily: {
      sans: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
      serif: "Georgia, ui-serif, serif",
      mono: "JetBrains Mono, ui-monospace, Cascadia Mono, monospace",
      display: "Cal Sans, Inter, sans-serif",
    },
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem",
      "6xl": "3.75rem",
      "7xl": "4.5rem",
      "8xl": "6rem",
    },
    fontWeight: {
      thin: "100",
      light: "300",
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
      extrabold: "800",
      black: "900",
    },
    lineHeight: {
      none: "1",
      tight: "1.25",
      snug: "1.375",
      normal: "1.5",
      relaxed: "1.625",
      loose: "2",
    },
    letterSpacing: {
      tighter: "-0.05em",
      tight: "-0.025em",
      normal: "0em",
      wide: "0.025em",
      wider: "0.05em",
      widest: "0.1em",
    },
  },
  spacing: {
    px: "1px",
    "0": "0px",
    "0.5": "2px",
    "1": "4px",
    "1.5": "6px",
    "2": "8px",
    "2.5": "10px",
    "3": "12px",
    "3.5": "14px",
    "4": "16px",
    "5": "20px",
    "6": "24px",
    "7": "28px",
    "8": "32px",
    "9": "36px",
    "10": "40px",
    "11": "44px",
    "12": "48px",
    "14": "56px",
    "16": "64px",
    "20": "80px",
    "24": "96px",
    "28": "112px",
    "32": "128px",
    "36": "144px",
    "40": "160px",
    "48": "192px",
    "56": "224px",
    "64": "256px",
  },
  shadows: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
    none: "none",
  },
  radii: {
    none: "0px",
    sm: "2px",
    DEFAULT: "4px",
    md: "6px",
    lg: "8px",
    xl: "12px",
    "2xl": "16px",
    "3xl": "24px",
    full: "9999px",
  },
  allowedColors: [
    "#6366f1", "#4f46e5", "#4338ca", "#3730a3", "#312e81",
    "#818cf8", "#a5b4fc", "#c7d2fe", "#e0e7ff", "#eef2ff",
    "#22c55e", "#ef4444", "#f59e0b",
    "#f1f5f9", "#94a3b8", "#475569", "#1e293b", "#0f172a",
    "#ffffff", "#000000",
    "transparent", "currentColor",
  ],
};

/** Export design tokens as CSS custom properties */
export function tokensToCSSVars(tokens: DesignSystemTokens): string {
  const lines: string[] = [":root {"];

  for (const [palette, scale] of Object.entries(tokens.colors)) {
    if (typeof scale === "string") {
      lines.push(`  --color-${palette}: ${scale};`);
    } else {
      for (const [shade, value] of Object.entries(scale as ColorScale)) {
        lines.push(`  --color-${palette}-${shade}: ${value};`);
      }
    }
  }

  for (const [key, value] of Object.entries(tokens.spacing)) {
    lines.push(`  --spacing-${key.replace(".", "_")}: ${value};`);
  }

  for (const [key, value] of Object.entries(tokens.typography.fontSize)) {
    lines.push(`  --font-size-${key}: ${value};`);
  }

  for (const [key, value] of Object.entries(tokens.shadows)) {
    const k = key === "DEFAULT" ? "default" : key;
    lines.push(`  --shadow-${k}: ${value};`);
  }

  for (const [key, value] of Object.entries(tokens.radii)) {
    const k = key === "DEFAULT" ? "default" : key;
    lines.push(`  --radius-${k}: ${value};`);
  }

  lines.push("}");
  return lines.join("\n");
}

/**
 * Validator rule: warn if a hex color is used that is NOT in the token allowlist.
 * Returns an array of warning messages.
 */
export function validateColorUsage(
  fileContent: string,
  filePath: string,
  tokens: DesignSystemTokens = DESIGN_TOKENS
): string[] {
  const warnings: string[] = [];
  // Match hex color literals: #rgb, #rrggbb, #rrggbbaa
  const hexPattern = /#([0-9a-fA-F]{3,8})\b/g;
  let match: RegExpExecArray | null;

  while ((match = hexPattern.exec(fileContent)) !== null) {
    const hex = match[0].toLowerCase();
    const isAllowed =
      tokens.allowedColors.some((c) => c.toLowerCase() === hex) ||
      // Allow token files themselves
      filePath.includes("tokens") ||
      filePath.includes("globals.css");

    if (!isAllowed) {
      warnings.push(
        `${filePath}: Non-token color "${hex}" detected. Use a token variable instead.`
      );
    }
  }

  return warnings;
}
