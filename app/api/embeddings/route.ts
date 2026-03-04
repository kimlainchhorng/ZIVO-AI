import { NextResponse } from "next/server";
import OpenAI from "openai";
import { embedText, defaultVectorStore } from "../../../lib/vector-search";

export const runtime = "nodejs";

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const url = new URL(req.url);
    const isSearch = url.pathname.endsWith("/search");

    if (isSearch) {
      const { query, topK = 5 } = body as { query?: string; topK?: number };
      if (!query) {
        return NextResponse.json({ error: "query is required" }, { status: 400 });
      }
      const client = getClient();
      const queryEmbedding = await embedText(query, client);
      const results = defaultVectorStore.search(queryEmbedding, topK);
      return NextResponse.json({ results, totalFound: results.length });
    }

    // Generate embeddings
    const { texts } = body as { texts?: unknown };
    if (!Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json({ error: "texts must be a non-empty array" }, { status: 400 });
    }

    const client = getClient();
    const embeddings: number[][] = [];
    const ids: string[] = [];

    for (const text of texts) {
      if (typeof text !== "string") {
        return NextResponse.json({ error: "Each text must be a string" }, { status: 400 });
      }
      const embedding = await embedText(text, client);
      embeddings.push(embedding);
      const id = defaultVectorStore.add(text, embedding);
      ids.push(id);
    }

    return NextResponse.json({ embeddings, ids, count: embeddings.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
