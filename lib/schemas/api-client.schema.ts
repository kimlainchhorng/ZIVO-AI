import { z } from "zod";

export const APIClientRequestSchema = z.object({
  openApiSpec: z.string().min(10, "OpenAPI spec is required"),
  language: z.enum(["typescript", "python", "curl"]),
  clientName: z.string().min(1).default("ApiClient"),
});

export const APIClientFileSchema = z.object({
  path: z.string(),
  content: z.string(),
});

export const APIClientResponseSchema = z.object({
  files: z.array(APIClientFileSchema),
  usage: z.string(),
  dependencies: z.array(z.string()),
});

export type APIClientRequest = z.infer<typeof APIClientRequestSchema>;
export type APIClientResponse = z.infer<typeof APIClientResponseSchema>;
