// lib/ai/blueprint-generator.ts — Generates a structured blueprint from a user prompt

import OpenAI from 'openai';
import { safeParseJSON } from './json-repair';

export interface FieldSpec {
  name: string;
  type: string;
  required: boolean;
  unique?: boolean;
  default?: string;
}

export interface TableSpec {
  name: string;
  fields: FieldSpec[];
  relations: string[];
}

export interface APIRouteSpec {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  auth: boolean;
  input: string;
  output: string;
}

export interface ComponentSpec {
  name: string;
  path: string;
  description: string;
  props: string[];
}

export interface PageSpec {
  route: string;
  name: string;
  description: string;
  components: string[];
  requiresAuth: boolean;
}

export interface Blueprint {
  goal: string;
  appType: string;
  pages: PageSpec[];
  components: ComponentSpec[];
  apiRoutes: APIRouteSpec[];
  tables: TableSpec[];
  authRequired: boolean;
  features: string[];
}

const BLUEPRINT_SYSTEM_PROMPT = `You are a senior software architect. Given a user prompt, enumerate ALL pages, components, API routes, and database tables required to build a complete production app.

Return ONLY valid JSON (no markdown fences):
{
  "goal": "one-sentence goal",
  "appType": "saas | ecommerce | blog | dashboard | marketplace | social | ...",
  "pages": [
    { "route": "/", "name": "Home", "description": "...", "components": ["Hero", "Features"], "requiresAuth": false }
  ],
  "components": [
    { "name": "Navbar", "path": "components/Navbar.tsx", "description": "...", "props": ["user", "onLogout"] }
  ],
  "apiRoutes": [
    { "path": "/api/users", "method": "GET", "description": "List users", "auth": true, "input": "query: { page, limit }", "output": "{ users: User[], total: number }" }
  ],
  "tables": [
    {
      "name": "users",
      "fields": [
        { "name": "id", "type": "uuid", "required": true, "unique": true },
        { "name": "email", "type": "text", "required": true, "unique": true }
      ],
      "relations": ["posts", "comments"]
    }
  ],
  "authRequired": true,
  "features": ["auth", "dashboard", "real-time", "payments"]
}

Rules:
- Include ALL pages (minimum 5 for any real app)
- Include ALL shared components (navbar, sidebar, footer, cards, modals, etc.)
- Include CRUD API routes for every table
- Include ALL DB tables with full field specs
- authRequired must be true if app has user accounts, dashboard, or protected routes`;

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Generate a structured Blueprint from a user prompt.
 */
export async function generateBlueprint(
  prompt: string,
  model = 'gpt-4o'
): Promise<Blueprint> {
  const client = getClient();
  const response = await client.chat.completions.create({
    model,
    temperature: 0.3,
    max_tokens: 4096,
    messages: [
      { role: 'system', content: BLUEPRINT_SYSTEM_PROMPT },
      { role: 'user', content: `Generate a complete blueprint for: ${prompt}` },
    ],
  });

  const raw = response.choices?.[0]?.message?.content ?? '';
  const fallback: Blueprint = {
    goal: prompt,
    appType: 'web',
    pages: [],
    components: [],
    apiRoutes: [],
    tables: [],
    authRequired: false,
    features: [],
  };
  return safeParseJSON<Blueprint>(raw, fallback);
}
