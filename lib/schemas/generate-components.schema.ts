import { z } from "zod";

export const GenerateComponentsRequestSchema = z.object({
  component: z.enum([
    "dashboard", "data-table", "form-builder", "file-upload",
    "rich-text-editor", "date-picker", "command-palette", "toast",
    "infinite-scroll", "all",
  ]),
  description: z.string().optional().default(""),
});

export const ComponentFileSchema = z.object({
  path: z.string(),
  content: z.string(),
  action: z.enum(["create", "update", "delete"]),
});

export const GenerateComponentsResponseSchema = z.object({
  files: z.array(ComponentFileSchema),
  summary: z.string(),
  dependencies: z.array(z.string()),
});

export type GenerateComponentsRequest = z.infer<typeof GenerateComponentsRequestSchema>;
export type GenerateComponentsResponse = z.infer<typeof GenerateComponentsResponseSchema>;
