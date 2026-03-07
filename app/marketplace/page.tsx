"use client";

import { useState, useEffect } from "react";

interface MarketplaceComponent {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
  previewHtml: string;
  code: string;
  downloads: number;
}

const CATEGORIES = ["All", "Landing Pages", "Dashboards", "E-commerce", "SaaS", "Authentication"];

const CATEGORY_COLORS: Record<string, string> = {
  "Landing Pages": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "Dashboards": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  "E-commerce": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "SaaS": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  "Authentication": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse bg-white dark:bg-gray-900">
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-4" />
      <div className="flex gap-2 mb-4">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-12" />
      </div>
      <div className="flex justify-between items-center">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
        <div className="flex gap-2">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

function ComponentCard({ component }: { component: MarketplaceComponent }) {
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleInstall = async () => {
    try {
      await navigator.clipboard.writeText(component.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const badgeClass =
    CATEGORY_COLORS[component.category] ??
    "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 bg-white dark:bg-gray-900 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <span className="font-bold text-gray-900 dark:text-white text-base">{component.name}</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${badgeClass}`}>
          {component.category}
        </span>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        {component.description}
      </p>

      {component.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {component.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="text-xs text-gray-500 dark:text-gray-500">
          ⬇ {component.downloads.toLocaleString()} downloads
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview((v) => !v)}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {showPreview ? "Hide" : "Preview"}
          </button>
          <button
            onClick={handleInstall}
            className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            {copied ? "Copied!" : "Install"}
          </button>
        </div>
      </div>

      {showPreview && (
        <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          {component.previewHtml ? (
            <iframe
              srcDoc={component.previewHtml}
              title={`Preview of ${component.name}`}
              className="w-full h-48"
              sandbox="allow-scripts"
            />
          ) : (
            <div className="flex items-center justify-center h-24 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
              No preview available
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MarketplacePage() {
  const [components, setComponents] = useState<MarketplaceComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    const fetchComponents = async () => {
      try {
        const res = await fetch("/api/marketplace");
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        const json: { components: MarketplaceComponent[] } = await res.json();
        setComponents(json.components ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchComponents();
  }, []);

  const filtered = components.filter((c) => {
    const matchesCategory = activeCategory === "All" || c.category === activeCategory;
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      c.name.toLowerCase().includes(term) ||
      c.description.toLowerCase().includes(term) ||
      c.tags.some((t) => t.toLowerCase().includes(term));
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            🛒 Component Marketplace
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Browse and install ready-made components for your project.
          </p>
        </div>

        {/* Search */}
        <div className="mb-5">
          <input
            type="text"
            placeholder="Search components..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* States */}
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-5 py-4 text-sm mb-8">
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : !error && filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400 dark:text-gray-600 text-sm">
            No components found matching your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((component) => (
              <ComponentCard key={component.id} component={component} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
