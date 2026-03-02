'use client';

import React, { useState } from 'react';
import { PLATFORMS } from '../../lib/platforms';
import { INTEGRATIONS, INTEGRATION_CATEGORIES } from '../../lib/integrations';

export default function PlatformDashboard() {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'features' | 'integrations'>('features');

  const platform = selectedPlatform ? PLATFORMS.find((p) => p.id === selectedPlatform) : null;
  const integrations = platform
    ? INTEGRATIONS.filter((i) => i.category === platform.integrationCategory)
    : [];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <header className="border-b border-zinc-800 px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">ZIVO-AI Ultimate Platform</h1>
            <p className="text-zinc-400 text-sm mt-1">
              {PLATFORMS.length} platform ecosystems · {INTEGRATIONS.length}+ integrations
            </p>
          </div>
          <a href="/" className="text-zinc-400 hover:text-white text-sm transition-colors">
            ← Back to Home
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-10">
        {!selectedPlatform ? (
          <>
            <section className="mb-12">
              <h2 className="text-lg font-semibold text-zinc-300 mb-6">Platform Ecosystems</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlatform(p.id)}
                    className="text-left rounded-xl border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-600 hover:bg-zinc-800 transition-all group"
                  >
                    <div className="text-3xl mb-3">{p.icon}</div>
                    <div className="text-xs text-zinc-500 mb-1">#{p.number}</div>
                    <h3 className="font-semibold text-zinc-100 group-hover:text-white mb-2 leading-tight">
                      {p.name}
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{p.description}</p>
                    <div className="mt-3 text-xs text-zinc-500">
                      {p.features.length} features
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-300 mb-6">Integration Categories</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {INTEGRATION_CATEGORIES.map((cat) => (
                  <div
                    key={cat.id}
                    className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-center"
                  >
                    <div className="text-2xl font-bold text-white">{cat.count}+</div>
                    <div className="text-xs text-zinc-400 mt-1">{cat.name}</div>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <div>
            <button
              onClick={() => setSelectedPlatform(null)}
              className="text-zinc-400 hover:text-white text-sm mb-6 transition-colors flex items-center gap-1"
            >
              ← All Platforms
            </button>

            {platform && (
              <>
                <div className="flex items-start gap-4 mb-8">
                  <span className="text-5xl">{platform.icon}</span>
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">Platform #{platform.number}</div>
                    <h2 className="text-2xl font-bold text-white">{platform.name}</h2>
                    <p className="text-zinc-400 mt-1 max-w-2xl">{platform.description}</p>
                  </div>
                </div>

                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setActiveTab('features')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'features'
                        ? 'bg-white text-black'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    Features ({platform.features.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('integrations')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'integrations'
                        ? 'bg-white text-black'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    Integrations ({integrations.length})
                  </button>
                </div>

                {activeTab === 'features' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {platform.features.map((feature) => (
                      <div
                        key={feature.id}
                        className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
                      >
                        <h3 className="font-semibold text-zinc-100 mb-1">{feature.name}</h3>
                        <p className="text-xs text-zinc-400 leading-relaxed">{feature.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'integrations' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {integrations.map((integration) => (
                      <a
                        key={integration.id}
                        href={integration.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-600 transition-colors group"
                      >
                        <h3 className="font-semibold text-zinc-100 group-hover:text-white mb-1">
                          {integration.name}
                        </h3>
                        <p className="text-xs text-zinc-400 leading-relaxed">{integration.description}</p>
                      </a>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
