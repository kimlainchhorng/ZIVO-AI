import OpenAI from "openai";

export interface ApiGeneratorResult {
  files: { path: string; content: string; action: "create" }[];
  endpoints: { method: string; path: string; description: string }[];
}

const API_SYSTEM_PROMPT = `You are an expert Next.js API developer.

Generate COMPLETE CRUD API routes for Next.js App Router.

For each resource, generate:
- GET /api/[resource] — list with pagination and filtering
- POST /api/[resource] — create with Zod validation
- GET /api/[resource]/[id] — get single
- PUT /api/[resource]/[id] — update with Zod validation
- DELETE /api/[resource]/[id] — delete with auth check

Every route must:
- Use Zod for input validation
- Return proper HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- Have structured error responses: { error: string, code?: string, details?: unknown }
- Include auth checks where appropriate
- Have TypeScript types for all inputs/outputs
- Use try/catch with proper error handling

Return ONLY valid JSON:
{
  "files": [{ "path": "app/api/[resource]/route.ts", "content": "complete file", "action": "create" }],
  "endpoints": [{ "method": "GET", "path": "/api/users", "description": "List users" }]
}`;

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function generateApiRoutes(
  resources: string[],
  appDescription: string,
  dbSchema?: string,
  model = "gpt-4o"
): Promise<ApiGeneratorResult> {
  const client = getClient();
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: API_SYSTEM_PROMPT },
      {
        role: "user",
        content: `App: ${appDescription}\nResources: ${resources.join(", ")}\n${dbSchema ? `DB Schema:\n${dbSchema}` : ""}`,
      },
    ],
    temperature: 0.2,
    max_tokens: 16000,
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    return JSON.parse(match ? match[0] : raw) as ApiGeneratorResult;
  } catch {
    throw new Error("Failed to parse OpenAI response as valid JSON for API routes");
  }
}
