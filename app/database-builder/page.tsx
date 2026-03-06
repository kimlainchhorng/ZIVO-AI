'use client';

import { useState } from 'react';
import type { DatabaseSchema, Table, Relationship } from '@/lib/ai/database-generator';

const COLORS = {
  bg: "#0a0b14",
  bgPanel: "#0f1120",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#475569",
  success: "#10b981",
};

type ActiveTab = 'sql' | 'prisma' | 'types' | 'seed';

export default function DatabaseBuilderPage() {
  const [prompt, setPrompt] = useState('');
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('sql');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    setSchema(null);
    try {
      const res = await fetch('/api/database-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, projectName }),
      });
      const data = await res.json() as DatabaseSchema & { error?: string };
      if (data.error) {
        setError(data.error);
      } else {
        setSchema(data);
        setActiveTab('sql');
      }
    } catch {
      setError('Failed to generate schema. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabContent: Record<ActiveTab, string> = {
    sql: schema?.supabase_sql ?? '',
    prisma: schema?.prisma_schema ?? '',
    types: schema?.typescript_types ?? '',
    seed: schema?.seed_data ?? '',
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        .tab-btn:hover { color: #f1f5f9 !important; }
        .table-card:hover { border-color: rgba(99,102,241,0.4) !important; }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: COLORS.bg, color: COLORS.textPrimary, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
        <div style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>

          {/* Header */}
          <div style={{ marginBottom: '2rem', animation: 'fadeIn 0.4s ease' }}>
            <a href="/ai" style={{ fontSize: '0.8125rem', color: COLORS.textMuted, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1rem' }}>
              ← Back to Builder
            </a>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
              🗄️ AI Database Builder
            </h1>
            <p style={{ fontSize: '0.9375rem', color: COLORS.textSecondary, margin: 0 }}>
              Describe your app and get a complete database schema with SQL migrations, Prisma schema, and TypeScript types.
            </p>
          </div>

          {/* Input Section */}
          <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', animation: 'fadeIn 0.4s ease 0.1s both' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                  App Description
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. A booking app for drivers and passengers with payments, ratings, and ride history..."
                  rows={3}
                  style={{ width: '100%', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: '8px', padding: '0.75rem', color: COLORS.textPrimary, fontSize: '0.9375rem', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ width: '200px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                  Project Name (optional)
                </label>
                <input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. RideShare"
                  style={{ width: '100%', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: '8px', padding: '0.75rem', color: COLORS.textPrimary, fontSize: '0.9375rem', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              style={{ padding: '0.625rem 1.5rem', background: loading ? 'rgba(99,102,241,0.5)' : COLORS.accentGradient, border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.9375rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? '⏳ Generating Schema…' : '✨ Generate Schema'}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', color: '#ef4444', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          {/* Results */}
          {schema && (
            <div style={{ animation: 'fadeIn 0.4s ease' }}>
              {/* Tables Grid */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 600, color: COLORS.textPrimary, marginBottom: '0.75rem' }}>
                  📦 Tables ({schema.tables.length})
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                  {schema.tables.map((table: Table) => (
                    <div key={table.name} className="table-card" style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: '10px', padding: '1rem', transition: 'border-color 0.2s' }}>
                      <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: COLORS.accent, margin: '0 0 0.5rem', fontFamily: 'monospace' }}>{table.name}</h3>
                      {table.description && <p style={{ fontSize: '0.75rem', color: COLORS.textSecondary, marginBottom: '0.5rem' }}>{table.description}</p>}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {table.columns.map((col) => (
                          <div key={col.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                            <span style={{ color: COLORS.textPrimary, fontFamily: 'monospace' }}>
                              {col.primaryKey ? '🔑 ' : col.foreignKey ? '🔗 ' : ''}{col.name}
                              {col.nullable ? '' : <span style={{ color: COLORS.accent }}> *</span>}
                            </span>
                            <span style={{ color: COLORS.textMuted, fontFamily: 'monospace' }}>{col.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Relationships */}
              {schema.relationships.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1rem', fontWeight: 600, color: COLORS.textPrimary, marginBottom: '0.75rem' }}>🔗 Relationships</h2>
                  <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: '10px', padding: '1rem' }}>
                    {schema.relationships.map((rel: Relationship, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.375rem 0', borderBottom: i < schema.relationships.length - 1 ? `1px solid ${COLORS.border}` : 'none', fontSize: '0.8125rem' }}>
                        <span style={{ color: COLORS.accent, fontFamily: 'monospace', fontWeight: 600 }}>{rel.from}</span>
                        <span style={{ color: COLORS.textMuted }}>
                          {rel.type === 'one-to-many' ? '1 → ∞' : rel.type === 'many-to-many' ? '∞ ↔ ∞' : '1 → 1'}
                        </span>
                        <span style={{ color: COLORS.accent, fontFamily: 'monospace', fontWeight: 600 }}>{rel.to}</span>
                        {rel.via && <span style={{ color: COLORS.textMuted }}>via {rel.via}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Code Tabs */}
              <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', borderBottom: `1px solid ${COLORS.border}`, padding: '0 1rem' }}>
                  {(['sql', 'prisma', 'types', 'seed'] as ActiveTab[]).map((tab) => (
                    <button
                      key={tab}
                      className="tab-btn"
                      onClick={() => setActiveTab(tab)}
                      style={{
                        padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer',
                        color: activeTab === tab ? COLORS.accent : COLORS.textMuted,
                        fontWeight: activeTab === tab ? 600 : 400,
                        fontSize: '0.8125rem',
                        borderBottom: activeTab === tab ? `2px solid ${COLORS.accent}` : '2px solid transparent',
                        transition: 'color 0.15s',
                      }}
                    >
                      {tab === 'sql' ? 'SQL Migration' : tab === 'prisma' ? 'Prisma Schema' : tab === 'types' ? 'TypeScript Types' : 'Seed Data'}
                    </button>
                  ))}
                  <div style={{ flex: 1 }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleCopy(tabContent[activeTab])}
                      style={{ padding: '0.375rem 0.875rem', background: copied ? 'rgba(16,185,129,0.15)' : COLORS.bgCard, border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : COLORS.border}`, borderRadius: '6px', color: copied ? COLORS.success : COLORS.textSecondary, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500 }}
                    >
                      {copied ? '✓ Copied' : '⎘ Copy'}
                    </button>
                  </div>
                </div>
                <pre style={{ margin: 0, padding: '1.25rem', fontSize: '0.8125rem', color: COLORS.textPrimary, fontFamily: "'JetBrains Mono','Fira Code',monospace", overflowX: 'auto', maxHeight: '400px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', lineHeight: 1.6 }}>
                  {tabContent[activeTab]}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
