// lib/ai/website-plan.ts — WebsitePlan schema + AI-driven plan generator

import { z } from "zod";
import OpenAI from "openai";

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

export const SectionTypeSchema = z.enum([
  "hero",
  "logos",
  "features",
  "pricing",
  "testimonials",
  "faq",
  "cta",
  "footer",
  "about",
  "contact",
]);
export type SectionType = z.infer<typeof SectionTypeSchema>;

export const SectionContentSchema = z.object({
  headline: z.string(),
  subheadline: z.string().optional(),
  bullets: z.array(z.string()).optional(),
  ctaText: z.string().optional(),
  ctaHref: z.string().optional(),
});
export type SectionContent = z.infer<typeof SectionContentSchema>;

export const SectionSpecSchema = z.object({
  type: SectionTypeSchema,
  content: SectionContentSchema,
});
export type SectionSpec = z.infer<typeof SectionSpecSchema>;

export const PageSpecSchema = z.object({
  route: z.string(),
  title: z.string(),
  sections: z.array(SectionSpecSchema),
});
export type PageSpec = z.infer<typeof PageSpecSchema>;

export const BrandSpecSchema = z.object({
  name: z.string(),
  tagline: z.string(),
  tone: z.enum(["professional", "friendly", "playful", "minimal", "bold"]),
  primaryColor: z.string(),
  fontStyle: z.enum(["sans", "serif", "mono", "display"]),
});
export type BrandSpec = z.infer<typeof BrandSpecSchema>;

export const AssetsRequestSchema = z.object({
  heroImageConcept: z.string(),
  featureImageConcepts: z.array(z.string()),
  avatarConcepts: z.array(z.string()),
});
export type AssetsRequest = z.infer<typeof AssetsRequestSchema>;

export const WebsitePlanSchema = z.object({
  brand: BrandSpecSchema,
  pages: z.array(PageSpecSchema),
  assets: AssetsRequestSchema,
});
export type WebsitePlan = z.infer<typeof WebsitePlanSchema>;

// ─── AI Generator ─────────────────────────────────────────────────────────────

const WEBSITE_PLAN_SYSTEM_PROMPT = `You are a website architect. Given a user prompt, generate a structured website plan.

Return ONLY valid JSON matching this schema exactly:
{
  "brand": {
    "name": "string",
    "tagline": "string",
    "tone": "professional" | "friendly" | "playful" | "minimal" | "bold",
    "primaryColor": "#hex",
    "fontStyle": "sans" | "serif" | "mono" | "display"
  },
  "pages": [
    {
      "route": "/",
      "title": "string",
      "sections": [
        {
          "type": "hero" | "logos" | "features" | "pricing" | "testimonials" | "faq" | "cta" | "footer" | "about" | "contact",
          "content": {
            "headline": "string",
            "subheadline": "string (optional)",
            "bullets": ["string"] (optional),
            "ctaText": "string (optional)",
            "ctaHref": "string (optional)"
          }
        }
      ]
    }
  ],
  "assets": {
    "heroImageConcept": "string",
    "featureImageConcepts": ["string", "string", "string"],
    "avatarConcepts": ["string", "string", "string"]
  }
}

Always include at minimum: /, /about, /contact pages. Homepage must have hero + features + cta + footer sections.`;

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY environment variable is not set");
  return new OpenAI({ apiKey });
}

export async function generateWebsitePlan(
  prompt: string,
  model = "gpt-4o"
): Promise<WebsitePlan> {
  const client = getClient();

  const response = await client.chat.completions.create({
    model,
    temperature: 0.3,
    max_tokens: 4096,
    messages: [
      { role: "system", content: WEBSITE_PLAN_SYSTEM_PROMPT },
      { role: "user", content: `Website prompt: ${prompt}` },
    ],
  });

  const raw = response.choices?.[0]?.message?.content ?? "{}";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);

  try {
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw) as unknown;
    return WebsitePlanSchema.parse(parsed);
  } catch {
    // Return a safe default plan if parsing fails
    return WebsitePlanSchema.parse({
      brand: {
        name: "My Website",
        tagline: "Welcome to our site",
        tone: "professional",
        primaryColor: "#6366f1",
        fontStyle: "sans",
      },
      pages: [
        {
          route: "/",
          title: "Home",
          sections: [
            {
              type: "hero",
              content: { headline: prompt, subheadline: "Get started today", ctaText: "Learn More", ctaHref: "/about" },
            },
            {
              type: "features",
              content: { headline: "Our Features", bullets: ["Fast", "Reliable", "Scalable"] },
            },
            {
              type: "cta",
              content: { headline: "Ready to get started?", ctaText: "Contact Us", ctaHref: "/contact" },
            },
            {
              type: "footer",
              content: { headline: "My Website" },
            },
          ],
        },
        {
          route: "/about",
          title: "About",
          sections: [
            { type: "about", content: { headline: "About Us" } },
            { type: "footer", content: { headline: "My Website" } },
          ],
        },
        {
          route: "/contact",
          title: "Contact",
          sections: [
            { type: "contact", content: { headline: "Get in Touch", ctaText: "Send Message" } },
            { type: "footer", content: { headline: "My Website" } },
          ],
        },
      ],
      assets: {
        heroImageConcept: "modern abstract technology",
        featureImageConcepts: ["analytics dashboard", "mobile app", "team collaboration"],
        avatarConcepts: ["professional person 1", "professional person 2", "professional person 3"],
      },
    });
  }
}
