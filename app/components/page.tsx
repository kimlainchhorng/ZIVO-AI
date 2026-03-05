'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const COLORS = {
  bg: "#0a0b14",
  bgPanel: "#0f1120",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  borderHover: "rgba(255,255,255,0.16)",
  accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#475569",
};

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

const CATEGORIES = ["All", "Layout", "Forms", "Feedback", "Navigation", "Charts", "Data Display", "Landing Pages", "SaaS", "E-commerce", "Dashboards"];

export default function ComponentsPage() {
  const router = useRouter();
  const [components, setComponents] = useState<MarketplaceComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/marketplace")
      .then((r) => r.json())
      .then((data) => {
        setComponents(Array.isArray(data.components) ? data.components : []);
      })
      .catch(() => setComponents([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = components.filter((c) => {
    const matchCat = activeCategory === "All" || c.category === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  function copyCode(component: MarketplaceComponent) {
    navigator.clipboard.writeText(component.code).catch(() => {});
    setCopiedId(component.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function insertIntoProject(component: MarketplaceComponent) {
    const builtPrompt = `Insert this component into my project:\n\n${component.code}`;
    router.push(`/ai?prompt=${encodeURIComponent(builtPrompt)}`);
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        .comp-search:focus { outline: none; border-color: #6366f1 !important; }
        .comp-cat-btn:hover { background: rgba(99,102,241,0.1) !important; color: #f1f5f9 !important; }
        .comp-card:hover { border-color: rgba(99,102,241,0.4) !important; transform: translateY(-2px); }
        .comp-btn:hover { opacity: 0.85 !important; }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: COLORS.bg, color: COLORS.textPrimary, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
        {/* Header */}
        <div style={{ padding: '2rem 2rem 0', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
          <div style={{ marginBottom: '1.5rem', animation: 'fadeIn 0.4s ease' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>Component Library</h1>
            <p style={{ fontSize: '0.9375rem', color: COLORS.textSecondary, margin: 0 }}>
              Browse, copy, and insert ready-made components into your project
            </p>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <svg style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: COLORS.textMuted }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
            <input
              className="comp-search"
              type="text"
              placeholder="Search components by name or tag…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', maxWidth: '400px', padding: '0.5rem 0.75rem 0.5rem 2.25rem', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: '8px', color: COLORS.textPrimary, fontSize: '0.875rem' }}
            />
          </div>
        </div>

        {/* Body: Sidebar + Grid */}
        <div style={{ display: 'flex', flex: 1, maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '0 2rem 2rem' }}>
          {/* Left Sidebar */}
          <div style={{ width: '180px', flexShrink: 0, paddingRight: '1.5rem', paddingTop: '0.5rem' }}>
            <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Categories</p>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className="comp-cat-btn"
                onClick={() => setActiveCategory(cat)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '0.375rem 0.625rem',
                  background: activeCategory === cat ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: activeCategory === cat ? COLORS.accent : COLORS.textSecondary,
                  border: activeCategory === cat ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                  borderRadius: '6px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: activeCategory === cat ? 600 : 400,
                  marginBottom: '2px', transition: 'all 0.15s',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Main Grid */}
          <div style={{ flex: 1 }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: COLORS.textMuted }}>
                Loading components…
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: COLORS.textMuted }}>
                No components found{searchQuery ? ` for "${searchQuery}"` : ''}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {filtered.map((component, i) => (
                  <div
                    key={component.id}
                    className="comp-card"
                    style={{
                      background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: '12px',
                      overflow: 'hidden', transition: 'all 0.2s ease', animation: `fadeIn 0.3s ease ${i * 0.03}s both`,
                    }}
                  >
                    {/* Preview */}
                    <div style={{ height: '120px', background: '#fff', overflow: 'hidden', position: 'relative' }}>
                      <iframe
                        srcDoc={component.previewHtml}
                        style={{ width: '100%', height: '240px', border: 'none', transform: 'scale(0.5)', transformOrigin: 'top left', pointerEvents: 'none' }}
                        title={component.name}
                        sandbox="allow-scripts"
                      />
                    </div>

                    {/* Info */}
                    <div style={{ padding: '0.875rem' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: COLORS.textPrimary, margin: 0 }}>{component.name}</h3>
                        <span style={{ fontSize: '0.7rem', color: COLORS.textMuted, background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, padding: '1px 6px', borderRadius: '4px', flexShrink: 0, marginLeft: '0.5rem' }}>
                          {component.category}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: COLORS.textSecondary, margin: '0 0 0.75rem', lineHeight: 1.4 }}>{component.description}</p>

                      {/* Tags */}
                      {component.tags.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '0.75rem' }}>
                          {component.tags.slice(0, 3).map((tag) => (
                            <span key={tag} style={{ fontSize: '0.6875rem', color: COLORS.accent, background: 'rgba(99,102,241,0.1)', padding: '1px 6px', borderRadius: '4px' }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="comp-btn"
                          onClick={() => copyCode(component)}
                          style={{
                            flex: 1, padding: '0.375rem 0.75rem', background: COLORS.bgCard,
                            border: `1px solid ${COLORS.border}`, borderRadius: '6px', color: COLORS.textSecondary,
                            cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500, transition: 'opacity 0.15s',
                          }}
                        >
                          {copiedId === component.id ? '✓ Copied' : 'Copy Code'}
                        </button>
                        <button
                          className="comp-btn"
                          onClick={() => insertIntoProject(component)}
                          style={{
                            flex: 1, padding: '0.375rem 0.75rem', background: COLORS.accentGradient,
                            border: 'none', borderRadius: '6px', color: '#fff',
                            cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500, transition: 'opacity 0.15s',
                          }}
                        >
                          Insert
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
