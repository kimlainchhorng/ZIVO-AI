import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface SeoFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateSeoRequest {
  appName?: string;
  siteUrl?: string;
  description?: string;
  multiLanguage?: boolean;
  structuredDataTypes?: Array<
    | "website"
    | "organization"
    | "product"
    | "article"
    | "faq"
    | "breadcrumb"
    | "all"
  >;
}

export interface GenerateSeoResponse {
  files: SeoFile[];
  summary: string;
  setupInstructions: string;
  seoChecklist: string[];
}

const SEO_SYSTEM_PROMPT = `You are ZIVO AI — an expert in SEO, structured data, and web discoverability for Next.js.

Generate complete SEO infrastructure for a Next.js App Router project.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "setupInstructions": "Step-by-step setup instructions",
  "seoChecklist": ["SEO optimization 1", "SEO optimization 2"]
}

Always include:
- app/sitemap.ts — Dynamic XML sitemap generator
- app/robots.ts — robots.txt configuration
- app/opengraph-image.tsx — Dynamic Open Graph image generation
- app/twitter-image.tsx — Twitter card image generation
- lib/seo/metadata.ts — Reusable metadata generation helpers
- lib/seo/structured-data.ts — JSON-LD structured data generators
- lib/seo/canonical.ts — Canonical URL management
- components/seo/JsonLd.tsx — JSON-LD injection component

Use Next.js Metadata API (generateMetadata) for all pages.
Include hreflang tags for multi-language sites.
Add JSON-LD for Website, Organization, BreadcrumbList, and page-specific types.

Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request): Promise<NextResponse> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({})) as GenerateSeoRequest;
    const {
      appName = "My App",
      siteUrl = "https://example.com",
      description = "",
      multiLanguage = false,
      structuredDataTypes = ["all"],
    } = body;

    const schemaTypes = structuredDataTypes.includes("all")
      ? ["website", "organization", "product", "article", "faq", "breadcrumb"]
      : structuredDataTypes;

    const userPrompt = `Generate complete SEO infrastructure for "${appName}" at ${siteUrl}.
${description ? `Site description: ${description}` : ""}
Multi-language: ${multiLanguage}
Structured data types: ${schemaTypes.join(", ")}

Generate:
1. Dynamic sitemap (app/sitemap.ts) with all page routes
2. robots.txt configuration (app/robots.ts)
3. Dynamic Open Graph images (app/opengraph-image.tsx using Next.js ImageResponse)
4. Twitter card images (app/twitter-image.tsx)
5. Metadata generation helpers (lib/seo/metadata.ts)
6. JSON-LD structured data for: ${schemaTypes.join(", ")} (lib/seo/structured-data.ts)
7. Canonical URL management (lib/seo/canonical.ts)
8. JSON-LD React component (components/seo/JsonLd.tsx)
${multiLanguage ? "9. Hreflang tag utilities (lib/seo/hreflang.ts)" : ""}`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 8192,
      messages: [
        { role: "system", content: SEO_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateSeoResponse;
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
