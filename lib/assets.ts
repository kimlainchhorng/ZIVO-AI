// lib/assets.ts — Stable stock image URLs for generated projects
// Uses picsum.photos with stable numeric IDs for reproducible outputs.

export interface StockImage {
  url: string;
  alt: string;
  width: number;
  height: number;
}

/** 16:9 hero banner image */
export const heroImage: StockImage = {
  url: "https://picsum.photos/id/1/1280/720",
  alt: "Hero banner",
  width: 1280,
  height: 720,
};

/** 4:3 feature section images */
export const featureImages: StockImage[] = [
  { url: "https://picsum.photos/id/20/800/600", alt: "Feature 1", width: 800, height: 600 },
  { url: "https://picsum.photos/id/30/800/600", alt: "Feature 2", width: 800, height: 600 },
  { url: "https://picsum.photos/id/40/800/600", alt: "Feature 3", width: 800, height: 600 },
  { url: "https://picsum.photos/id/50/800/600", alt: "Feature 4", width: 800, height: 600 },
  { url: "https://picsum.photos/id/60/800/600", alt: "Feature 5", width: 800, height: 600 },
  { url: "https://picsum.photos/id/70/800/600", alt: "Feature 6", width: 800, height: 600 },
];

/** 1:1 avatar images for testimonials / team */
export const avatarImages: StockImage[] = [
  { url: "https://picsum.photos/id/91/200/200", alt: "Avatar 1", width: 200, height: 200 },
  { url: "https://picsum.photos/id/92/200/200", alt: "Avatar 2", width: 200, height: 200 },
  { url: "https://picsum.photos/id/93/200/200", alt: "Avatar 3", width: 200, height: 200 },
  { url: "https://picsum.photos/id/94/200/200", alt: "Avatar 4", width: 200, height: 200 },
  { url: "https://picsum.photos/id/95/200/200", alt: "Avatar 5", width: 200, height: 200 },
  { url: "https://picsum.photos/id/96/200/200", alt: "Avatar 6", width: 200, height: 200 },
];

/** Landscape blog/card images */
export const cardImages: StockImage[] = [
  { url: "https://picsum.photos/id/100/600/400", alt: "Card image 1", width: 600, height: 400 },
  { url: "https://picsum.photos/id/110/600/400", alt: "Card image 2", width: 600, height: 400 },
  { url: "https://picsum.photos/id/120/600/400", alt: "Card image 3", width: 600, height: 400 },
];

/**
 * Get a feature image by zero-based index (wraps around if index exceeds length).
 */
export function getFeatureImage(index: number): StockImage {
  return featureImages[index % featureImages.length];
}

/**
 * Get an avatar image by zero-based index (wraps around if index exceeds length).
 */
export function getAvatarImage(index: number): StockImage {
  return avatarImages[index % avatarImages.length];
}

export const assets = { heroImage, featureImages, avatarImages, cardImages, getFeatureImage, getAvatarImage };
export default assets;
