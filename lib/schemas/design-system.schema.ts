import { z } from "zod";

export const DesignSystemRequestSchema = z.object({
  appName: z.string().min(1).default("My App"),
  primary: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color").default("#6366f1"),
  secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#8b5cf6"),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#06b6d4"),
  background: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#0a0a0a"),
  text: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#f1f5f9"),
  radius: z.string().default("8px"),
  fontFamily: z.string().default("Inter"),
});

export const DesignSystemResponseSchema = z.object({
  cssVariables: z.string(),
  tailwindConfig: z.string(),
  tokens: z.string(),
});

export type DesignSystemRequest = z.infer<typeof DesignSystemRequestSchema>;
export type DesignSystemResponse = z.infer<typeof DesignSystemResponseSchema>;
