import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface MonetizationFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateMonetizationRequest {
  appName?: string;
  model?: "subscription" | "one-time" | "usage-based" | "all";
  tiers?: string[];
  lemonSqueezy?: boolean;
  usageBasedBilling?: boolean;
  freemiumFeatureFlags?: boolean;
  affiliateSystem?: boolean;
}

export interface GenerateMonetizationResponse {
  files: MonetizationFile[];
  summary: string;
  setupInstructions: string;
  requiredEnvVars: string[];
}

const MONETIZATION_SYSTEM_PROMPT = `You are ZIVO AI — an expert in SaaS monetization, Stripe integration, and LemonSqueezy.

Generate production-ready monetization code for a Next.js App Router project.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "setupInstructions": "Step-by-step instructions",
  "requiredEnvVars": ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"]
}

Always include:
- components/PricingPage.tsx — Beautiful 3-tier pricing table with Checkout integration
- app/api/stripe/webhook/route.ts — Stripe webhook handler
- app/api/stripe/create-checkout/route.ts — Create checkout session
- app/api/stripe/create-portal/route.ts — Customer billing portal
- lib/stripe.ts — Stripe client and helpers
- middleware.ts — Subscription gating that checks plan tier from Supabase/DB

Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const body = await req.json() as GenerateMonetizationRequest;
    const {
      appName = "My App",
      model = "subscription",
      tiers = ["Free", "Pro", "Enterprise"],
      lemonSqueezy = false,
      usageBasedBilling = false,
      freemiumFeatureFlags = false,
      affiliateSystem = false,
    } = body;

    const extraFeatures: string[] = [];
    if (lemonSqueezy) {
      extraFeatures.push(
        "LemonSqueezy integration: lib/lemonsqueezy.ts, app/api/lemonsqueezy/webhook/route.ts, app/api/lemonsqueezy/checkout/route.ts"
      );
    }
    if (usageBasedBilling) {
      extraFeatures.push(
        "Stripe Meter API for usage-based billing: lib/stripe-usage.ts with reportUsage() helper, app/api/stripe/report-usage/route.ts"
      );
    }
    if (freemiumFeatureFlags) {
      extraFeatures.push(
        "Feature flag system: lib/feature-flags.ts using Vercel Edge Config or DB-backed approach, hooks/useFeatureFlag.ts React hook, components/FeatureGate.tsx wrapper component"
      );
    }
    if (affiliateSystem) {
      extraFeatures.push(
        "Referral/affiliate tracking: lib/affiliate.ts, app/api/affiliate/track/route.ts, app/api/affiliate/dashboard/route.ts, components/AffiliateWidget.tsx"
      );
    }

    const userPrompt = `Generate monetization infrastructure for "${appName}".
Billing model: ${model}
Tiers: ${tiers.join(", ")}

Include Stripe integration with:
1. Pricing page (components/PricingPage.tsx)
2. Stripe Checkout session creation
3. Stripe webhook handler (subscription events)
4. Customer billing portal
5. Subscription status middleware (middleware.ts) with plan tier gating
6. Feature gating by plan${
      extraFeatures.length > 0
        ? `\n\nAdditional features to generate:\n${extraFeatures.map((f, i) => `${i + 1}. ${f}`).join("\n")}`
        : ""
    }`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 8192,
      messages: [
        { role: "system", content: MONETIZATION_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateMonetizationResponse;
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
