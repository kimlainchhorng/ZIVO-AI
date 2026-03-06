'use client';
import { useState } from 'react';

type Category = 'All' | 'Coding' | 'Writing' | 'Analysis' | 'Creative';

interface PromptTemplate {
  id: string;
  title: string;
  category: Exclude<Category, 'All'>;
  preview: string;
  content: string;
}

const SAMPLE_TEMPLATES: PromptTemplate[] = [
  { id: '1', title: 'Code Review Assistant', category: 'Coding', preview: 'Review the following code for bugs, security issues, and best practices…', content: 'Review the following code for bugs, security issues, and best practices. Provide actionable suggestions:\n\n```\n{{code}}\n```' },
  { id: '2', title: 'SQL Query Builder', category: 'Coding', preview: 'Generate an optimized SQL query based on this description…', content: 'Generate an optimized SQL query for the following requirement:\n\n{{description}}\n\nInclude indexes and explain the query plan.' },
  { id: '3', title: 'Blog Post Outline', category: 'Writing', preview: 'Create a detailed blog post outline with sections and key points…', content: 'Create a detailed blog post outline for the topic: "{{topic}}"\n\nInclude:\n- Engaging title\n- Introduction hook\n- 5 main sections with subpoints\n- Conclusion CTA' },
  { id: '4', title: 'Technical Documentation', category: 'Writing', preview: 'Write clear technical documentation for developers…', content: 'Write clear technical documentation for:\n\n{{feature}}\n\nInclude: Overview, Prerequisites, Step-by-step guide, Examples, and Troubleshooting.' },
  { id: '5', title: 'Competitive Analysis', category: 'Analysis', preview: 'Analyze competitors in a market and identify key differentiators…', content: 'Perform a competitive analysis for {{product}} in the {{market}} space.\n\nCover: Market positioning, Feature comparison, Pricing strategy, SWOT analysis.' },
  { id: '6', title: 'Data Interpretation', category: 'Analysis', preview: 'Interpret dataset results and extract meaningful insights…', content: 'Interpret the following data and extract key insights:\n\n{{data}}\n\nProvide: Summary statistics, Trends, Anomalies, and Recommendations.' },
  { id: '7', title: 'Story World Builder', category: 'Creative', preview: 'Build a rich fictional world with detailed lore and characters…', content: 'Build a detailed fictional world for: "{{concept}}"\n\nInclude: Geography, History, Political factions, Magic/Technology system, and 3 main characters.' },
  { id: '8', title: 'Product Name Generator', category: 'Creative', preview: 'Generate creative product names with branding rationale…', content: 'Generate 10 creative product names for:\n\n{{description}}\n\nFor each name provide: Pronunciation, Meaning, Domain availability likelihood, and Brand vibe.' },
];

const CATEGORY_COLORS: Record<Exclude<Category, 'All'>, string> = {
  Coding: 'bg-blue-900/50 text-blue-300 border-blue-700/50',
  Writing: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50',
  Analysis: 'bg-amber-900/50 text-amber-300 border-amber-700/50',
  Creative: 'bg-purple-900/50 text-purple-300 border-purple-700/50',
};

