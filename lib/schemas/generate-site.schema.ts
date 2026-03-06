import { z } from "zod";

export const GenerateSiteRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required").max(5000),
  siteType: z.enum(["landing", "saas", "ecommerce", "dashboard", "portfolio", "blog"]).optional(),
  colorScheme: z.string().optional(),
  fontFamily: z.string().optional(),
  includeAuth: z.boolean().optional().default(false),
  includePayments: z.boolean().optional().default(false),
  style: z.enum(["modern", "minimal", "bold", "elegant", "playful"]).optional().default("modern"),
  pages: z.array(z.string()).optional(),
});

export const GeneratedFileSchema = z.object({
  path: z.string(),
  content: z.string(),
  action: z.enum(["create", "update", "delete"]),
});

export const GenerateSiteResponseSchema = z.object({
  files: z.array(GeneratedFileSchema),
  preview_html: z.string().optional(),
  summary: z.string().optional(),
  notes: z.string().optional(),
  iterationCount: z.number().optional(),
  projectId: z.string().optional(),
});

export type GenerateSiteRequest = z.infer<typeof GenerateSiteRequestSchema>;
export type GeneratedFile = z.infer<typeof GeneratedFileSchema>;
export type GenerateSiteResponse = z.infer<typeof GenerateSiteResponseSchema>;
