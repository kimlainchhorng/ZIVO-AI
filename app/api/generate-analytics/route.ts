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
  openPanel?: boolean;
  customDashboard?: boolean;
  abTesting?: boolean;
  errorTracking?: boolean;
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
      openPanel = false,
      customDashboard = false,
      abTesting = false,
      errorTracking = false,
    }: GenerateAnalyticsRequest = body;

    const extraFeatures: string[] = [];
    if (openPanel) {
      extraFeatures.push(
        "OpenPanel integration (open-source Mixpanel alternative): lib/openpanel.ts, components/providers/OpenPanelProvider.tsx"
      );
    }
    if (customDashboard) {
      extraFeatures.push(
        "Custom analytics dashboard: app/dashboard/analytics/page.tsx using Recharts with: page views over time (LineChart), top pages (BarChart), user retention heatmap, conversion funnel (FunnelChart). Use mock data that matches real analytics shape."
      );
    }
    if (abTesting) {
      extraFeatures.push(
        "A/B testing setup: lib/ab-testing.ts using PostHog feature flags or cookie-based approach, hooks/useABTest.ts React hook, components/ABTestWrapper.tsx"
      );
    }
    if (errorTracking) {
      extraFeatures.push(
        "Global error boundary: components/ErrorBoundary.tsx with Sentry integration (captureException, fallback UI), hooks/useErrorHandler.ts"
      );
    }

    const userPrompt = `Generate analytics and monitoring setup for "${appName}".
Provider(s): ${provider}

Include:
1. Analytics utility library (lib/analytics.ts)
2. Custom event tracking hook (hooks/useAnalytics.ts)
3. Analytics provider component (components/providers/AnalyticsProvider.tsx)
4. Sentry error tracking setup (sentry.client.config.ts, sentry.server.config.ts)
5. PostHog/Plausible page view tracking
6. Vercel Analytics integration
7. Custom event tracking utilities${
      extraFeatures.length > 0
        ? `\n\nAdditional features to generate:\n${extraFeatures.map((f, i) => `${i + 1}. ${f}`).join("\n")}`
        : ""
    }`;

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
