'use client';

import NavBar from '../components/NavBar';
import { useState } from 'react';

const COLORS = {
  bg: "#0a0b14",
  bgPanel: "#0f1120",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
};

const fadeInCSS = '@keyframes fadeIn { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }';

const CATEGORIES = ['All', 'Code', 'Design', 'Research', 'Data', 'Custom'] as const;
type Category = typeof CATEGORIES[number];

interface Prompt {
  id: number;
  title: string;
  description: string;
  category: Exclude<Category, 'All'>;
  usage: number;
  fullText: string;
}

const PROMPTS: Prompt[] = [
  {
    id: 1, title: 'React Component Generator', category: 'Code', usage: 1240,
    description: 'Generate reusable React components from description',
    fullText: 'You are an expert React developer. Generate a reusable, well-typed React component based on the following description:\n\n{description}\n\nRequirements:\n- Use TypeScript with proper types\n- Include props interface\n- Add JSDoc comments\n- Use functional component with hooks\n- Export as default',
  },
  {
    id: 2, title: 'API Endpoint Builder', category: 'Code', usage: 980,
    description: 'Create RESTful API endpoints with validation',
    fullText: 'You are a backend API architect. Create a RESTful API endpoint for the following resource:\n\n{resource}\n\nInclude:\n- Input validation with Zod\n- Error handling middleware\n- OpenAPI documentation comments\n- Rate limiting headers\n- TypeScript types for request/response',
  },
  {
    id: 3, title: 'Landing Page Copy', category: 'Design', usage: 765,
    description: 'Write compelling landing page headlines and CTAs',
    fullText: 'You are a conversion-focused copywriter. Write landing page copy for:\n\nProduct: {product}\nTarget audience: {audience}\nMain benefit: {benefit}\n\nDeliver:\n- Hero headline (max 8 words)\n- Sub-headline (max 20 words)\n- 3 feature bullets\n- Primary CTA button text\n- Secondary CTA text',
  },
  {
    id: 4, title: 'UI Color Palette', category: 'Design', usage: 543,
    description: 'Generate cohesive color palettes for web apps',
    fullText: 'You are a UI/UX designer specializing in color theory. Generate a cohesive color palette for:\n\nApp type: {appType}\nMood/tone: {mood}\n\nProvide:\n- Primary color (hex)\n- Secondary color (hex)\n- Accent color (hex)\n- Background colors (light/dark variants)\n- Text colors\n- Semantic colors (success, warning, error)\n- CSS custom properties',
  },
  {
    id: 5, title: 'Literature Review Summary', category: 'Research', usage: 412,
    description: 'Summarize academic papers concisely',
    fullText: 'You are an academic research assistant. Summarize the following paper:\n\n{paperText}\n\nProvide:\n- One-sentence abstract\n- Key methodology (2-3 sentences)\n- Main findings (bullet list)\n- Limitations noted by authors\n- Relevance to {researchArea}\n- Citation in APA format',
  },
  {
    id: 6, title: 'Market Research Analyzer', category: 'Research', usage: 329,
    description: 'Extract key insights from market data',
    fullText: 'You are a market research analyst. Analyze the following market data:\n\n{data}\n\nExtract:\n- Top 3 market trends\n- Key competitor insights\n- Target customer segments\n- Market size estimate\n- Growth opportunities\n- Risk factors\n- Strategic recommendations',
  },
  {
    id: 7, title: 'SQL Query Optimizer', category: 'Data', usage: 891,
    description: 'Optimize slow database queries',
    fullText: 'You are a database performance expert. Optimize the following SQL query:\n\n{query}\n\nSchema context: {schema}\n\nProvide:\n- Optimized query\n- Explanation of changes\n- Suggested indexes\n- Expected performance improvement\n- Alternative approaches if applicable',
  },
  {
    id: 8, title: 'Custom Chatbot Persona', category: 'Custom', usage: 607,
    description: 'Define AI assistant personality and behavior',
    fullText: 'Define a custom AI assistant persona with the following parameters:\n\nName: {name}\nPurpose: {purpose}\nTone: {tone}\n\nSpecify:\n- Personality traits (5 bullet points)\n- Communication style\n- Topics to emphasize\n- Topics to avoid\n- Example greeting message\n- Fallback response for out-of-scope queries\n- Response length guidelines',
  },
];

