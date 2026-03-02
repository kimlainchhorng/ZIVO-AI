import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const type = searchParams.get("type") || "all";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  if (!query) {
    return NextResponse.json({ results: [], total: 0, query, type, page, limit });
  }

  const mockResults = [
    { id: "1", type: "project", title: `Project matching "${query}"`, relevance: 0.95, tags: ["react", "typescript"] },
    { id: "2", type: "component", title: `Component: ${query} Button`, relevance: 0.88, tags: ["ui", "button"] },
    { id: "3", type: "template", title: `${query} Starter Template`, relevance: 0.82, tags: ["template", "starter"] },
    { id: "4", type: "snippet", title: `Code snippet for ${query}`, relevance: 0.76, tags: ["snippet", "utility"] },
  ].filter((r) => type === "all" || r.type === type);

  return NextResponse.json({
    results: mockResults,
    total: mockResults.length,
    query,
    type,
    page,
    limit,
    trending: ["react-dashboard", "auth-template", "api-starter", "landing-page"],
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { query, filters, saveSearch } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const results = {
      semantic: [
        { id: "s1", title: `Semantic match for "${query}"`, score: 0.94, source: "projects" },
        { id: "s2", title: `Related: ${query} pattern`, score: 0.87, source: "components" },
      ],
      fuzzy: [
        { id: "f1", title: query, distance: 0, source: "snippets" },
      ],
      filters: filters || {},
      saved: saveSearch ? { id: `search-${Date.now()}`, query, createdAt: new Date().toISOString() } : null,
    };

    return NextResponse.json({ ok: true, results });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Search failed" }, { status: 500 });
  }
}
