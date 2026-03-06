'use client';
import { useState } from 'react';

type Language = 'typescript' | 'python' | 'curl';

interface GeneratedFile {
  path: string;
  content: string;
}

interface APIClientResult {
  files: GeneratedFile[];
  usage: string;
  dependencies: string[];
}

const COLORS = {
  bg: '#0a0b14',
  bgPanel: '#0f1120',
  bgCard: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  accent: '#6366f1',
  success: '#10b981',
  error: '#ef4444',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
};

export default function APIClientPage() {
  const [spec, setSpec] = useState('');
  const [language, setLanguage] = useState<Language>('typescript');
  const [clientName, setClientName] = useState('ApiClient');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<APIClientResult | null>(null);
  const [error, setError] = useState('');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!spec.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/generate-api-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openApiSpec: spec, language, clientName }),
      });
      const data = await res.json() as APIClientResult & { error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? 'Failed to generate');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (file: GeneratedFile) => {
    await navigator.clipboard.writeText(file.content).catch(() => {});
    setCopiedFile(file.path);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  return (
    <main style={{ minHeight: '100vh', background: COLORS.bg, color: COLORS.textPrimary, padding: '2rem', fontFamily: 'inherit' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div className="zivo-page-header">
          <div>
            <h1 className="zivo-page-title">API Client Generator</h1>
            <p className="zivo-page-subtitle">Paste an OpenAPI 3.x spec and generate a typed client in TypeScript, Python, or cURL</p>
          </div>
        </div>

        {/* Config row */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {/* Language tabs */}
          <div style={{ display: 'flex', gap: '0.25rem', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 4 }}>
            {(['typescript', 'python', 'curl'] as Language[]).map(lang => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                style={{
                  padding: '0.375rem 0.875rem', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: language === lang ? COLORS.accent : 'transparent',
                  color: language === lang ? '#fff' : COLORS.textSecondary,
                  fontSize: '0.8125rem', fontWeight: language === lang ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Client name */}
          <input
            value={clientName}
            onChange={e => setClientName(e.target.value)}
            placeholder="Client name (e.g. ApiClient)"
            style={{
              flex: 1, minWidth: 160, background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
              borderRadius: 8, color: COLORS.textPrimary, padding: '0.5rem 0.75rem', fontSize: '0.875rem',
              outline: 'none', fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Spec textarea */}
        <textarea
          value={spec}
          onChange={e => setSpec(e.target.value)}
          placeholder="# Paste your OpenAPI 3.x YAML or JSON spec here…"
          rows={14}
          className="zivo-textarea"
          style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: '0.8rem', marginBottom: '1rem' }}
        />

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={loading || !spec.trim()}
          className="zivo-btn"
          style={{
            background: loading ? 'rgba(99,102,241,0.4)' : COLORS.accent,
            color: '#fff', border: 'none', borderRadius: 8, padding: '0.625rem 1.5rem',
            fontSize: '0.875rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}
        >
          {loading ? 'Generating…' : 'Generate Client'}
        </button>

        {/* Error */}
        {error && (
          <div className="zivo-alert error" style={{ marginBottom: '1rem' }}>{error}</div>
        )}

        {/* Results */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {result.dependencies.length > 0 && (
              <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '0.875rem 1rem' }}>
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Dependencies</p>
                <code style={{ fontSize: '0.8rem', color: '#a5f3fc', fontFamily: 'monospace' }}>
                  {language === 'typescript' ? 'npm install ' : language === 'python' ? 'pip install ' : ''}{result.dependencies.join(' ')}
                </code>
              </div>
            )}

            {result.usage && (
              <div style={{ background: '#080910', border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ padding: '0.5rem 0.875rem', borderBottom: `1px solid ${COLORS.border}`, fontSize: '0.75rem', color: COLORS.textMuted }}>Usage Example</div>
                <pre style={{ margin: 0, padding: '0.875rem', fontSize: '0.78rem', color: '#bbf7d0', fontFamily: 'monospace', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                  {result.usage}
                </pre>
              </div>
            )}

            {result.files.map(file => (
              <div key={file.path} style={{ background: '#080910', border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.875rem', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bgCard }}>
                  <span style={{ fontSize: '0.78rem', color: COLORS.textMuted, fontFamily: 'monospace' }}>{file.path}</span>
                  <button
                    onClick={() => handleCopy(file)}
                    style={{ background: 'none', border: 'none', color: copiedFile === file.path ? COLORS.success : COLORS.textSecondary, cursor: 'pointer', fontSize: '0.75rem', padding: '2px 6px' }}
                  >
                    {copiedFile === file.path ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre style={{ margin: 0, padding: '0.875rem', fontSize: '0.78rem', color: '#f1f5f9', fontFamily: 'monospace', overflowX: 'auto', whiteSpace: 'pre-wrap', maxHeight: 400, overflowY: 'auto' }}>
                  {file.content}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
