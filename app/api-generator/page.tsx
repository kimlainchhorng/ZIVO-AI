'use client';

import { useState } from 'react';
import type { APIGeneratorResult, APIRoute, GeneratedAPIFile } from '@/lib/ai/api-generator';

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

const METHOD_COLORS: Record<string, string> = {
  GET: "#10b981",
  POST: "#6366f1",
  PUT: "#f59e0b",
  DELETE: "#ef4444",
  PATCH: "#8b5cf6",
};

export default function APIGeneratorPage() {
  const [prompt, setPrompt] = useState('');
  const [framework, setFramework] = useState<'nextjs' | 'express'>('nextjs');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<APIGeneratorResult | null>(null);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<GeneratedAPIFile | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    setSelectedFile(null);
    try {
      const res = await fetch('/api/api-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, framework }),
      });
      const data = await res.json() as APIGeneratorResult & { error?: string };
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
        if (data.files?.length) setSelectedFile(data.files[0] ?? null);
      }
    } catch {
      setError('Failed to generate API routes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAll = async () => {
    if (!result) return;
    const allCode = result.files.map((f) => `// ${f.path}\n${f.content}`).join('\n\n// ---\n\n');
    await navigator.clipboard.writeText(allCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        .file-item:hover { background: rgba(99,102,241,0.1) !important; }
        .route-card:hover { border-color: rgba(99,102,241,0.3) !important; }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: COLORS.bg, color: COLORS.textPrimary, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
        <div style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>

          {/* Header */}
          <div style={{ marginBottom: '2rem', animation: 'fadeIn 0.4s ease' }}>
            <a href="/ai" style={{ fontSize: '0.8125rem', color: COLORS.textMuted, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1rem' }}>
              ← Back to Builder
            </a>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
              ⚡ AI API Generator
            </h1>
            <p style={{ fontSize: '0.9375rem', color: COLORS.textSecondary, margin: 0 }}>
              Generate full CRUD API routes with TypeScript, Zod validation, and Supabase integration.
            </p>
          </div>

          {/* Pipeline diagram */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {['Prompt', 'Tables', 'API Routes', 'Auth', 'Deploy'].map((step, i) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ padding: '0.25rem 0.75rem', background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: '20px', fontSize: '0.75rem', color: i === 0 ? COLORS.accent : COLORS.textMuted }}>
                  {step}
                </div>
                {i < 4 && <span style={{ color: COLORS.textMuted, fontSize: '0.75rem' }}>→</span>}
              </div>
            ))}
          </div>

          {/* Input */}
          <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', animation: 'fadeIn 0.4s ease 0.1s both' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                  App Description
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. E-commerce app with products, orders, users, and payments..."
                  rows={3}
                  style={{ width: '100%', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: '8px', padding: '0.75rem', color: COLORS.textPrimary, fontSize: '0.9375rem', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ width: '160px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                  Framework
                </label>
                <select
                  value={framework}
                  onChange={(e) => setFramework(e.target.value as 'nextjs' | 'express')}
                  style={{ width: '100%', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: '8px', padding: '0.75rem', color: COLORS.textPrimary, fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="nextjs">Next.js</option>
                  <option value="express">Express</option>
                </select>
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              style={{ padding: '0.625rem 1.5rem', background: loading ? 'rgba(99,102,241,0.5)' : COLORS.accentGradient, border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.9375rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? '⏳ Generating Routes…' : '⚡ Generate API Routes'}
            </button>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', color: '#ef4444', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          {result && (
            <div style={{ animation: 'fadeIn 0.4s ease' }}>
              {/* Route Cards */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 600, color: COLORS.textPrimary, marginBottom: '0.75rem' }}>
                  🛣️ Generated Routes ({result.routes.length})
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.5rem' }}>
                  {result.routes.map((route: APIRoute, i: number) => (
                    <div key={i} className="route-card" style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: '8px', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'border-color 0.2s' }}>
                      <span style={{ padding: '0.2rem 0.5rem', background: `${METHOD_COLORS[route.method] ?? COLORS.accent}20`, color: METHOD_COLORS[route.method] ?? COLORS.accent, borderRadius: '4px', fontSize: '0.6875rem', fontWeight: 700, fontFamily: 'monospace', flexShrink: 0 }}>
                        {route.method}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8125rem', color: COLORS.textPrimary, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{route.path}</div>
                        <div style={{ fontSize: '0.6875rem', color: COLORS.textSecondary, marginTop: '0.125rem' }}>{route.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* File Tree + Code Panel */}
              <div style={{ display: 'flex', gap: '1rem', background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ width: '220px', borderRight: `1px solid ${COLORS.border}`, padding: '0.75rem', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Files</div>
                  {result.files.map((file) => (
                    <div
                      key={file.path}
                      className="file-item"
                      onClick={() => setSelectedFile(file)}
                      style={{ padding: '0.375rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'monospace', color: selectedFile?.path === file.path ? COLORS.accent : COLORS.textSecondary, background: selectedFile?.path === file.path ? 'rgba(99,102,241,0.1)' : 'transparent', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'background 0.15s' }}
                    >
                      {file.path.split('/').pop()}
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem', borderBottom: `1px solid ${COLORS.border}` }}>
                    <span style={{ fontSize: '0.75rem', color: COLORS.textMuted, fontFamily: 'monospace' }}>{selectedFile?.path ?? ''}</span>
                    <button
                      onClick={handleCopyAll}
                      style={{ padding: '0.25rem 0.75rem', background: copied ? 'rgba(16,185,129,0.15)' : COLORS.bgCard, border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : COLORS.border}`, borderRadius: '4px', color: copied ? COLORS.success : COLORS.textSecondary, cursor: 'pointer', fontSize: '0.6875rem', fontWeight: 500 }}
                    >
                      {copied ? '✓ Copied All' : '⎘ Copy All'}
                    </button>
                  </div>
                  <pre style={{ margin: 0, padding: '1rem', fontSize: '0.75rem', color: COLORS.textPrimary, fontFamily: "'JetBrains Mono','Fira Code',monospace", overflowX: 'auto', maxHeight: '400px', overflowY: 'auto', lineHeight: 1.6, flex: 1 }}>
                    {selectedFile?.content ?? 'Select a file to view code'}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