export default function PromptTemplatesPage() {
  const [templates, setTemplates] = useState<PromptTemplate[]>(() => {
    if (typeof window === 'undefined') return SAMPLE_TEMPLATES;
    const stored = localStorage.getItem('zivo_prompt_templates');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as PromptTemplate[];
        return [...SAMPLE_TEMPLATES, ...parsed];
      } catch { /* ignore */ }
    }
    return SAMPLE_TEMPLATES;
  });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category>('All');
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState({ title: '', category: 'Coding' as Exclude<Category, 'All'>, content: '' });

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.preview.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'All' || t.category === category;
    return matchesSearch && matchesCategory;
  });

  const handleCopy = (t: PromptTemplate) => {
    navigator.clipboard.writeText(t.content).catch(() => {});
    setCopiedId(t.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFork = (t: PromptTemplate) => {
    setNewTemplate({ title: `${t.title} (fork)`, category: t.category, content: t.content });
    setShowModal(true);
  };

  const handleCreate = () => {
    if (!newTemplate.title.trim() || !newTemplate.content.trim()) return;
    const created: PromptTemplate = {
      id: `user_${Date.now()}`,
      title: newTemplate.title,
      category: newTemplate.category,
      preview: newTemplate.content.slice(0, 80) + (newTemplate.content.length > 80 ? '…' : ''),
      content: newTemplate.content,
    };
    const updated = [...templates, created];
    setTemplates(updated);
    const userTemplates = updated.filter(t => t.id.startsWith('user_'));
    localStorage.setItem('zivo_prompt_templates', JSON.stringify(userTemplates));
    setShowModal(false);
    setNewTemplate({ title: '', category: 'Coding', content: '' });
  };

  const categories: Category[] = ['All', 'Coding', 'Writing', 'Analysis', 'Creative'];

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Prompt Templates</h1>
        <button
          onClick={() => { setNewTemplate({ title: '', category: 'Coding', content: '' }); setShowModal(true); }}
          className="bg-[#6366f1] hover:bg-[#5254cc] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + New Template
        </button>
      </div>
      <p className="text-gray-400 text-sm mb-6">Browse, copy, and fork reusable prompt templates.</p>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search templates…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-[#111111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#6366f1]"
        />
        <div className="flex gap-2 flex-wrap">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${category === c ? 'bg-[#6366f1] text-white' : 'bg-[#111111] text-gray-400 hover:text-white border border-white/10'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTemplates.map(t => (
          <div key={t.id} className="bg-[#111111] border border-white/10 rounded-xl p-4 flex flex-col hover:border-[#6366f1]/40 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-sm leading-tight flex-1 mr-2">{t.title}</h3>
              <span className={`text-xs px-2 py-0.5 rounded border flex-shrink-0 ${CATEGORY_COLORS[t.category]}`}>{t.category}</span>
            </div>
            <p className="text-xs text-gray-400 flex-1 mb-4 leading-relaxed">{t.preview}</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(t)}
                className="flex-1 bg-[#1a1a1a] hover:bg-[#6366f1]/20 border border-white/10 text-xs text-gray-300 hover:text-white py-1.5 rounded-lg transition-colors"
              >
                {copiedId === t.id ? '✓ Copied' : 'Copy'}
              </button>
              <button
                onClick={() => handleFork(t)}
                className="flex-1 bg-[#1a1a1a] hover:bg-[#6366f1]/20 border border-white/10 text-xs text-gray-300 hover:text-white py-1.5 rounded-lg transition-colors"
              >
                Fork
              </button>
            </div>
          </div>
        ))}
        {filteredTemplates.length === 0 && (
          <div className="col-span-full text-center text-gray-500 py-16">No templates found.</div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-white/10 rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-bold mb-4">Create Template</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Title</label>
                <input
                  value={newTemplate.title}
                  onChange={e => setNewTemplate(p => ({ ...p, title: e.target.value }))}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6366f1]"
                  placeholder="Template title…"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Category</label>
                <select
                  value={newTemplate.category}
                  onChange={e => setNewTemplate(p => ({ ...p, category: e.target.value as Exclude<Category, 'All'> }))}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6366f1]"
                >
                  {(['Coding', 'Writing', 'Analysis', 'Creative'] as const).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Prompt Content</label>
                <textarea
                  value={newTemplate.content}
                  onChange={e => setNewTemplate(p => ({ ...p, content: e.target.value }))}
                  rows={6}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#6366f1] resize-none"
                  placeholder="Write your prompt template…"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-[#1a1a1a] hover:bg-[#252525] border border-white/10 text-sm text-gray-300 py-2 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleCreate} className="flex-1 bg-[#6366f1] hover:bg-[#5254cc] text-white text-sm font-medium py-2 rounded-lg transition-colors">Create</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
