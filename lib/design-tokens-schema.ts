// lib/design-tokens-schema.ts
// Canonical schema for per-project design tokens.
// Used by the DB helpers, the CSS injector, and the UI editor.

export interface ProjectColorTokens {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  destructive: string;
  border: string;
  surface: string;
}

export interface ProjectTypographyTokens {
  fontSans: string;
  fontMono: string;
  baseSizePx: number;
  /** Multiplier applied to base size for each heading level (h1-h6). */
  scaleRatio: number;
}

export interface ProjectSpacingTokens {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
}

export interface ProjectRadiusTokens {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

export interface ProjectShadowTokens {
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

/** Component contracts — describe the agreed-upon variants for core UI pieces. */
export interface ProjectComponentContract {
  button: {
    variants: string[];   // e.g. ["primary","secondary","ghost","destructive"]
    radiusKey: keyof ProjectRadiusTokens;
  };
  card: {
    variants: string[];   // e.g. ["default","elevated","outlined"]
    radiusKey: keyof ProjectRadiusTokens;
  };
  section: {
    paddingY: string;     // e.g. "5rem"
    maxWidth: string;     // e.g. "1280px"
  };
  navbar: {
    height: string;       // e.g. "64px"
    blurBackground: boolean;
  };
}

export interface ProjectDesignTokens {
  preset: string;        // name of the originating preset, or "custom"
  colors: ProjectColorTokens;
  typography: ProjectTypographyTokens;
  spacing: ProjectSpacingTokens;
  radius: ProjectRadiusTokens;
  shadows: ProjectShadowTokens;
  components: ProjectComponentContract;
}

// ─── SaaS Default Tokens ──────────────────────────────────────────────────────

export const SAAS_DEFAULT_TOKENS: ProjectDesignTokens = {
  preset: 'saas_default',
  colors: {
    primary:         '#6366f1',
    secondary:       '#8b5cf6',
    accent:          '#06b6d4',
    background:      '#0f0f1a',
    foreground:      '#f1f5f9',
    muted:           '#1e1e2e',
    mutedForeground: '#64748b',
    destructive:     '#ef4444',
    border:          'rgba(99,102,241,0.2)',
    surface:         '#1a1a2e',
  },
  typography: {
    fontSans:    'Inter, system-ui, sans-serif',
    fontMono:    'JetBrains Mono, Fira Code, monospace',
    baseSizePx:  16,
    scaleRatio:  1.25,
  },
  spacing: {
    xs:  '0.25rem',
    sm:  '0.5rem',
    md:  '1rem',
    lg:  '1.5rem',
    xl:  '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  radius: {
    sm:   '6px',
    md:   '12px',
    lg:   '16px',
    xl:   '24px',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 3px rgba(99,102,241,0.15)',
    md: '0 4px 16px rgba(99,102,241,0.2)',
    lg: '0 25px 50px rgba(99,102,241,0.25)',
    xl: '0 40px 80px rgba(99,102,241,0.3)',
  },
  components: {
    button: {
      variants:  ['primary', 'secondary', 'ghost', 'outline', 'destructive'],
      radiusKey: 'md',
    },
    card: {
      variants:  ['default', 'elevated', 'outlined'],
      radiusKey: 'lg',
    },
    section: {
      paddingY:  '5rem',
      maxWidth:  '1280px',
    },
    navbar: {
      height:         '64px',
      blurBackground: true,
    },
  },
};

/** Map style preset keys → opinionated token overrides. */
export const PRESET_TOKEN_MAP: Record<string, Partial<ProjectDesignTokens>> = {
  premium: {
    preset: 'premium',
    colors: {
      primary:         '#6366f1',
      secondary:       '#8b5cf6',
      accent:          '#06b6d4',
      background:      '#0f0f1a',
      foreground:      '#f1f5f9',
      muted:           '#1e1e2e',
      mutedForeground: '#64748b',
      destructive:     '#ef4444',
      border:          'rgba(99,102,241,0.2)',
      surface:         '#1a1a2e',
    },
  },
  minimal: {
    preset: 'minimal',
    colors: {
      primary:         '#18181b',
      secondary:       '#3f3f46',
      accent:          '#2563eb',
      background:      '#ffffff',
      foreground:      '#18181b',
      muted:           '#f4f4f5',
      mutedForeground: '#71717a',
      destructive:     '#ef4444',
      border:          'rgba(0,0,0,0.08)',
      surface:         '#f9fafb',
    },
    radius: { sm: '3px', md: '6px', lg: '8px', xl: '12px', full: '9999px' },
  },
  luxury_dark: {
    preset: 'luxury_dark',
    colors: {
      primary:         '#d4af37',
      secondary:       '#b8962e',
      accent:          '#c9a227',
      background:      '#0a0a0a',
      foreground:      '#f5f0e8',
      muted:           '#111111',
      mutedForeground: '#8a7a5a',
      destructive:     '#ef4444',
      border:          'rgba(212,175,55,0.15)',
      surface:         '#111111',
    },
    typography: {
      fontSans:    'Playfair Display, Georgia, serif',
      fontMono:    'JetBrains Mono, monospace',
      baseSizePx:  16,
      scaleRatio:  1.3,
    },
    radius: { sm: '2px', md: '4px', lg: '6px', xl: '10px', full: '9999px' },
  },
  startup: {
    preset: 'startup',
    colors: {
      primary:         '#10b981',
      secondary:       '#059669',
      accent:          '#f59e0b',
      background:      '#f8fafc',
      foreground:      '#0f172a',
      muted:           '#f1f5f9',
      mutedForeground: '#64748b',
      destructive:     '#ef4444',
      border:          'rgba(16,185,129,0.15)',
      surface:         '#ffffff',
    },
  },
  corporate: {
    preset: 'corporate',
    colors: {
      primary:         '#1e40af',
      secondary:       '#1d4ed8',
      accent:          '#0ea5e9',
      background:      '#f9fafb',
      foreground:      '#111827',
      muted:           '#f3f4f6',
      mutedForeground: '#6b7280',
      destructive:     '#ef4444',
      border:          'rgba(30,64,175,0.1)',
      surface:         '#ffffff',
    },
    radius: { sm: '4px', md: '8px', lg: '10px', xl: '14px', full: '9999px' },
  },
  modern_glassmorphism: {
    preset: 'modern_glassmorphism',
    colors: {
      primary:         '#a855f7',
      secondary:       '#9333ea',
      accent:          '#ec4899',
      background:      '#0f0c29',
      foreground:      '#ffffff',
      muted:           'rgba(255,255,255,0.05)',
      mutedForeground: 'rgba(255,255,255,0.5)',
      destructive:     '#ef4444',
      border:          'rgba(255,255,255,0.12)',
      surface:         'rgba(255,255,255,0.05)',
    },
    radius: { sm: '10px', md: '16px', lg: '20px', xl: '28px', full: '9999px' },
  },
};

/**
 * Merges a preset's overrides onto the SaaS default tokens.
 * Returns full tokens suitable for storage.
 */
export function tokensFromPreset(presetKey: string): ProjectDesignTokens {
  const override = PRESET_TOKEN_MAP[presetKey];
  if (!override) return { ...SAAS_DEFAULT_TOKENS };
  return {
    ...SAAS_DEFAULT_TOKENS,
    ...override,
    colors:     { ...SAAS_DEFAULT_TOKENS.colors,     ...(override.colors ?? {}) },
    typography: { ...SAAS_DEFAULT_TOKENS.typography, ...(override.typography ?? {}) },
    spacing:    { ...SAAS_DEFAULT_TOKENS.spacing,    ...(override.spacing ?? {}) },
    radius:     { ...SAAS_DEFAULT_TOKENS.radius,     ...(override.radius ?? {}) },
    shadows:    { ...SAAS_DEFAULT_TOKENS.shadows,    ...(override.shadows ?? {}) },
    components: { ...SAAS_DEFAULT_TOKENS.components, ...(override.components ?? {}) },
  };
}
