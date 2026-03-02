import OpenAI from "openai";

export type ImageStyle =
  | "realistic"
  | "minimalist"
  | "artistic"
  | "corporate"
  | "modern"
  | "flat";

export type ImageSize = "1024x1024" | "1792x1024" | "1024x1792";

export interface ImageGenerationOptions {
  prompt: string;
  style?: ImageStyle;
  size?: ImageSize;
  quality?: "standard" | "hd";
  n?: number;
}

export interface GeneratedImage {
  url: string;
  revisedPrompt?: string;
}

const STYLE_PROMPTS: Record<ImageStyle, string> = {
  realistic: "photorealistic, high detail, professional photography",
  minimalist: "minimalist design, clean lines, simple, white background",
  artistic: "artistic illustration, vibrant colors, creative",
  corporate: "professional, corporate, business-oriented, polished",
  modern: "modern design, sleek, contemporary",
  flat: "flat design, vector style, bold colors, simple shapes",
};

export async function generateImage(
  client: OpenAI,
  options: ImageGenerationOptions
): Promise<GeneratedImage[]> {
  const {
    prompt,
    style = "modern",
    size = "1024x1024",
    quality = "standard",
    n = 1,
  } = options;

  const styleModifier = STYLE_PROMPTS[style];
  const enhancedPrompt = `${prompt}, ${styleModifier}`;

  const response = await client.images.generate({
    model: "dall-e-3",
    prompt: enhancedPrompt,
    size,
    quality,
    n,
  });

  return (response.data ?? []).map((img) => ({
    url: img.url ?? "",
    revisedPrompt: img.revised_prompt,
  }));
}

export function buildHeroImagePrompt(appName: string, description: string): string {
  return `Hero image for "${appName}" application: ${description}. Professional, eye-catching, suitable for a website landing page.`;
}

export function buildLogoPrompt(appName: string, description: string): string {
  return `Logo icon for "${appName}": ${description}. Simple, memorable, scalable logo design suitable for app icon.`;
}

export function buildSocialMediaPrompt(
  platform: string,
  appName: string,
  message: string
): string {
  const platformContext: Record<string, string> = {
    twitter: "Twitter/X post image, 16:9 aspect ratio",
    linkedin: "LinkedIn post image, professional",
    instagram: "Instagram post, square format, visually appealing",
  };
  const ctx = platformContext[platform.toLowerCase()] ?? "social media post";
  return `${ctx} for "${appName}": ${message}. Engaging, brand-consistent design.`;
}

export function buildMarketingPrompt(
  type: string,
  appName: string,
  content: string
): string {
  return `Marketing ${type} for "${appName}": ${content}. Professional, conversion-focused design.`;
}
