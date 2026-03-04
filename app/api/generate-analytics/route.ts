import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface AnalyticsFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateAnalyticsRequest {
  provider?: "posthog" | "plausible" | "vercel" | "sentry" | "all";
  appName?: string;
}

export interface GenerateAnalyticsResponse {
  files: AnalyticsFile[];
  summary: string;
  envVars: string[];
  setupInstructions: string;
}

const ANALYTICS_SYSTEM_PROMPT = `You are ZIVO AI — an expert in analytics, monitoring, and observability for Next.js.

Generate production-ready analytics and monitoring integration code.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "envVars": ["ENV_VAR_NAME=description"],
  "setupInstructions": "Step-by-step setup"
}

Always include:
- lib/analytics.ts — Analytics utility functions and event tracking
- hooks/useAnalytics.ts — Custom React hook for tracking events
- components/providers/AnalyticsProvider.tsx — Analytics provider wrapper
- app/layout.tsx updates — Provider integration

For PostHog: feature flags, session recording, event capture
For Plausible: page views, custom events, goal tracking
For Vercel Analytics: @vercel/analytics integration
For Sentry: error boundary, performance monitoring, release tracking

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
      provider = "all",
      appName = "My App",
    }: GenerateAnalyticsRequest = body;

    const userPrompt = `Generate analytics and monitoring setup for "${appName}".
Provider(s): ${provider}

Include:
1. Analytics utility library (lib/analytics.ts)
2. Custom event tracking hook (hooks/useAnalytics.ts)
3. Analytics provider component (components/providers/AnalyticsProvider.tsx)
4. Sentry error tracking setup (sentry.client.config.ts, sentry.server.config.ts)
5. PostHog/Plausible page view tracking
6. Vercel Analytics integration
7. Custom event tracking utilities`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 8192,
      messages: [
        { role: "system", content: ANALYTICS_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateAnalyticsResponse;
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
