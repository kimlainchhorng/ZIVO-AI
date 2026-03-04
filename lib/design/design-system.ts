import OpenAI from "openai";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DesignTokens {
  colors: {
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    background: string;
    foreground: string;
    muted: string;
    mutedForeground: string;
    border: string;
    destructive: string;
    success: string;
    warning: string;
  };
  typography: {
    fontFamily: string;
    headingFamily: string;
    fontSize: Record<string, string>;
    fontWeight: Record<string, string>;
    lineHeight: Record<string, string>;
  };
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
}

export interface DesignSystem {
  name: string;
  tokens: DesignTokens;
  cssVariables: string;
  tailwindConfig: Record<string, unknown>;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_DESIGN_SYSTEM: DesignSystem = {
  name: "Default",
  tokens: {
    colors: {
      primary: "#6366f1",
      primaryForeground: "#ffffff",
      secondary: "#3f3f46",
      secondaryForeground: "#fafafa",
      accent: "#818cf8",
      accentForeground: "#ffffff",
      background: "#09090b",
      foreground: "#fafafa",
      muted: "#27272a",
      mutedForeground: "#a1a1aa",
      border: "#27272a",
      destructive: "#ef4444",
      success: "#22c55e",
      warning: "#f59e0b",
    },
    typography: {
      fontFamily: "'Inter', sans-serif",
      headingFamily: "'Inter', sans-serif",
      fontSize: {
        xs: "0.75rem",
        sm: "0.875rem",
        base: "1rem",
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
      },
      lineHeight: {
        tight: "1.25",
        snug: "1.375",
        normal: "1.5",
        relaxed: "1.625",
        loose: "2",
      },
    },
    spacing: {
      px: "1px",
      "0": "0px",
      "1": "0.25rem",
      "2": "0.5rem",
      "4": "1rem",
      "8": "2rem",
      "16": "4rem",
    },
    borderRadius: {
      none: "0px",
      sm: "0.125rem",
      DEFAULT: "0.375rem",
      md: "0.375rem",
      lg: "0.5rem",
      xl: "0.75rem",
      "2xl": "1rem",
      full: "9999px",
    },
    shadows: {
      sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
      md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
      xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    },
  },
  cssVariables: "",
  tailwindConfig: {},
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _buildPrompt(brandDescription: string, mood: string): string {
  return `You are a senior UI/UX designer. Generate a complete design system as a JSON object for the following brand.

Brand description: ${brandDescription}
Mood/style: ${mood}

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "name": "string — name of the design system",
  "tokens": {
    "colors": {
      "primary": "hex color",
      "primaryForeground": "hex color",
      "secondary": "hex color",
      "secondaryForeground": "hex color",
      "accent": "hex color",
      "accentForeground": "hex color",
      "background": "hex color",
      "foreground": "hex color",
      "muted": "hex color",
      "mutedForeground": "hex color",
      "border": "hex color",
      "destructive": "hex color",
      "success": "hex color",
      "warning": "hex color"
    },
    "typography": {
      "fontFamily": "CSS font-family string",
      "headingFamily": "CSS font-family string",
      "fontSize": { "xs": "...", "sm": "...", "base": "...", "lg": "...", "xl": "...", "2xl": "...", "3xl": "...", "4xl": "..." },
      "fontWeight": { "normal": "400", "medium": "500", "semibold": "600", "bold": "700" },
      "lineHeight": { "tight": "1.25", "snug": "1.375", "normal": "1.5", "relaxed": "1.625", "loose": "2" }
    },
    "spacing": { "px": "1px", "0": "0px", "1": "0.25rem", "2": "0.5rem", "4": "1rem", "8": "2rem", "16": "4rem" },
    "borderRadius": { "none": "0px", "sm": "0.125rem", "DEFAULT": "0.375rem", "md": "0.375rem", "lg": "0.5rem", "xl": "0.75rem", "2xl": "1rem", "full": "9999px" },
    "shadows": {
      "sm": "CSS box-shadow value",
      "DEFAULT": "CSS box-shadow value",
      "md": "CSS box-shadow value",
      "lg": "CSS box-shadow value",
      "xl": "CSS box-shadow value"
    }
  },
  "tailwindConfig": {
    "theme": {
      "extend": {
        "colors": {},
        "fontFamily": {},
        "borderRadius": {},
        "boxShadow": {}
      }
    }
  }
}`;
}

function _mergeWithDefault(partial: Partial<DesignSystem>): DesignSystem {
  return {
    name: partial.name ?? DEFAULT_DESIGN_SYSTEM.name,
    tokens: {
      colors: { ...DEFAULT_DESIGN_SYSTEM.tokens.colors, ...partial.tokens?.colors },
      typography: {
        ...DEFAULT_DESIGN_SYSTEM.tokens.typography,
        ...partial.tokens?.typography,
        fontSize: { ...DEFAULT_DESIGN_SYSTEM.tokens.typography.fontSize, ...partial.tokens?.typography?.fontSize },
        fontWeight: { ...DEFAULT_DESIGN_SYSTEM.tokens.typography.fontWeight, ...partial.tokens?.typography?.fontWeight },
        lineHeight: { ...DEFAULT_DESIGN_SYSTEM.tokens.typography.lineHeight, ...partial.tokens?.typography?.lineHeight },
      },
      spacing: { ...DEFAULT_DESIGN_SYSTEM.tokens.spacing, ...partial.tokens?.spacing },
      borderRadius: { ...DEFAULT_DESIGN_SYSTEM.tokens.borderRadius, ...partial.tokens?.borderRadius },
      shadows: { ...DEFAULT_DESIGN_SYSTEM.tokens.shadows, ...partial.tokens?.shadows },
    },
    cssVariables: partial.cssVariables ?? "",
    tailwindConfig: partial.tailwindConfig ?? {},
  };
}

// ─── Core Functions ───────────────────────────────────────────────────────────

export async function generateDesignSystem(
  brandDescription: string,
  mood: "modern" | "playful" | "minimal" | "bold" | "elegant",
  model = "gpt-4o"
): Promise<DesignSystem> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("[design-system] OPENAI_API_KEY environment variable is not set.");
  }
  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: "You are a design system generator. Always respond with valid JSON only, no markdown.",
      },
      {
        role: "user",
        content: _buildPrompt(brandDescription, mood),
      },
    ],
    temperature: 0.7,
    max_tokens: 2048,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";

  let parsed: Partial<DesignSystem>;
  try {
    parsed = JSON.parse(raw) as Partial<DesignSystem>;
  } catch {
    console.warn("[design-system] Failed to parse GPT response, using defaults.");
    parsed = {};
  }

  const system = _mergeWithDefault(parsed);
  system.cssVariables = designSystemToCss(system);

  return system;
}