const CATEGORY_COLORS: Record<Exclude<Category, 'All'>, string> = {
  Code: '#6366f1',
  Design: '#8b5cf6',
  Research: '#06b6d4',
  Data: '#22c55e',
  Custom: '#f59e0b',
};

export default function PromptLibrary() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<Category>('All');
  const [saved, setSaved] = useState<Set<number>>(new Set([1, 5]));
  const [toast, setToast] = useState('');
  const [modal, setModal] = useState<Prompt | null>(null);
  const [copied, setCopied] = useState(false);

  const filtered = PROMPTS.filter(p => {
    const matchCat = activeTab === 'All' || p.category === activeTab;
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleFork = (p: Prompt) => showToast(`✓ Forked "${p.title}" to your library`);
  const toggleSave = (id: number) => {
    setSaved(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const handleCopy = () => {
    if (modal) {
      navigator.clipboard.writeText(modal.fullText).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', color: COLORS.textPrimary }}>
      <style>{fadeInCSS}</style>
      <NavBar />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px', animation: 'fadeIn 0.4s ease' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Prompt Library</h1>
            <p style={{ color: COLORS.textSecondary, margin: '6px 0 0' }}>Browse, save, and fork AI prompts</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => showToast('Importing prompts...')} style={btnOutline}>Import</button>
            <button onClick={() => showToast('Exporting library...')} style={btnOutline}>Export</button>
          </div>
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search prompts..."
          style={{
            width: '100%', padding: '10px 16px', background: COLORS.bgCard,
            border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textPrimary,
            fontSize: 14, marginBottom: 20, boxSizing: 'border-box',
          }}
        />

        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              style={{
                padding: '6px 18px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                border: `1px solid ${activeTab === cat ? COLORS.accent : COLORS.border}`,
                background: activeTab === cat ? COLORS.accent : 'transparent',
                color: activeTab === cat ? '#fff' : COLORS.textSecondary,
                transition: 'all 0.2s',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
          {filtered.map(p => (
            <div key={p.id} style={{
              background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12,
              padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{
                  background: CATEGORY_COLORS[p.category] + '22',
                  color: CATEGORY_COLORS[p.category],
                  fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                }}>
                  {p.category}
                </span>
                <button onClick={() => toggleSave(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: 0 }}>
                  {saved.has(p.id) ? '❤️' : '🤍'}
                </button>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{p.title}</h3>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.5 }}>{p.description}</p>
              </div>
              <div style={{ color: COLORS.textMuted, fontSize: 12 }}>⚡ {p.usage.toLocaleString()} uses</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button onClick={() => setModal(p)} style={btnAccent}>Use</button>
                <button onClick={() => handleFork(p)} style={btnOutline}>Fork</button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p style={{ color: COLORS.textMuted, gridColumn: '1/-1', textAlign: 'center', padding: 40 }}>
              No prompts match your search.
            </p>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24,
        }} onClick={() => setModal(null)}>
          <div style={{
            background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 16,
            padding: 32, maxWidth: 600, width: '100%', maxHeight: '80vh', overflowY: 'auto',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>{modal.title}</h2>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: COLORS.textSecondary, cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>
            <pre style={{
              background: 'rgba(0,0,0,0.3)', border: `1px solid ${COLORS.border}`, borderRadius: 8,
              padding: 16, fontSize: 13, color: COLORS.textSecondary, whiteSpace: 'pre-wrap', lineHeight: 1.6,
            }}>
              {modal.fullText}
            </pre>
            <button onClick={handleCopy} style={{ ...btnAccent, marginTop: 16 }}>
              {copied ? '✓ Copied!' : 'Copy Prompt'}
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, background: COLORS.accent, color: '#fff',
          padding: '12px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500, zIndex: 200,
          animation: 'fadeIn 0.3s ease',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}

const btnAccent: React.CSSProperties = {
  background: COLORS.accent, color: '#fff', border: 'none', borderRadius: 7,
  padding: '7px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
};
const btnOutline: React.CSSProperties = {
  background: 'transparent', color: COLORS.textSecondary,
  border: `1px solid ${COLORS.border}`, borderRadius: 7,
  padding: '7px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
};
