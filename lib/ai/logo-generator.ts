// lib/ai/logo-generator.ts — AI-driven SVG logo generator

import OpenAI from "openai";

export interface LogoGeneratorOptions {
  brandName: string;
  styleHints?: string;
  model?: string;
}

export interface LogoGeneratorResult {
  svg: string;
}

/**
 * Fallback logo used when AI generation is unavailable or fails.
 * Safe inline SVG — no external refs, no scripts.
 */
export function getFallbackSvgLogo(brandName = ""): string {
  const initials = brandName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" aria-label="${brandName} logo">` +
    `<rect width="48" height="48" rx="10" fill="#6366f1"/>` +
    (initials
      ? `<text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" ` +
        `font-family="system-ui,sans-serif" font-size="20" font-weight="700" fill="white">${initials}</text>`
      : `<path d="M12 36 L24 12 L36 36 Z" fill="white" opacity="0.9"/>`) +
    `</svg>`
  );
}

const LOGO_SYSTEM_PROMPT = `You are an SVG logo designer. Create a clean, minimal, professional SVG logo.

Rules:
- Return ONLY the raw <svg ...>...</svg> markup — no markdown, no explanation.
- viewBox must be "0 0 48 48".
- Use only inline SVG elements: rect, circle, ellipse, path, polygon, text, g.
- No external references (no <image>, no xlink:href with http, no <script>).
- No embedded JavaScript or event handlers.
- Keep the design simple: 1–3 shapes + optional brand initials text.
- Colors should be harmonious; prefer a single accent color on a solid background.`;

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY environment variable is not set");
  return new OpenAI({ apiKey });
}

/**
 * Strips any markdown fences or surrounding prose, returning only the SVG tag.
 */
function extractSvg(raw: string): string | null {
  const match = raw.match(/<svg[\s\S]*<\/svg>/i);
  return match ? match[0] : null;
}

/**
 * Basic safety check: ensure the SVG contains no scripts or external refs.
 */
function isSafeSvg(svg: string): boolean {
  const lower = svg.toLowerCase();
  if (lower.includes("<script")) return false;
  // Match event handler attributes (onclick=, onmouseover=, etc.) at word boundaries
  if (/\bon\w+\s*=/.test(lower)) return false;
  if (/xlink:href\s*=\s*["']https?:/i.test(svg)) return false; // external images
  return true;
}

/**
 * Generate an AI-produced SVG logo for the given brand.
 * Falls back to a geometric initials logo if generation fails or produces unsafe output.
 */
export async function generateSvgLogo(
  options: LogoGeneratorOptions
): Promise<LogoGeneratorResult> {
  const { brandName, styleHints, model = "gpt-4o" } = options;

  const userPrompt = [
    `Brand name: "${brandName}"`,
    styleHints ? `Style hints: ${styleHints}` : "",
    "Create a compact 48×48 SVG logo.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const client = getClient();

    const response = await client.chat.completions.create({
      model,
      temperature: 0.7,
      max_tokens: 1024,
      messages: [
        { role: "system", content: LOGO_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = response.choices?.[0]?.message?.content ?? "";
    const svg = extractSvg(raw);

    if (svg && isSafeSvg(svg)) {
      return { svg };
    }
  } catch {
    // Fall through to fallback
  }

  return { svg: getFallbackSvgLogo(brandName) };
}
