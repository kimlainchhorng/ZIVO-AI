import { NextRequest, NextResponse } from "next/server";

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  relevance: number;
  type: string;
}

const SAMPLE_RESULTS: SearchResult[] = [
  {
    title: "Getting Started with ZIVO AI",
    snippet: "Learn how to set up ZIVO AI and integrate it into your workflow. This guide covers installation, configuration, and basic usage patterns.",
    url: "/docs/getting-started",
    relevance: 0.97,
    type: "Document",
  },
  {
    title: "AI-Powered Search Integration",
    snippet: "Integrate semantic search into your application using ZIVO AI's vector-based search engine with support for natural language queries.",
    url: "/docs/search",
    relevance: 0.91,
    type: "Document",
  },
  {
    title: "analytics-service.ts",
    snippet: "Core analytics service implementing event tracking, user cohort analysis, and ML-driven forecasting pipelines.",
    url: "/src/services/analytics-service.ts",
    relevance: 0.84,
    type: "Code",
  },
  {
    title: "Workflow Automation API Reference",
    snippet: "Complete API reference for creating and managing automated workflows, including trigger types, step configuration, and error handling.",
    url: "/docs/api/workflow",
    relevance: 0.78,
    type: "API",
  },
  {
    title: "ML Model Deployment Tutorial",
    snippet: "Step-by-step tutorial for training, evaluating, and deploying custom machine learning models using the ZIVO AI ML pipeline.",
    url: "/docs/ml-deployment",
    relevance: 0.72,
    type: "Document",
  },
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, filters } = body as { query?: string; filters?: Record<string, string> };

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    // Simulate relevance scoring based on query
    const lowerQuery = query.toLowerCase();
    const results = SAMPLE_RESULTS.map((r) => {
      const titleMatch = r.title.toLowerCase().includes(lowerQuery) ? 0.1 : 0;
      const snippetMatch = r.snippet.toLowerCase().includes(lowerQuery) ? 0.05 : 0;
      return { ...r, relevance: Math.min(r.relevance + titleMatch + snippetMatch, 1) };
    }).sort((a, b) => b.relevance - a.relevance);

    // Apply type filter
    const filtered =
      filters?.type && filters.type !== "All Types"
        ? results.filter((r) => r.type === filters.type)
        : results;

    return NextResponse.json({ results: filtered, query, total: filtered.length });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
