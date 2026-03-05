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
  const id = FEATURE_IDS[index % FEATURE_IDS.length];
  return `https://picsum.photos/id/${id}/${width}/${height}`;
}

/** Get a single avatar URL by index */
export function getAvatarUrl(index: number, size = 128): string {
  const id = AVATAR_IDS[index % AVATAR_IDS.length];
  return `https://picsum.photos/id/${id}/${size}/${size}`;
}

/** Get hero image URL */
export function getHeroImageUrl(seed = 0, width = 1920, height = 1080): string {
  const id = HERO_IDS[seed % HERO_IDS.length];
  return `https://picsum.photos/id/${id}/${width}/${height}`;
}
