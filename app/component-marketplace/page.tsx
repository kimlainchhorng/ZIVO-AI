'use client';
import { useState } from 'react';

const MOCK_COMPONENTS = [
  { id: '1', name: 'Button', category: 'UI', description: 'Accessible button with variants', tags: ['ui', 'interactive'] },
  { id: '2', name: 'Card', category: 'Layout', description: 'Flexible card container', tags: ['layout', 'ui'] },
  { id: '3', name: 'Form', category: 'Forms', description: 'Form with validation', tags: ['forms', 'validation'] },
  { id: '4', name: 'Modal', category: 'Overlay', description: 'Accessible modal dialog', tags: ['overlay', 'ui'] },
  { id: '5', name: 'Table', category: 'Data', description: 'Sortable data table', tags: ['data', 'ui'] },
  { id: '6', name: 'Dropdown', category: 'UI', description: 'Select dropdown with search', tags: ['ui', 'forms'] },
  { id: '7', name: 'Sidebar', category: 'Layout', description: 'Collapsible sidebar nav', tags: ['layout', 'navigation'] },
  { id: '8', name: 'Chart', category: 'Data', description: 'Responsive chart component', tags: ['data', 'visualization'] },
];

export default function ComponentMarketplace() {
  const [search, setSearch] = useState('');
  const [installed, setInstalled] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = MOCK_COMPONENTS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase()) ||
      c.tags.some((t) => t.includes(search.toLowerCase()))
  );

  async function handleInstall(id: string) {
    setLoading(id);
    await fetch('/api/component-marketplace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'install', query: id }),
    });
    setInstalled((prev) => new Set([...prev, id]));
    setLoading(null);
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <h1 className="text-2xl font-bold mb-2">Component Marketplace</h1>
      <p className="text-gray-400 mb-6">Browse, preview, and install community components</p>

      <input
        type="text"
        placeholder="Search components…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 mb-6 text-white placeholder-gray-500 focus:outline-none focus:border-[#6366f1]"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map((comp) => (
          <div key={comp.id} className="bg-[#111] border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{comp.name}</span>
              <span className="text-xs bg-[#6366f1]/20 text-[#6366f1] px-2 py-0.5 rounded-full">{comp.category}</span>
            </div>
            <p className="text-gray-400 text-sm flex-1">{comp.description}</p>
            <div className="flex flex-wrap gap-1">
              {comp.tags.map((tag) => (
                <span key={tag} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">{tag}</span>
              ))}
            </div>
            <button
              onClick={() => handleInstall(comp.id)}
              disabled={installed.has(comp.id) || loading === comp.id}
              className="w-full py-2 rounded-lg text-sm font-medium bg-[#6366f1] hover:bg-[#5254cc] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading === comp.id ? 'Installing…' : installed.has(comp.id) ? '✓ Installed' : 'Install'}
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
