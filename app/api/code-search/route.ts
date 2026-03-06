import { NextResponse } from "next/server";
import OpenAI from "openai";
import { indexFiles, searchIndex, type GeneratedFile } from "../../../lib/repo-indexer";
import { embedText, cosineSimilarity } from "../../../lib/vector-search";

export const runtime = "nodejs";

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { files, query, searchType = "text" } = body as {
      files: unknown;
      query: string;
      searchType?: "text" | "symbol" | "semantic";
    };

    if (!Array.isArray(files)) {
      return NextResponse.json({ error: "files must be an array" }, { status: 400 });
    }
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }
    for (const f of files) {
      if (!f || typeof (f as GeneratedFile).path !== "string" || typeof (f as GeneratedFile).content !== "string") {
        return NextResponse.json(
          { error: "Each file must have path (string) and content (string)" },
          { status: 400 }
        );
      }
    }

    const fileArray = files as GeneratedFile[];

    if (searchType === "semantic") {
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ error: "Missing OPENAI_API_KEY for semantic search" }, { status: 500 });
      }
      const client = getClient();
      const queryEmbedding = await embedText(query, client);

      // Build all chunks first, then batch-embed in parallel (max 20 chunks to avoid rate limits)
      const chunks: Array<{ file: string; line: number; snippet: string }> = [];
      for (const file of fileArray) {
        const lines = file.content.split("\n");
        for (let i = 0; i < lines.length; i += 10) {
          const chunk = lines.slice(i, i + 10).join("\n").trim();
          if (chunk.length < 10) continue;
          chunks.push({ file: file.path, line: i + 1, snippet: chunk.slice(0, 200) });
        }
      }

      // Embed up to 20 chunks in parallel to balance speed vs rate limits
      const topChunks = chunks.slice(0, 20);
      const embeddings = await Promise.all(topChunks.map((c) => embedText(c.snippet, client)));

      const results = topChunks
        .map((c, i) => ({ ...c, score: cosineSimilarity(queryEmbedding, embeddings[i]) }))
        .filter((r) => r.score > 0.3)
        .sort((a, b) => b.score - a.score);

      return NextResponse.json({ results: results.slice(0, 20), totalFound: results.length });
    }

    // text or symbol search via repo indexer
    const index = indexFiles(fileArray);
    const results = searchIndex(index, query);
    return NextResponse.json({ results, totalFound: results.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
