import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface PerformanceFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GeneratePerformanceRequest {
  appName?: string;
  optimizations?: Array<
    | "images"
    | "fonts"
    | "code-splitting"
    | "caching"
    | "cdn"
    | "ppr"
    | "rsc"
    | "all"
  >;
  cacheProvider?: "redis" | "memory" | "cdn" | "all";
  bundleAnalyzer?: boolean;
}

export interface GeneratePerformanceResponse {
  files: PerformanceFile[];
  summary: string;
  setupInstructions: string;
  webVitalsChecklist: string[];
  requiredEnvVars: string[];
}

const PERFORMANCE_SYSTEM_PROMPT = `You are ZIVO AI — an expert in web performance optimization for Next.js applications.

Generate production-ready performance optimizations for a Next.js App Router project.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "setupInstructions": "Step-by-step setup instructions",
  "webVitalsChecklist": ["Optimization 1", "Optimization 2"],
  "requiredEnvVars": ["VAR_NAME=description"]
}

Always include:
- next.config.ts — Image optimization, bundle analyzer, partial prerendering
- lib/cache/redis.ts — Redis caching layer using Upstash
- lib/cache/helpers.ts — Cache helper functions (get, set, invalidate)
- hooks/useOptimisticUpdate.ts — Optimistic UI update hook
- components/providers/QueryProvider.tsx — React Query provider setup
- lighthouserc.js — Lighthouse CI configuration
- .github/workflows/performance.yml — Lighthouse CI automation

Optimize for Core Web Vitals:
- LCP: Image preloading, server-side rendering
- CLS: Explicit width/height on images, font loading
- INP: Deferred JavaScript, React concurrent features
- Use Partial Prerendering (PPR) for hybrid static/dynamic content
- Implement stale-while-revalidate caching patterns

Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request): Promise<NextResponse> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    let body: GeneratePerformanceRequest;
    try {
      body = await req.json() as GeneratePerformanceRequest;
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }
    const {
      appName = "My App",
      optimizations = ["all"],
      cacheProvider = "redis",
      bundleAnalyzer = true,
    } = body;

    const selectedOpts = optimizations.includes("all")
      ? ["images", "fonts", "code-splitting", "caching", "cdn", "ppr", "rsc"]
      : optimizations;

    const userPrompt = `Generate performance optimizations for "${appName}".
Optimizations: ${selectedOpts.join(", ")}
Cache provider: ${cacheProvider}
Bundle analyzer: ${bundleAnalyzer}

Generate:
1. Next.js config with image optimization, font optimization, bundle analyzer (next.config.ts)
2. Redis caching layer with Upstash (lib/cache/redis.ts, lib/cache/helpers.ts)
3. React Query provider for data caching (components/providers/QueryProvider.tsx)
4. Optimistic update hook (hooks/useOptimisticUpdate.ts)
5. Lighthouse CI configuration (lighthouserc.js)
6. Core Web Vitals monitoring hook (hooks/useWebVitals.ts)
7. CDN configuration for Cloudflare (cloudflare.config.ts)
8. Bundle analyzer script (scripts/analyze.ts)`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 8192,
      messages: [
        { role: "system", content: PERFORMANCE_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GeneratePerformanceResponse;
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
