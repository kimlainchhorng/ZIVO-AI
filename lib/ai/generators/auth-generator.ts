import OpenAI from "openai";

export interface AuthGeneratorResult {
  files: { path: string; content: string; action: "create" }[];
  envVars: string[];
  commands: string[];
}

export type AuthProvider = "supabase" | "nextauth" | "clerk";

const AUTH_SYSTEM_PROMPT = `You are an expert Next.js authentication engineer.

Generate a COMPLETE authentication system with ALL of these files:
1. app/(auth)/login/page.tsx — Login form with email/password
2. app/(auth)/signup/page.tsx — Signup form with email/password/name
3. app/(auth)/layout.tsx — Auth layout (centered card)
4. middleware.ts — Protect dashboard routes, redirect unauthenticated
5. lib/auth.ts — Auth helper functions (getSession, getUser, signIn, signOut)

For Supabase auth:
- Use @supabase/supabase-js createBrowserClient / createServerClient
- Use SSR cookie-based session
- Include Row Level Security setup SQL in a comment
- Import from @supabase/ssr for server components

For NextAuth:
- Use NextAuth.js v5 with Prisma adapter
- Include providers: credentials, google (optional)
- Include session: jwt strategy
- Include auth.ts config file

Return ONLY valid JSON:
{
  "files": [{ "path": "...", "content": "complete file content", "action": "create" }],
  "envVars": ["NEXT_PUBLIC_SUPABASE_URL=your-url"],
  "commands": ["npm install @supabase/supabase-js @supabase/ssr"]
}`;

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function generateAuth(
  provider: AuthProvider = "supabase",
  appDescription = "",
  model = "gpt-4o"
): Promise<AuthGeneratorResult> {
  const client = getClient();
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: AUTH_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Auth provider: ${provider}\nApp: ${appDescription}\n\nGenerate complete auth system for this app.`,
      },
    ],
    temperature: 0.2,
    max_tokens: 16000,
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    return JSON.parse(match ? match[0] : raw) as AuthGeneratorResult;
  } catch {
    throw new Error("Failed to parse OpenAI response as valid JSON for auth system");
  }
}
