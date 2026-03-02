"use client";

import { useState } from "react";
import Navigation from "../components/Navigation";

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  relevance: number;
  type: string;
}

const recentSearches = ["OpenAI embeddings", "vector database", "RAG pipeline", "semantic search"];

const typeOptions = ["All Types", "Document", "Code", "Image", "Video", "API"];
const dateOptions = ["Any Time", "Last 24h", "Last Week", "Last Month", "Last Year"];

const typeIcon: Record<string, string> = {
  Document: "📄",
  Code: "💻",
  Image: "🖼️",
  Video: "🎬",
  API: "🔌",
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [dateFilter, setDateFilter] = useState("Any Time");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, filters: { type: typeFilter, date: dateFilter } }),
      });
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
          AI-Powered Search
        </h1>
        <p className="text-gray-400 mb-8">Semantic search across all your data sources</p>

        {/* Search bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
            placeholder="Search anything..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-300 focus:outline-none focus:border-purple-500"
          >
            {typeOptions.map((o) => <option key={o}>{o}</option>)}
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-300 focus:outline-none focus:border-purple-500"
          >
            {dateOptions.map((o) => <option key={o}>{o}</option>)}
          </select>
          <button
            onClick={() => handleSearch(query)}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-6 py-2.5 font-medium transition-colors"
          >
            Search
          </button>
        </div>

        {/* Recent searches */}
        <div className="flex flex-wrap gap-2 mb-8">
          <span className="text-gray-500 text-sm">Recent:</span>
          {recentSearches.map((s) => (
            <button
              key={s}
              onClick={() => { setQuery(s); handleSearch(s); }}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-sm rounded-full px-3 py-0.5 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Empty state */}
        {!loading && searched && results.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg">No results found</p>
            <p className="text-sm mt-1">Try a different query or adjust your filters</p>
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div className="flex flex-col gap-4">
            <p className="text-gray-400 text-sm">{results.length} results found</p>
            {results.map((r, i) => (
              <div key={i} className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-purple-600/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{typeIcon[r.type] ?? "📄"}</span>
                      <h3 className="font-semibold text-white">{r.title}</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-2">{r.snippet}</p>
                    <span className="text-purple-400 text-xs">{r.url}</span>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      r.relevance >= 0.8
                        ? "bg-emerald-900 text-emerald-300"
                        : r.relevance >= 0.5
                        ? "bg-blue-900 text-blue-300"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    {Math.round(r.relevance * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