export function designSystemToCss(system: DesignSystem): string {
  const { colors, typography, spacing, borderRadius, shadows } = system.tokens;

  const vars: string[] = [
    // Colors
    `  --primary: ${colors.primary};`,
    `  --primary-foreground: ${colors.primaryForeground};`,
    `  --secondary: ${colors.secondary};`,
    `  --secondary-foreground: ${colors.secondaryForeground};`,
    `  --accent: ${colors.accent};`,
    `  --accent-foreground: ${colors.accentForeground};`,
    `  --background: ${colors.background};`,
    `  --foreground: ${colors.foreground};`,
    `  --muted: ${colors.muted};`,
    `  --muted-foreground: ${colors.mutedForeground};`,
    `  --border: ${colors.border};`,
    `  --destructive: ${colors.destructive};`,
    `  --success: ${colors.success};`,
    `  --warning: ${colors.warning};`,
    // Typography
    `  --font-family: ${typography.fontFamily};`,
    `  --heading-family: ${typography.headingFamily};`,
    // Font sizes
    ...Object.entries(typography.fontSize).map(([k, v]) => `  --font-size-${k}: ${v};`),
    // Font weights
    ...Object.entries(typography.fontWeight).map(([k, v]) => `  --font-weight-${k}: ${v};`),
    // Line heights
    ...Object.entries(typography.lineHeight).map(([k, v]) => `  --line-height-${k}: ${v};`),
    // Spacing
    ...Object.entries(spacing).map(([k, v]) => `  --spacing-${k}: ${v};`),
    // Border radius
    ...Object.entries(borderRadius).map(([k, v]) => `  --radius-${k === "DEFAULT" ? "default" : k}: ${v};`),
    // Shadows
    ...Object.entries(shadows).map(([k, v]) => `  --shadow-${k === "DEFAULT" ? "default" : k}: ${v};`),
  ];

  return `:root {\n${vars.join("\n")}\n}`;
}

export function designSystemToTailwind(system: DesignSystem): string {
  return JSON.stringify(system.tailwindConfig, null, 2);
}
