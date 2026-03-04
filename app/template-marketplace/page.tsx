'use client';
import { useState } from 'react';

const TEMPLATES = [
  { id: 't1', name: 'SaaS Starter', category: 'SaaS', description: 'Full SaaS with auth, billing, dashboard', preview: '🚀' },
  { id: 't2', name: 'Blog Platform', category: 'Blog', description: 'MDX blog with CMS integration', preview: '📝' },
  { id: 't3', name: 'E-commerce Store', category: 'E-commerce', description: 'Shopify-style storefront', preview: '🛒' },
  { id: 't4', name: 'Admin Dashboard', category: 'Dashboard', description: 'Analytics dashboard with charts', preview: '📊' },
  { id: 't5', name: 'Portfolio', category: 'Portfolio', description: 'Developer portfolio with projects', preview: '🎨' },
  { id: 't6', name: 'API Service', category: 'API', description: 'REST/GraphQL API boilerplate', preview: '⚡' },
];

const CATEGORIES = ['All', 'SaaS', 'Blog', 'E-commerce', 'Dashboard', 'Portfolio', 'API'];

export default function TemplateMarketplace() {
  const [filter, setFilter] = useState('All');
  const [cloning, setCloning] = useState<string | null>(null);
  const [cloned, setCloned] = useState<Set<string>>(new Set());

  const filtered = filter === 'All' ? TEMPLATES : TEMPLATES.filter((t) => t.category === filter);

  async function handleClone(id: string) {
    setCloning(id);
    await fetch('/api/template-marketplace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clone', templateId: id }),
    });
    setCloned((prev) => new Set([...prev, id]));
    setCloning(null);
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <h1 className="text-2xl font-bold mb-2">Template Marketplace</h1>
      <p className="text-gray-400 mb-6">Full-app templates ready to clone and deploy</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === cat ? 'bg-[#6366f1] text-white' : 'bg-[#1a1a1a] text-gray-400 hover:bg-gray-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((tmpl) => (
          <div key={tmpl.id} className="bg-[#111] border border-gray-800 rounded-xl overflow-hidden">
            <div className="bg-[#1a1a1a] h-36 flex items-center justify-center text-6xl">{tmpl.preview}</div>
            <div className="p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{tmpl.name}</span>
                <span className="text-xs bg-[#6366f1]/20 text-[#6366f1] px-2 py-0.5 rounded-full">{tmpl.category}</span>
              </div>
              <p className="text-gray-400 text-sm">{tmpl.description}</p>
              <button
                onClick={() => handleClone(tmpl.id)}
                disabled={cloning === tmpl.id || cloned.has(tmpl.id)}
                className="mt-2 w-full py-2 rounded-lg text-sm font-medium bg-[#6366f1] hover:bg-[#5254cc] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {cloning === tmpl.id ? 'Cloning…' : cloned.has(tmpl.id) ? '✓ Cloned' : 'Clone Template'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
