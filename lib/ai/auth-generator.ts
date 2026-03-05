// lib/ai/auth-generator.ts — AI Authentication Generator

import OpenAI from "openai";

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
