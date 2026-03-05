// lib/ai/embedding-store.ts — In-memory vector store for semantic code search

import OpenAI from "openai";

/** Max characters sent to the embeddings API per document (model context limit). */
const MAX_EMBEDDING_INPUT_CHARS = 8000;

export interface EmbeddingEntry {
  id: string;
  path: string;
  content: string;
  embedding: number[];
  metadata: Record<string, unknown>;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export class EmbeddingStore {
  private entries: EmbeddingEntry[] = [];

  add(entry: EmbeddingEntry): void {
    // Replace if same id exists
    const idx = this.entries.findIndex((e) => e.id === entry.id);
    if (idx >= 0) {
      this.entries[idx] = entry;
    } else {
      this.entries.push(entry);
    }
  }

  search(queryEmbedding: number[], topK = 5): EmbeddingEntry[] {
    return this.entries
      .map((entry) => ({ entry, score: cosineSimilarity(queryEmbedding, entry.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(({ entry }) => entry);
  }

  async searchByText(query: string, topK = 5): Promise<EmbeddingEntry[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY not set");
    const client = new OpenAI({ apiKey });
    const response = await client.embeddings.create({ model: "text-embedding-3-small", input: query });
    const queryEmbedding = response.data[0]?.embedding ?? [];
    return this.search(queryEmbedding, topK);
  }

  async indexFiles(files: { path: string; content: string }[]): Promise<void> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY not set");
    const client = new OpenAI({ apiKey });
    await Promise.all(
      files.map(async (file) => {
        const text = `File: ${file.path}\n\n${file.content}`;
        const response = await client.embeddings.create({ model: "text-embedding-3-small", input: text.slice(0, MAX_EMBEDDING_INPUT_CHARS) });
        const embedding = response.data[0]?.embedding ?? [];
        this.add({
          id: file.path,
          path: file.path,
          content: file.content,
          embedding,
          metadata: { indexedAt: Date.now() },
        });
      })
    );
  }

  clear(): void {
    this.entries = [];
  }

  get size(): number {
    return this.entries.length;
  }
}

export const embeddingStore = new EmbeddingStore();
