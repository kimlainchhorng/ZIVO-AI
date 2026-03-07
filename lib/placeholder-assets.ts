// lib/placeholder-assets.ts — Placeholder SVG icons, illustrations, and OG image generator
// Provides stable, inline SVG content injected into generated websites during the build pipeline.

export interface PlaceholderAsset {
  path: string;
  content: string;
}

// ─── Feature Icons ─────────────────────────────────────────────────────────────

const ICON_DEFS: Array<{ name: string; paths: string }> = [
  {
    name: "analytics",
    paths:
      '<rect x="3" y="12" width="4" height="9" rx="1" fill="currentColor" opacity="0.7"/>' +
      '<rect x="10" y="7" width="4" height="14" rx="1" fill="currentColor"/>' +
      '<rect x="17" y="3" width="4" height="18" rx="1" fill="currentColor" opacity="0.7"/>',
  },
  {
    name: "team",
    paths:
      '<circle cx="9" cy="7" r="4" fill="currentColor" opacity="0.8"/>' +
      '<path d="M2 21c0-4 3.1-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>' +
      '<circle cx="17" cy="9" r="3" fill="currentColor" opacity="0.6"/>' +
      '<path d="M13 21c0-3 2.2-5.5 5-5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.6"/>',
  },
  {
    name: "security",
    paths:
      '<path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.25C16.5 22.15 20 17.25 20 12V6l-8-4z" fill="currentColor" opacity="0.15" stroke="currentColor" stroke-width="1.5" fill-rule="evenodd"/>' +
      '<path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  },
  {
    name: "api",
    paths:
      '<polyline points="16 18 22 12 16 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
      '<polyline points="8 6 2 12 8 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  },
  {
    name: "performance",
    paths:
      '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" fill="none" opacity="0.3"/>' +
      '<path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
      '<path d="M12 2v2M22 12h-2M12 22v-2M2 12h2" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.5"/>',
  },
  {
    name: "integration",
    paths:
      '<rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5" fill="currentColor" opacity="0.15"/>' +
      '<rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5" fill="currentColor" opacity="0.15"/>' +
      '<rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5" fill="currentColor" opacity="0.15"/>' +
      '<path d="M17.5 14v3.5H14M21 17.5h-3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>',
  },
];

/**
 * Generates placeholder SVG icon files for `public/icons/`.
 * Each SVG uses `currentColor` so it can be tinted via CSS.
 */
export function generatePlaceholderIcons(): PlaceholderAsset[] {
  return ICON_DEFS.map(({ name, paths }) => ({
    path: `public/icons/${name}.svg`,
    content: buildIconSvg(paths),
  }));
}

function buildIconSvg(innerPaths: string): string {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ' +
    'fill="none" aria-hidden="true">' +
    innerPaths +
    "</svg>"
  );
}

// ─── Illustrations ─────────────────────────────────────────────────────────────

/**
 * Generates placeholder SVG illustration files for `public/illustrations/`.
 * These are decorative, abstract shapes suitable for hero/section backgrounds.
 */
export function generatePlaceholderIllustrations(): PlaceholderAsset[] {
  return [
    { path: "public/illustrations/hero.svg", content: buildHeroIllustration() },
    { path: "public/illustrations/features.svg", content: buildFeaturesIllustration() },
    { path: "public/illustrations/pricing.svg", content: buildPricingIllustration() },
  ];
}

function buildHeroIllustration(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" aria-hidden="true">
  <defs>
    <linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.05"/>
    </linearGradient>
    <linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.6"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#hg)" rx="16"/>
  <!-- Dashboard window -->
  <rect x="120" y="60" width="560" height="380" rx="12" fill="white" fill-opacity="0.08" stroke="white" stroke-opacity="0.15" stroke-width="1"/>
  <rect x="120" y="60" width="560" height="36" rx="12" fill="white" fill-opacity="0.1"/>
  <circle cx="148" cy="78" r="6" fill="#ef4444" fill-opacity="0.7"/>
  <circle cx="168" cy="78" r="6" fill="#f59e0b" fill-opacity="0.7"/>
  <circle cx="188" cy="78" r="6" fill="#10b981" fill-opacity="0.7"/>
  <!-- Stats cards -->
  <rect x="140" y="116" width="120" height="70" rx="8" fill="white" fill-opacity="0.06" stroke="white" stroke-opacity="0.1" stroke-width="1"/>
  <rect x="280" y="116" width="120" height="70" rx="8" fill="url(#cg)" fill-opacity="0.9"/>
  <rect x="420" y="116" width="120" height="70" rx="8" fill="white" fill-opacity="0.06" stroke="white" stroke-opacity="0.1" stroke-width="1"/>
  <rect x="560" y="116" width="100" height="70" rx="8" fill="white" fill-opacity="0.06" stroke="white" stroke-opacity="0.1" stroke-width="1"/>
  <!-- Chart bars -->
  <rect x="140" y="340" width="24" height="60" rx="4" fill="white" fill-opacity="0.15"/>
  <rect x="174" y="310" width="24" height="90" rx="4" fill="url(#cg)"/>
  <rect x="208" y="325" width="24" height="75" rx="4" fill="white" fill-opacity="0.15"/>
  <rect x="242" y="290" width="24" height="110" rx="4" fill="url(#cg)" fill-opacity="0.7"/>
  <rect x="276" y="305" width="24" height="95" rx="4" fill="white" fill-opacity="0.15"/>
  <rect x="310" y="275" width="24" height="125" rx="4" fill="url(#cg)"/>
  <!-- Line chart -->
  <polyline points="420,360 460,320 500,335 540,295 580,310 620,280 640,270" stroke="#6366f1" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
  <circle cx="640" cy="270" r="5" fill="#6366f1"/>
</svg>`;
}

function buildFeaturesIllustration(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" aria-hidden="true">
  <defs>
    <linearGradient id="fg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.04"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#fg)" rx="16"/>
  <!-- Feature grid icons -->
  <rect x="80" y="80" width="180" height="160" rx="12" fill="white" fill-opacity="0.06" stroke="#6366f1" stroke-opacity="0.2" stroke-width="1"/>
  <rect x="300" y="80" width="180" height="160" rx="12" fill="white" fill-opacity="0.06" stroke="#6366f1" stroke-opacity="0.2" stroke-width="1"/>
  <rect x="520" y="80" width="180" height="160" rx="12" fill="white" fill-opacity="0.06" stroke="#6366f1" stroke-opacity="0.2" stroke-width="1"/>
  <rect x="80" y="268" width="180" height="160" rx="12" fill="white" fill-opacity="0.06" stroke="#6366f1" stroke-opacity="0.2" stroke-width="1"/>
  <rect x="300" y="268" width="180" height="160" rx="12" fill="white" fill-opacity="0.06" stroke="#6366f1" stroke-opacity="0.2" stroke-width="1"/>
  <rect x="520" y="268" width="180" height="160" rx="12" fill="white" fill-opacity="0.06" stroke="#6366f1" stroke-opacity="0.2" stroke-width="1"/>
  <!-- Icon dots -->
  <circle cx="170" cy="145" r="24" fill="#6366f1" fill-opacity="0.2"/>
  <circle cx="390" cy="145" r="24" fill="#8b5cf6" fill-opacity="0.2"/>
  <circle cx="610" cy="145" r="24" fill="#06b6d4" fill-opacity="0.2"/>
  <circle cx="170" cy="333" r="24" fill="#10b981" fill-opacity="0.2"/>
  <circle cx="390" cy="333" r="24" fill="#f59e0b" fill-opacity="0.2"/>
  <circle cx="610" cy="333" r="24" fill="#ef4444" fill-opacity="0.2"/>
  <!-- Text placeholders -->
  <rect x="110" y="185" width="120" height="8" rx="4" fill="white" fill-opacity="0.2"/>
  <rect x="110" y="203" width="100" height="6" rx="3" fill="white" fill-opacity="0.1"/>
  <rect x="330" y="185" width="120" height="8" rx="4" fill="white" fill-opacity="0.2"/>
  <rect x="330" y="203" width="100" height="6" rx="3" fill="white" fill-opacity="0.1"/>
  <rect x="550" y="185" width="120" height="8" rx="4" fill="white" fill-opacity="0.2"/>
  <rect x="550" y="203" width="100" height="6" rx="3" fill="white" fill-opacity="0.1"/>
</svg>`;
}

function buildPricingIllustration(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" aria-hidden="true">
  <defs>
    <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.04"/>
    </linearGradient>
    <linearGradient id="featured" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#pg)" rx="16"/>
  <!-- Pricing cards -->
  <rect x="60" y="80" width="200" height="340" rx="12" fill="white" fill-opacity="0.05" stroke="white" stroke-opacity="0.12" stroke-width="1"/>
  <rect x="290" y="60" width="220" height="380" rx="12" fill="url(#featured)" fill-opacity="0.15" stroke="#6366f1" stroke-opacity="0.5" stroke-width="1.5"/>
  <rect x="540" y="80" width="200" height="340" rx="12" fill="white" fill-opacity="0.05" stroke="white" stroke-opacity="0.12" stroke-width="1"/>
  <!-- Plan names -->
  <rect x="100" y="120" width="80" height="10" rx="5" fill="white" fill-opacity="0.3"/>
  <rect x="330" y="100" width="100" height="12" rx="6" fill="white" fill-opacity="0.8"/>
  <rect x="580" y="120" width="80" height="10" rx="5" fill="white" fill-opacity="0.3"/>
  <!-- Prices -->
  <rect x="90" y="155" width="50" height="22" rx="4" fill="white" fill-opacity="0.2"/>
  <rect x="320" y="140" width="70" height="26" rx="4" fill="white" fill-opacity="0.7"/>
  <rect x="570" y="155" width="70" height="22" rx="4" fill="white" fill-opacity="0.2"/>
  <!-- Feature check rows -->
  <circle cx="95" cy="222" r="6" fill="#10b981" fill-opacity="0.6"/>
  <rect x="112" y="218" width="100" height="7" rx="3" fill="white" fill-opacity="0.2"/>
  <circle cx="95" cy="248" r="6" fill="#10b981" fill-opacity="0.6"/>
  <rect x="112" y="244" width="80" height="7" rx="3" fill="white" fill-opacity="0.2"/>
  <circle cx="95" cy="274" r="6" fill="white" fill-opacity="0.2"/>
  <rect x="112" y="270" width="90" height="7" rx="3" fill="white" fill-opacity="0.1"/>
  <circle cx="325" cy="222" r="6" fill="#10b981" fill-opacity="0.9"/>
  <rect x="342" y="218" width="110" height="7" rx="3" fill="white" fill-opacity="0.5"/>
  <circle cx="325" cy="248" r="6" fill="#10b981" fill-opacity="0.9"/>
  <rect x="342" y="244" width="90" height="7" rx="3" fill="white" fill-opacity="0.5"/>
  <circle cx="325" cy="274" r="6" fill="#10b981" fill-opacity="0.9"/>
  <rect x="342" y="270" width="100" height="7" rx="3" fill="white" fill-opacity="0.5"/>
  <!-- CTA buttons -->
  <rect x="100" y="360" width="120" height="36" rx="8" fill="white" fill-opacity="0.1" stroke="white" stroke-opacity="0.2" stroke-width="1"/>
  <rect x="330" y="360" width="140" height="40" rx="8" fill="white" fill-opacity="0.9"/>
  <rect x="580" y="360" width="120" height="36" rx="8" fill="white" fill-opacity="0.1" stroke="white" stroke-opacity="0.2" stroke-width="1"/>
  <!-- Popular badge -->
  <rect x="340" y="42" width="100" height="22" rx="11" fill="#6366f1"/>
  <rect x="358" y="50" width="64" height="6" rx="3" fill="white" fill-opacity="0.9"/>
</svg>`;
}

// ─── OG Image ──────────────────────────────────────────────────────────────────

/**
 * Generates a placeholder SVG Open Graph image (1200×630).
 * Saved as `public/og.svg` and referenced in metadata until replaced.
 */
export function generateOgImage(brandName: string, tagline: string): PlaceholderAsset {
  const name = brandName || "Your Brand";
  const sub = tagline || "Your tagline goes here";

  const content = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630" aria-label="Open Graph image for ${escapeXml(name)}">
  <defs>
    <linearGradient id="og-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
    <linearGradient id="og-accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#og-bg)"/>
  <!-- Decorative circles -->
  <circle cx="1050" cy="100" r="200" fill="#6366f1" fill-opacity="0.08"/>
  <circle cx="150" cy="530" r="150" fill="#8b5cf6" fill-opacity="0.06"/>
  <!-- Accent bar -->
  <rect x="80" y="200" width="6" height="120" rx="3" fill="url(#og-accent)"/>
  <!-- Brand name -->
  <text x="110" y="280" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="700" fill="white">${escapeXml(name)}</text>
  <!-- Tagline -->
  <text x="110" y="340" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="400" fill="white" fill-opacity="0.6">${escapeXml(sub)}</text>
  <!-- Bottom note (replace me hint) -->
  <text x="110" y="570" font-family="system-ui, -apple-system, sans-serif" font-size="18" fill="white" fill-opacity="0.25">Replace this placeholder via the Assets panel</text>
  <!-- Decorative grid dots -->
  <g fill="#6366f1" fill-opacity="0.12">
    <circle cx="900" cy="300" r="3"/><circle cx="940" cy="300" r="3"/><circle cx="980" cy="300" r="3"/>
    <circle cx="900" cy="340" r="3"/><circle cx="940" cy="340" r="3"/><circle cx="980" cy="340" r="3"/>
    <circle cx="900" cy="380" r="3"/><circle cx="940" cy="380" r="3"/><circle cx="980" cy="380" r="3"/>
    <circle cx="1020" cy="300" r="3"/><circle cx="1020" cy="340" r="3"/><circle cx="1020" cy="380" r="3"/>
    <circle cx="1060" cy="300" r="3"/><circle cx="1060" cy="340" r="3"/><circle cx="1060" cy="380" r="3"/>
  </g>
</svg>`;

  return { path: "public/og.svg", content };
}

// ─── Favicon ───────────────────────────────────────────────────────────────────

/**
 * Generates a placeholder SVG favicon as `public/favicon.svg`.
 * Also generates `app/icon.svg` for Next.js favicon support.
 * Uses the first letter of the brand name as the icon character.
 */
export function generateFavicon(brandName: string): PlaceholderAsset[] {
  const letter = (brandName || "Z").charAt(0).toUpperCase();
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#6366f1"/>
  <text x="16" y="22" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700" fill="white" text-anchor="middle">${escapeXml(letter)}</text>
</svg>`;

  return [
    { path: "public/favicon.svg", content: svgContent },
    { path: "app/icon.svg", content: svgContent },
  ];
}

// ─── All placeholder assets ────────────────────────────────────────────────────

/**
 * Returns all placeholder assets for a website build.
 * These are injected as files in the build pipeline.
 */
export function getAllPlaceholderAssets(
  brandName: string,
  tagline: string
): PlaceholderAsset[] {
  return [
    ...generatePlaceholderIcons(),
    ...generatePlaceholderIllustrations(),
    generateOgImage(brandName, tagline),
    ...generateFavicon(brandName),
  ];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&apos;";
      default:  return ch;
    }
  });
}
