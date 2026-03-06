// lib/vector-search.ts — Embeddings and vector search utilities

import OpenAI from "openai";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VectorEntry {
  id: string;
  text: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
}

export interface VectorSearchResult {
  id: string;
  text: string;
  score: number;
  metadata?: Record<string, unknown>;
}

// ─── Embedding ────────────────────────────────────────────────────────────────

/**
 * Generates an embedding vector for the given text using text-embedding-3-small.
 */
export async function embedText(text: string, client: OpenAI): Promise<number[]> {
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text.slice(0, 8000), // Respect token limit
  });
  return response.data[0]?.embedding ?? [];
}

// ─── Similarity ───────────────────────────────────────────────────────────────

/**
 * Computes cosine similarity between two equal-length vectors.
 * Returns a value between -1 and 1 (1 = identical direction).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

// ─── VectorStore ──────────────────────────────────────────────────────────────

let entryCounter = 0;

/**
 * In-memory vector store for semantic search.
 */
export class VectorStore {
  private readonly entries = new Map<string, VectorEntry>();

  /**
   * Adds a new entry to the store.
   * If no id is provided, one is generated automatically.
   */
  add(text: string, embedding: number[], metadata?: Record<string, unknown>, id?: string): string {
    const entryId = id ?? `vec_${Date.now()}_${++entryCounter}`;
    this.entries.set(entryId, { id: entryId, text, embedding, metadata });
    return entryId;
  }

  /**
   * Searches the store for the topK most similar entries to the query embedding.
   */
  search(queryEmbedding: number[], topK = 5): VectorSearchResult[] {
    const results: VectorSearchResult[] = [];

    for (const entry of this.entries.values()) {
      const score = cosineSimilarity(queryEmbedding, entry.embedding);
      results.push({ id: entry.id, text: entry.text, score, metadata: entry.metadata });
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /** Removes an entry by ID. */
  remove(id: string): boolean {
    return this.entries.delete(id);
  }

  /** Returns the total number of entries. */
  get size(): number {
    return this.entries.size;
  }

  /** Clears all entries. */
  clear(): void {
    this.entries.clear();
  }
}

/** Default shared vector store instance. */
export const defaultVectorStore = new VectorStore();
