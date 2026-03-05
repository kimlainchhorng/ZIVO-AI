// app/api/auth-builder/route.ts — AI Authentication Builder

import { NextResponse } from "next/server";
import { generateAuth } from "@/lib/ai/auth-generator";
import type { AuthProvider, AuthFeature } from "@/lib/ai/auth-generator";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    description: "AI Auth Builder — POST { provider, features, appName? } to generate authentication files",
    providers: ["supabase", "clerk", "auth0", "firebase"],
    features: ["login", "signup", "oauth", "password-reset", "magic-link", "mfa"],
  });
}

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

  const {
    provider = "supabase",
    features = ["login", "signup"],
    appName,
  } = body as {
    provider?: AuthProvider;
    features?: AuthFeature[];
    appName?: string;
  };

  const validProviders: AuthProvider[] = ["supabase", "clerk", "auth0", "firebase"];
  if (!validProviders.includes(provider)) {
    return NextResponse.json(
      { error: `provider must be one of: ${validProviders.join(", ")}` },
      { status: 400 }
    );
  }

  const validFeatures: AuthFeature[] = ["login", "signup", "oauth", "password-reset", "magic-link", "mfa"];
  const safeFeatures = (Array.isArray(features) ? features : []).filter((f) =>
    validFeatures.includes(f)
  ) as AuthFeature[];

  const safeAppName =
    typeof appName === "string" && appName.trim()
      ? appName.trim().replace(/[`"'\\<>{}[\]]/g, "").slice(0, 64) || "My App"
      : "My App";

  try {
    const config = await generateAuth(provider, safeFeatures, safeAppName);
    return NextResponse.json(config);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message ?? "Failed to generate auth system" },
      { status: 500 }
    );
  }
}
