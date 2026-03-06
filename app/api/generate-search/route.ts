import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface SearchFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateSearchRequest {
  appName?: string;
  engine?: "pgvector" | "algolia" | "typesense" | "meilisearch";
  entities?: string[];
}

export interface GenerateSearchResponse {
  files: SearchFile[];
  summary: string;
  setupInstructions: string;
  requiredEnvVars: string[];
}

const SEARCH_SYSTEM_PROMPT = `You are ZIVO AI — an expert in search system architecture.

Generate a complete search system for a Next.js App Router project.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "setupInstructions": "Step-by-step setup",
  "requiredEnvVars": []
}

Always include:
- app/api/search/route.ts — Search API endpoint
- components/SearchBar.tsx — Search bar with autocomplete
- components/SearchResults.tsx — Results with highlighting
- hooks/useSearch.ts — Search state management hook
- lib/search/indexer.ts — Search indexing utilities

Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const body = await req.json() as GenerateSearchRequest;
    const {
      appName = "My App",
      engine = "pgvector",
      entities = ["posts", "users", "products"],
    } = body;

    const userPrompt = `Generate a search system for "${appName}".
Search engine: ${engine}
Searchable entities: ${entities.join(", ")}

Include indexing pipeline, search API, SearchBar component, and results display.`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 8192,
      messages: [
        { role: "system", content: SEARCH_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateSearchResponse;
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
