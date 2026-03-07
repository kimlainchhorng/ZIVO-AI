// components/brand/Logo.tsx — Renders the brand SVG logo

import { brandLogoSvg } from "@/lib/assets";

export interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * Renders the inline SVG brand logo.
 * The SVG content is validated at build time by isSafeSvg() in lib/ai/logo-generator.ts
 * (no external refs, no scripts, no event handlers) before being written to lib/assets.ts.
 * The static fallback in lib/assets.ts is also hand-authored safe SVG.
 */
export default function Logo({ size = 40, className = "" }: LogoProps) {
  return (
    <span
      className={className}
      style={{ display: "inline-flex", width: size, height: size, flexShrink: 0 }}
      aria-label="Logo"
      role="img"
      dangerouslySetInnerHTML={{ __html: brandLogoSvg }}
    />
  );
}
