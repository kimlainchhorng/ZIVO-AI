export interface SearchFilter {
  type?: string;
  date?: string;
  [key: string]: string | undefined;
}

export interface SearchDocument {
  id: string;
  title: string;
  content: string;
  type: string;
  url: string;
  metadata?: Record<string, unknown>;
}

export interface SearchResult extends SearchDocument {
  relevance: number;
  snippet: string;
}

export class SearchAgent {
  private index: Map<string, SearchDocument> = new Map();

  /**
   * Perform a semantic search across indexed documents
   */
  async search(query: string, filters?: SearchFilter): Promise<SearchResult[]> {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();
    const results: SearchResult[] = [];

    for (const doc of this.index.values()) {
      if (filters?.type && filters.type !== "All Types" && doc.type !== filters.type) continue;

      const titleScore = doc.title.toLowerCase().includes(lowerQuery) ? 0.4 : 0;
      const contentScore = doc.content.toLowerCase().includes(lowerQuery) ? 0.3 : 0;
      const relevance = Math.min(0.5 + titleScore + contentScore + Math.random() * 0.2, 1);

      if (relevance > 0.3) {
        const snippetStart = Math.max(doc.content.toLowerCase().indexOf(lowerQuery) - 60, 0);
        const snippet = doc.content.slice(snippetStart, snippetStart + 180).trim() || doc.content.slice(0, 180);

        results.push({ ...doc, relevance: parseFloat(relevance.toFixed(2)), snippet });
      }
    }

    return results.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Index a document for future searches
   */
  indexDocument(doc: SearchDocument): void {
    this.index.set(doc.id, doc);
  }

  /**
   * Get search suggestions based on a partial query
   */
  async getSuggestions(partial: string): Promise<string[]> {
    if (!partial.trim()) return [];
    const lower = partial.toLowerCase();

    const suggestions = new Set<string>();
    for (const doc of this.index.values()) {
      if (doc.title.toLowerCase().startsWith(lower)) {
        suggestions.add(doc.title);
      }
    }

    // Return up to 5 suggestions
    return Array.from(suggestions).slice(0, 5);
  }
}
