import { getOpenAIClient } from "@/lib/openai-client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";


const SYSTEM_PROMPT = `You are an expert in Supabase authentication and React. Generate a complete authentication system.

Return a JSON object with this structure:
{
  "description": "string",
  "files": {
    "src/lib/auth.ts": "...",
    "src/hooks/useAuth.ts": "...",
    "src/components/auth/LoginForm.tsx": "...",
    "src/components/auth/RegisterForm.tsx": "...",
    "src/components/auth/ForgotPassword.tsx": "...",
    "src/components/auth/ProtectedRoute.tsx": "...",
    "src/context/AuthContext.tsx": "...",
    "supabase/migrations/002_auth_setup.sql": "..."
  },
  "features": ["string"],
  "supabaseConfig": {
    "authProviders": ["string"],
    "rlsPolicies": ["string"],
    "emailTemplates": ["string"]
  }
}

Include:
- Email/password authentication
- OTP magic link login
- Social OAuth setup (Google, GitHub)
- JWT session management
- Protected route wrapper component
- Auth context with React hooks
- Role-based access control (RBAC)
- Password reset flow
- Email verification
- MFA support instructions`;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { prompt, providers } = body;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY in .env.local" }, { status: 500 });
    }
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const userMessage = [
      `Generate a Supabase authentication system for: ${prompt}`,
      providers?.length ? `Auth providers: ${providers.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const r = await getOpenAIClient().responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    });

    const text = (r as any).output_text ?? "";

    let parsed: any = null;
    try {
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\})/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[1] : text);
    } catch {
      parsed = { raw: text };
    }

    return NextResponse.json({ ok: true, result: parsed });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Auth generation failed" }, { status: 500 });
  }
}
