// lib/assets.ts — Stable image asset URLs using picsum.photos

export interface HeroAsset {
  url: string;
  width: number;
  height: number;
  alt: string;
}

export interface FeatureAsset {
  url: string;
  width: number;
  height: number;
  alt: string;
  id: number;
}

export interface AvatarAsset {
  url: string;
  size: number;
  alt: string;
  id: number;
}

export interface SiteAssets {
  hero: HeroAsset;
  features: FeatureAsset[];
  avatars: AvatarAsset[];
  og: HeroAsset;
}

/** Stable picsum.photos image IDs that reliably return high-quality images */
const HERO_IDS = [1040, 1041, 1043, 1044, 1046] as const;
const FEATURE_IDS = [20, 21, 22, 24, 25, 26] as const;
const AVATAR_IDS = [64, 65, 91] as const;

// ─── Single source-of-truth constants ────────────────────────────────────────

/**
 * Brand identity constants.
 * The build pipeline (`runWebsiteV2Pipeline`) overwrites `lib/assets.ts` with
 * the actual brand name/tagline extracted from the WebsitePlan, so this default
 * object is only used when importing the module directly outside of a build.
 * Treat this as read-only at runtime; mutations will not persist across builds.
 */
export const brand: { name?: string; tagline?: string } = {};

/**
 * Inline SVG logo string.  The build pipeline replaces this with an
 * AI-generated logo via generateSvgLogo().  The fallback renders a
 * minimal geometric mark that is safe to embed directly in HTML.
 */
export const brandLogoSvg: string =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none" aria-label="Logo">' +
  '<rect width="40" height="40" rx="8" fill="#6366f1"/>' +
  '<path d="M10 30 L20 10 L30 30 Z" fill="white" opacity="0.9"/>' +
  '</svg>';

/**
 * Stable, deterministic image URL constants.
 * All URLs use picsum.photos/id/N for reproducible results.
 * - hero:     1600 x 900  (16:9 landscape)
 * - features: 800  x 600  (4:3)
 * - avatars:  200  x 200  (1:1 square)
 */
export const images = {
  hero: `https://picsum.photos/id/${HERO_IDS[0]}/1600/900`,
  features: [
    `https://picsum.photos/id/${FEATURE_IDS[0]}/800/600`,
    `https://picsum.photos/id/${FEATURE_IDS[1]}/800/600`,
    `https://picsum.photos/id/${FEATURE_IDS[2]}/800/600`,
    `https://picsum.photos/id/${FEATURE_IDS[3]}/800/600`,
    `https://picsum.photos/id/${FEATURE_IDS[4]}/800/600`,
    `https://picsum.photos/id/${FEATURE_IDS[5]}/800/600`,
  ],
  avatars: [
    `https://picsum.photos/id/${AVATAR_IDS[0]}/200/200`,
    `https://picsum.photos/id/${AVATAR_IDS[1]}/200/200`,
    `https://picsum.photos/id/${AVATAR_IDS[2]}/200/200`,
  ],
} as const;

/**
 * Returns stable, deterministic image URLs for a given seed index.
 * Using picsum.photos/id/N allows stable, reproducible URLs.
 */
export function getSiteAssets(seed = 0): SiteAssets {
  const heroId = HERO_IDS[seed % HERO_IDS.length];
  const featureIds = FEATURE_IDS.slice(0, 6);
  const avatarIds = AVATAR_IDS.slice(0, 3);

  return {
    hero: {
      url: `https://picsum.photos/id/${heroId}/1920/1080`,
      width: 1920,
      height: 1080,
      alt: "Hero image",
    },
    og: {
      url: `https://picsum.photos/id/${heroId}/1200/630`,
      width: 1200,
      height: 630,
      alt: "Open Graph image",
    },
    features: featureIds.map((id, i) => ({
      url: `https://picsum.photos/id/${id}/800/600`,
      width: 800,
      height: 600,
      alt: `Feature ${i + 1} illustration`,
      id,
    })),
    avatars: avatarIds.map((id, i) => ({
      url: `https://picsum.photos/id/${id}/128/128`,
      size: 128,
      alt: `Testimonial avatar ${i + 1}`,
      id,
    })),
  };
}

/** Get a single feature image URL by index */
export function getFeatureImageUrl(index: number, width = 800, height = 600): string {
  const len = FEATURE_IDS.length;
  const id = FEATURE_IDS[((index % len) + len) % len];
  const id = FEATURE_IDS[index % FEATURE_IDS.length];
  return `https://picsum.photos/id/${id}/${width}/${height}`;
}

/** Get a single avatar URL by index */
export function getAvatarUrl(index: number, size = 128): string {
  const len = AVATAR_IDS.length;
  const id = AVATAR_IDS[((index % len) + len) % len];
  const id = AVATAR_IDS[index % AVATAR_IDS.length];
  return `https://picsum.photos/id/${id}/${size}/${size}`;
}

/** Get hero image URL */
export function getHeroImageUrl(seed = 0, width = 1920, height = 1080): string {
  const len = HERO_IDS.length;
  const id = HERO_IDS[((seed % len) + len) % len];
  const id = HERO_IDS[seed % HERO_IDS.length];
  return `https://picsum.photos/id/${id}/${width}/${height}`;
}
