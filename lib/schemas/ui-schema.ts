/**
 * lib/schemas/ui-schema.ts
 * Zod schemas for validated UI output used by generate-ui and generate-section APIs.
 * These are the canonical schemas as specified in the platform upgrade spec.
 */
import { z } from 'zod';

// ─── Section ─────────────────────────────────────────────────────────────────

export const SectionSchema = z.object({
  id: z.string(),
  type: z.enum([
    'hero',
    'features',
    'pricing',
    'testimonials',
    'faq',
    'contact',
    'dashboard-cards',
    'login-signup',
    'navigation',
    'footer',
  ]),
  title: z.string(),
  content: z.string(),
  style: z.record(z.string()).optional(),
  order: z.number(),
});

// ─── UIOutput ─────────────────────────────────────────────────────────────────

export const UIOutputSchema = z.object({
  projectId: z.string(),
  preset: z.string(),
  pages: z.array(
    z.object({
      name: z.string(),
      slug: z.string(),
      sections: z.array(SectionSchema),
    })
  ),
  navigation: z
    .object({
      links: z.array(z.object({ label: z.string(), href: z.string() })),
    })
    .optional(),
  footer: z
    .object({
      text: z.string(),
      links: z.array(z.object({ label: z.string(), href: z.string() })),
    })
    .optional(),
  generatedAt: z.string(),
});

export type Section = z.infer<typeof SectionSchema>;
export type UIOutput = z.infer<typeof UIOutputSchema>;
