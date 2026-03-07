// lib/ai/auth-generator.ts — AI Authentication Generator

import OpenAI from "openai";
import { safeParseJSON } from "./json-repair";

export type AuthProvider = "supabase" | "clerk" | "auth0" | "firebase";
export type AuthFeature =
  | "login"
  | "signup"
  | "oauth"
  | "password-reset"
  | "magic-link"
  | "mfa";

export interface AuthFile {
  path: string;
  content: string;
  action: "create";
}

export interface AuthConfig {
  files: AuthFile[];
  setup_instructions: string;
  env_vars_needed: string[];
}

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const PROVIDER_ENV_VARS: Record<AuthProvider, string[]> = {
  supabase: [
    "NEXT_PUBLIC_SUPABASE_URL=your-supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key",
  ],
  clerk: [
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-publishable-key",
    "CLERK_SECRET_KEY=your-secret-key",
    "NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in",
    "NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up",
  ],
  auth0: [
    "AUTH0_SECRET=your-secret",
    "AUTH0_BASE_URL=http://localhost:3000",
    "AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com",
    "AUTH0_CLIENT_ID=your-client-id",
    "AUTH0_CLIENT_SECRET=your-client-secret",
  ],
  firebase: [
    "NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id",
    "NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id",
  ],
};

const AUTH_SYSTEM_PROMPT = `You are a Next.js authentication expert. Generate a complete, production-ready authentication system.

Return ONLY a valid JSON object (no markdown fences):
{
  "files": [
    { "path": "app/(auth)/login/page.tsx", "content": "...", "action": "create" },
    { "path": "app/(auth)/signup/page.tsx", "content": "...", "action": "create" },
    { "path": "app/(auth)/reset-password/page.tsx", "content": "...", "action": "create" },
    { "path": "middleware.ts", "content": "...", "action": "create" },
    { "path": "lib/auth.ts", "content": "...", "action": "create" }
  ],
  "setup_instructions": "Step-by-step setup instructions as a string",
  "env_vars_needed": ["KEY=value"]
}

Rules:
- Use TypeScript strict mode
- Dark theme styling (bg: #0a0b14, accent: #6366f1) 
- Full working code, no placeholders
- Include proper error handling
- Middleware protects /dashboard, /app routes; allows /api, /(auth) routes`;

export async function generateAuth(
  provider: AuthProvider,
  features: AuthFeature[],
  appName = "My App"
): Promise<AuthConfig> {
  const client = getClient();

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.3,
    max_tokens: 8192,
    messages: [
      { role: "system", content: AUTH_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Generate authentication system for "${appName}" using ${provider}.\nFeatures: ${features.join(", ")}\nProvider: ${provider}`,
      },
    ],
  });

  const rawText = response.choices?.[0]?.message?.content ?? "";
  let parsed: AuthConfig;
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText) as AuthConfig;
  } catch {
    throw new Error("Failed to parse AI response for auth system");
  }

  if (!parsed.env_vars_needed?.length) {
    parsed.env_vars_needed = PROVIDER_ENV_VARS[provider] ?? [];
  }

  return {
    files: parsed.files ?? [],
    setup_instructions: parsed.setup_instructions ?? "",
    env_vars_needed: parsed.env_vars_needed,
  };
}

/**
 * Generate Next.js middleware for route protection.
 */
export async function generateAuthMiddleware(
  blueprint: import('./blueprint-generator').Blueprint
): Promise<import('./schema').GeneratedFile> {
  const client = getClient();
  const protectedRoutes = blueprint.pages
    .filter((p) => p.requiresAuth)
    .map((p) => p.route);

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.2,
    max_tokens: 2048,
    messages: [
      {
        role: 'system',
        content: `You are a Next.js security expert. Generate a complete middleware.ts for route protection.
Return ONLY valid JSON (no markdown fences):
{ "path": "middleware.ts", "content": "full file content", "action": "create", "language": "typescript" }

Rules:
- Protect these routes: ${protectedRoutes.join(', ') || '/dashboard'}
- Allow public routes: /, /login, /signup, /api/health, /_next, /favicon.ico
- Redirect unauthenticated users to /login
- Use Supabase auth by default`,
      },
      {
        role: 'user',
        content: `Generate middleware for app: ${blueprint.goal}. Auth required: ${blueprint.authRequired}`,
      },
    ],
  });

  const raw = response.choices?.[0]?.message?.content ?? '';
  const fallback: import('./schema').GeneratedFile = {
    path: 'middleware.ts',
    content: `import { NextResponse } from 'next/server';\nimport type { NextRequest } from 'next/server';\n\nexport function middleware(request: NextRequest) {\n  return NextResponse.next();\n}\n\nexport const config = { matcher: ['/((?!_next|favicon.ico).*)'] };\n`,
    action: 'create',
    language: 'typescript',
  };

  const parsed = safeParseJSON<import('./schema').GeneratedFile>(raw, fallback);
  return { ...parsed, action: 'create' };
}

/**
 * Generate role-based access control configuration.
 */
export async function generateRBACConfig(
  blueprint: import('./blueprint-generator').Blueprint
): Promise<import('./schema').GeneratedFile> {
  const client = getClient();

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.2,
    max_tokens: 2048,
    messages: [
      {
        role: 'system',
        content: `You are a security architect. Generate a TypeScript RBAC config file.
Return ONLY valid JSON (no markdown fences):
{ "path": "lib/rbac.ts", "content": "full file content", "action": "create", "language": "typescript" }

The config should define roles (admin, user, guest), permissions per role, and a helper to check access.`,
      },
      {
        role: 'user',
        content: `Generate RBAC config for: ${blueprint.goal}. Pages: ${blueprint.pages.map((p) => p.route).join(', ')}`,
      },
    ],
  });

  const raw = response.choices?.[0]?.message?.content ?? '';
  const fallback: import('./schema').GeneratedFile = {
    path: 'lib/rbac.ts',
    content: `export type Role = 'admin' | 'user' | 'guest';\nexport type Permission = 'read' | 'write' | 'delete' | 'admin';\n\nexport const ROLE_PERMISSIONS: Record<Role, Permission[]> = {\n  admin: ['read', 'write', 'delete', 'admin'],\n  user: ['read', 'write'],\n  guest: ['read'],\n};\n\nexport function hasPermission(role: Role, permission: Permission): boolean {\n  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;\n}\n`,
    action: 'create',
    language: 'typescript',
  };

  const parsed = safeParseJSON<import('./schema').GeneratedFile>(raw, fallback);
  return { ...parsed, action: 'create' };
}
