'use client';

import React, { useState } from 'react';
import { SERVICE_CATEGORIES, ADVANCED_FEATURE_GROUPS } from '@/lib/services';

export default function ServicesPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [userPrompt, setUserPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedCategory = SERVICE_CATEGORIES.find((c) => c.id === selected);

  const handleGenerate = async () => {
    if (!selected) return;
    setLoading(true);
    setError('');
    setResult('');
    try {
      const res = await fetch('/api/service-ecosystem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: selected, userPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setResult(data.result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 font-sans">
      {/* Header */}
      <header className="bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          ZIVO-AI — Complete Service Ecosystem
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {SERVICE_CATEGORIES.length} service categories · {SERVICE_CATEGORIES.reduce((s, c) => s + c.features.length, 0)}+ features · {SERVICE_CATEGORIES.reduce((s, c) => s + c.integrations.length, 0)}+ integrations
        </p>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Service category grid */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Service Categories</h2>
          <div className="grid grid-cols-1 gap-3">
            {SERVICE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelected(cat.id)}
                className={`text-left p-4 rounded-xl border transition-all ${
                  selected === cat.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{cat.icon}</span>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">
                      #{cat.number} {cat.title}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{cat.description}</p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                      {cat.features.length} features · {cat.integrations.length} integrations
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail panel + generator */}
        <div className="lg:col-span-2 space-y-6">
          {selectedCategory ? (
            <>
              {/* Category detail */}
              <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{selectedCategory.icon}</span>
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                      #{selectedCategory.number} {selectedCategory.title}
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">{selectedCategory.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Features */}
                  <div>
                    <h3 className="font-semibold text-zinc-700 dark:text-zinc-300 text-sm mb-2">
                      Features ({selectedCategory.features.length})
                    </h3>
                    <ul className="space-y-1 max-h-64 overflow-y-auto">
                      {selectedCategory.features.map((f) => (
                        <li key={f.id} className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                          <span className="text-green-500">✓</span> {f.label}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Integrations */}
                  {selectedCategory.integrations.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-zinc-700 dark:text-zinc-300 text-sm mb-2">
                        Integrations ({selectedCategory.integrations.length})
                      </h3>
                      <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
                        {selectedCategory.integrations.map((int) => (
                          <span
                            key={int.name}
                            className="text-xs bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-2 py-1 rounded-full"
                          >
                            {int.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Generator */}
              <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
                <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-3">Generate Platform</h3>
                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder={`Optional: add custom requirements for your ${selectedCategory.title} platform…`}
                  rows={3}
                  className="w-full text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="mt-3 px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Generating…' : `Generate ${selectedCategory.title} Platform`}
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl p-4 text-sm">
                  {error}
                </div>
              )}

              {/* Result */}
              {result && (
                <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
                  <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-3">Generated Code</h3>
                  <pre className="text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap">
                    {result}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Empty state */}
              <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-10 text-center">
                <p className="text-zinc-400 dark:text-zinc-500 text-sm">
                  Select a service category on the left to see its features and generate a platform.
                </p>
              </div>

              {/* Advanced feature groups */}
              <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
                <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4">
                  Advanced Features (70+)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ADVANCED_FEATURE_GROUPS.map((group) => (
                    <div key={group.id}>
                      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">{group.title}</h3>
                      <ul className="space-y-1">
                        {group.features.map((f) => (
                          <li key={f} className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                            <span className="text-blue-500">•</span> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
