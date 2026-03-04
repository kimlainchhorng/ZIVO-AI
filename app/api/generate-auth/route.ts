import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface AuthFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateAuthRequest {
  provider?: "clerk" | "supabase" | "nextauth" | "lucia";
  features?: string[];
  appName?: string;
}

export interface GenerateAuthResponse {
  files: AuthFile[];
  summary: string;
  setupInstructions: string;
  envVars: string[];
  commands: string[];
}

const AUTH_SYSTEM_PROMPT = `You are ZIVO AI — an expert full-stack developer specializing in authentication systems for Next.js App Router.

Generate a complete, production-ready authentication system.

When given a request, respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "setupInstructions": "Step-by-step setup instructions",
  "envVars": ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=..."],
  "commands": ["npm install @clerk/nextjs"]
}

Always include:
- app/(auth)/login/page.tsx — Login page with styled form
- app/(auth)/register/page.tsx — Registration page
- middleware.ts — Protected route middleware with matcher config
- components/providers/AuthProvider.tsx — Auth context provider
- lib/auth.ts — Auth utility functions and session helpers
- hooks/useAuth.ts — Custom React hook for auth state

Use TypeScript, Tailwind CSS, and production best practices.
Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const {
      provider = "nextauth",
      features = ["oauth-google", "oauth-github"],
      appName = "My App",
    }: GenerateAuthRequest = body;

    const featureList = Array.isArray(features) ? features : ["oauth-google"];
    const hasOAuth = featureList.some((f) => f.startsWith("oauth-"));
    const hasMagicLink = featureList.includes("magic-link");
    const has2FA = featureList.includes("2fa");

    const providerInstructions: Record<string, string> = {
      clerk: "Use Clerk for authentication. Import from @clerk/nextjs. Include ClerkProvider, SignIn/SignUp components, useUser/useAuth hooks, and route protection via clerkMiddleware.",
      supabase: "Use Supabase Auth. Import from @supabase/supabase-js and @supabase/ssr. Include createClient helper for server/client, auth callbacks route, and session management.",
      nextauth: "Use NextAuth.js v5 (Auth.js). Include auth.ts config, app/api/auth/[...nextauth]/route.ts, Session provider, and useSession hook.",
      lucia: "Use Lucia Auth v3. Include lucia.ts config, session middleware, login/logout action server functions, and validateRequest helper.",
    };

    const userPrompt = `Generate a complete authentication system for a Next.js App Router project called "${appName}".
Auth provider: ${provider}
Provider instructions: ${providerInstructions[provider] ?? providerInstructions["nextauth"]}
Features requested: ${featureList.join(", ")}

${hasOAuth ? `Include OAuth providers: ${featureList.filter((f) => f.startsWith("oauth-")).map((f) => f.replace("oauth-", "")).join(", ")}` : ""}
${hasMagicLink ? "Include magic link / passwordless email sign-in flow." : ""}
${has2FA ? "Include two-factor authentication (TOTP via authenticator app + backup codes)." : ""}

Generate:
- Auth configuration files
- Login page (app/(auth)/login/page.tsx) with all enabled auth methods
- Register page (app/(auth)/register/page.tsx)
- Protected route middleware (middleware.ts)
- Auth context provider (components/providers/AuthProvider.tsx)
- Session handling hooks (hooks/useAuth.ts)
- Auth utilities (lib/auth.ts)
- Profile page (app/(auth)/profile/page.tsx)
- Password reset flow (if applicable)`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 8192,
      messages: [
        { role: "system", content: AUTH_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateAuthResponse;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json(
          { error: "AI did not return valid JSON" },
          { status: 502 }
        );
      }
      parsed = JSON.parse(match[0]);
    }

    if (!Array.isArray(parsed.files)) {
      return NextResponse.json(
        { error: "Invalid response structure: missing files array" },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
