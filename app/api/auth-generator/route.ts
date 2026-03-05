// app/api/auth-generator/route.ts — Complete authentication system generator

import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export interface AuthFile {
  path: string;
  content: string;
  action: "create";
}

export interface AuthGeneratorResponse {
  files: AuthFile[];
  summary: string;
  setupInstructions: string;
  envVars: string[];
}

const ALWAYS_GENERATED_FILES = [
  "app/(auth)/login/page.tsx",
  "app/(auth)/signup/page.tsx",
  "app/(auth)/forgot-password/page.tsx",
  "middleware.ts",
  "lib/auth.ts",
  "lib/auth-context.tsx",
];

const AUTH_SYSTEM_PROMPT = `You are ZIVO AI — a Next.js authentication specialist. Generate a complete, production-ready authentication system.

Return ONLY a valid JSON object (no markdown fences):
{
  "files": [
    { "path": "app/(auth)/login/page.tsx", "content": "...", "action": "create" },
    { "path": "app/(auth)/signup/page.tsx", "content": "...", "action": "create" },
    { "path": "app/(auth)/forgot-password/page.tsx", "content": "...", "action": "create" },
    { "path": "middleware.ts", "content": "...", "action": "create" },
    { "path": "lib/auth.ts", "content": "...", "action": "create" },
    { "path": "lib/auth-context.tsx", "content": "...", "action": "create" }
  ],
  "summary": "Complete authentication system with login, signup, password reset, middleware, and context",
  "setupInstructions": "Step-by-step setup instructions",
  "envVars": ["NEXT_PUBLIC_SUPABASE_URL=your-url", "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key"]
}

Rules:
- Always generate ALL 6 required files listed in "files"
- Use TypeScript strict mode, Tailwind CSS for styling
- Login page: email + password form with validation
- Signup page: email + password + confirm password with validation  
- Forgot password page: email form for password reset
- middleware.ts: protect private routes, redirect unauthenticated users to /login
- lib/auth.ts: helper functions (getSession, signIn, signOut, signUp, resetPassword)
- lib/auth-context.tsx: React context provider with useAuth hook
- Dark theme styling matching a modern SaaS app
- No placeholder comments — write full, working code`;

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const PROVIDER_ENV_VARS: Record<string, string[]> = {
  supabase: [
    "NEXT_PUBLIC_SUPABASE_URL=your-supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key",
  ],
  "next-auth": [
    "NEXTAUTH_URL=http://localhost:3000",
    "NEXTAUTH_SECRET=your-secret-key",
    "GOOGLE_CLIENT_ID=your-google-client-id",
    "GOOGLE_CLIENT_SECRET=your-google-client-secret",
  ],
  clerk: [
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-publishable-key",
    "CLERK_SECRET_KEY=your-secret-key",
    "NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in",
    "NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up",
  ],
};

export async function POST(req: Request): Promise<Response> {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { provider = "supabase", appName } = body as {
    provider?: "supabase" | "next-auth" | "clerk";
    appName?: string;
  };

  const validProviders = ["supabase", "next-auth", "clerk"];
  if (!validProviders.includes(provider)) {
    return NextResponse.json(
      { error: `Invalid provider. Must be one of: ${validProviders.join(", ")}` },
      { status: 400 }
    );
  }

  const effectiveAppName = typeof appName === "string" && appName.trim() ? appName.trim() : "My App";

  const providerInstructions: Record<string, string> = {
    supabase: "Use Supabase Auth (@supabase/supabase-js, @supabase/ssr). Include createClient helpers for server and client components.",
    "next-auth": "Use NextAuth.js v5 (Auth.js). Include auth.ts config, route handler at app/api/auth/[...nextauth]/route.ts, and SessionProvider.",
    clerk: "Use Clerk (@clerk/nextjs). Include ClerkProvider, clerkMiddleware, and Clerk's built-in SignIn/SignUp components.",
  };

  try {
    const client = getClient();
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
      max_tokens: 8192,
      messages: [
        { role: "system", content: AUTH_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Generate a complete authentication system for "${effectiveAppName}" using ${provider}.\n\nProvider details: ${providerInstructions[provider]}\n\nRequired files: ${ALWAYS_GENERATED_FILES.join(", ")}`,
        },
      ],
    });

    const rawText = response.choices?.[0]?.message?.content ?? "";
    let parsed: AuthGeneratorResponse;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText) as AuthGeneratorResponse;
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    // Ensure envVars uses provider defaults if AI didn't provide them
    if (!parsed.envVars?.length) {
      parsed.envVars = PROVIDER_ENV_VARS[provider] ?? [];
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message ?? "Failed to generate auth system" },
      { status: 500 }
    );
  }
}
