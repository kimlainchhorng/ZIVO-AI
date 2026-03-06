// lib/design-tokens-css.ts
// Converts a ProjectDesignTokens object into:
//   1. CSS custom properties string (for globals.css / tokens.css)
//   2. A prompt fragment that instructs the AI to use those tokens

import type { ProjectDesignTokens } from './design-tokens-schema';

/**
 * Generates a `tokens.css` file content with CSS custom properties
 * derived from the project's design tokens.
 */
export function generateTokensCss(tokens: ProjectDesignTokens): string {
  const { colors, typography, spacing, radius, shadows } = tokens;

  return `:root {
  /* ── Colors ─────────────────────────────── */
  --color-primary:          ${colors.primary};
  --color-secondary:        ${colors.secondary};
  --color-accent:           ${colors.accent};
  --color-background:       ${colors.background};
  --color-foreground:       ${colors.foreground};
  --color-muted:            ${colors.muted};
  --color-muted-foreground: ${colors.mutedForeground};
  --color-destructive:      ${colors.destructive};
  --color-border:           ${colors.border};
  --color-surface:          ${colors.surface};

  /* ── Typography ─────────────────────────── */
  --font-sans:       ${typography.fontSans};
  --font-mono:       ${typography.fontMono};
  --font-size-base:  ${typography.baseSizePx}px;
  --type-scale:      ${typography.scaleRatio};

  /* ── Spacing ────────────────────────────── */
  --space-xs:  ${spacing.xs};
  --space-sm:  ${spacing.sm};
  --space-md:  ${spacing.md};
  --space-lg:  ${spacing.lg};
  --space-xl:  ${spacing.xl};
  --space-2xl: ${spacing['2xl']};
  --space-3xl: ${spacing['3xl']};

  /* ── Radius ─────────────────────────────── */
  --radius-sm:   ${radius.sm};
  --radius-md:   ${radius.md};
  --radius-lg:   ${radius.lg};
  --radius-xl:   ${radius.xl};
  --radius-full: ${radius.full};

  /* ── Shadows ────────────────────────────── */
  --shadow-sm: ${shadows.sm};
  --shadow-md: ${shadows.md};
  --shadow-lg: ${shadows.lg};
  --shadow-xl: ${shadows.xl};
}
`.trim();
}

/**
 * Generates a `tokens.ts` file content that exports design tokens
 * as a TypeScript constant, usable in component code.
 */
export function generateTokensTs(tokens: ProjectDesignTokens): string {
  return `// Auto-generated design tokens — edit via the Design panel in ZIVO-AI.
// DO NOT edit manually; changes will be overwritten on next save.

export const tokens = ${JSON.stringify(tokens, null, 2)} as const;

export type TokenColors    = typeof tokens.colors;
export type TokenTypography = typeof tokens.typography;
export type TokenSpacing   = typeof tokens.spacing;
export type TokenRadius    = typeof tokens.radius;
export type TokenShadows   = typeof tokens.shadows;
`;
}

/**
 * Returns a prompt fragment that instructs the AI generator to use
 * the project's design tokens instead of ad-hoc values.
 */
export function buildDesignTokenPromptFragment(tokens: ProjectDesignTokens): string {
  const { colors, typography, spacing, radius, shadows, components } = tokens;
  return `
## 🎨 PROJECT DESIGN SYSTEM (MANDATORY — DO NOT OVERRIDE)
This project has a locked design system. You MUST use these tokens consistently across ALL generated files.
Never hardcode raw color hex values, font names, or spacing values — always reference the CSS variables or token constants below.

### Color Tokens (use as CSS var or Tailwind arbitrary value)
- Primary:          ${colors.primary}  → var(--color-primary)
- Secondary:        ${colors.secondary} → var(--color-secondary)
- Accent:           ${colors.accent}   → var(--color-accent)
- Background:       ${colors.background} → var(--color-background)
- Foreground:       ${colors.foreground} → var(--color-foreground)
- Muted bg:         ${colors.muted}    → var(--color-muted)
- Muted text:       ${colors.mutedForeground} → var(--color-muted-foreground)
- Destructive:      ${colors.destructive} → var(--color-destructive)
- Border:           ${colors.border}   → var(--color-border)
- Surface/Card bg:  ${colors.surface}  → var(--color-surface)

### Typography Tokens
- Sans font:    ${typography.fontSans}  → var(--font-sans)
- Mono font:    ${typography.fontMono}  → var(--font-mono)
- Base size:    ${typography.baseSizePx}px → var(--font-size-base)

### Spacing Tokens
- xs: ${spacing.xs} | sm: ${spacing.sm} | md: ${spacing.md} | lg: ${spacing.lg} | xl: ${spacing.xl} | 2xl: ${spacing['2xl']} | 3xl: ${spacing['3xl']}
- Use: var(--space-xs) … var(--space-3xl)

### Radius Tokens  (use var(--radius-*))
- sm: ${radius.sm} | md: ${radius.md} | lg: ${radius.lg} | xl: ${radius.xl} | full: ${radius.full}

### Shadow Tokens  (use var(--shadow-*))
- sm: ${shadows.sm}
- md: ${shadows.md}
- lg: ${shadows.lg}

### Component Contracts (enforce these variants — do not invent new ones)
- Button variants: ${components.button.variants.join(', ')}  — radius: ${radius[components.button.radiusKey]}
- Card variants:   ${components.card.variants.join(', ')}    — radius: ${radius[components.card.radiusKey]}
- Section layout:  paddingY=${components.section.paddingY}, maxWidth=${components.section.maxWidth}
- Navbar:          height=${components.navbar.height}, blur-background=${components.navbar.blurBackground}

### REQUIRED file: \`app/globals.css\` or \`styles/tokens.css\`
MUST include these CSS custom properties in :root { } — generate the file with ALL token variables above.
`.trim();
}
