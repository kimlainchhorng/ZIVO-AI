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
  accentLight: 'rgba(99,102,241,0.15)',
  accentBorder: 'rgba(99,102,241,0.3)',
  error: '#ef4444',
  errorBg: 'rgba(239,68,68,0.1)',
  errorBorder: 'rgba(239,68,68,0.25)',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
};

export default function APIClientPage() {
  const [openApiSpec, setOpenApiSpec] = useState('');
  const [language, setLanguage] = useState<Language>('typescript');
  const [clientName, setClientName] = useState('ApiClient');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<APIClientResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function handleGenerate() {
    if (!openApiSpec.trim()) {
      setError('Please paste your OpenAPI spec before generating.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/generate-api-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openApiSpec, language, clientName: clientName.trim() || 'ApiClient' }),
      });
      const data: APIClientResult | { error: unknown } = await res.json();
      if (!res.ok) {
        setError(String((data as { error: unknown }).error ?? 'Failed to generate client'));
        return;
      }
      setResult(data as APIClientResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(content: string, key: string) {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    }).catch(() => {});
  }

  function downloadZip() {
    if (!result) return;
    const name = (clientName.trim() || 'ApiClient').replace(/\s+/g, '-');
    const content = result.files.map((f) => `// ${f.path}\n${f.content}`).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}-client.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        textarea:focus, input:focus { outline: none; }
      `}</style>
      <div
        style={{
          minHeight: '100vh',
          background: COLORS.bg,
          color: COLORS.textPrimary,
          fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
          padding: '2rem',
        }}
      >
        {/* Page Header */}
        <div className="zivo-page-header" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h1 className="zivo-page-title">API Client Generator</h1>
            <p className="zivo-page-subtitle">
              Paste an OpenAPI 3.x spec and generate a typed TypeScript, Python, or cURL client
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', animation: 'fadeIn 0.4s ease' }}>
          {/* Left: Input Panel */}
          <div
            style={{
              background: COLORS.bgPanel,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '12px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            {/* OpenAPI Spec */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: COLORS.textSecondary, marginBottom: '0.5rem' }}>
                OpenAPI Spec
              </label>
              <textarea
                value={openApiSpec}
                onChange={(e) => setOpenApiSpec(e.target.value)}
                placeholder="# Paste your OpenAPI 3.x YAML or JSON spec here…"
                rows={14}
                style={{
                  width: '100%',
                  background: COLORS.bgCard,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  color: COLORS.textPrimary,
                  fontSize: '0.8125rem',
                  fontFamily: 'monospace',
                  padding: '0.75rem',
                  resize: 'vertical',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.accentBorder; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = COLORS.border; }}
              />
            </div>

            {/* Language Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: COLORS.textSecondary, marginBottom: '0.5rem' }}>
                Target Language
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['typescript', 'python', 'curl'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    style={{
                      padding: '0.4rem 1rem',
                      borderRadius: '6px',
                      border: `1px solid ${language === lang ? COLORS.accentBorder : COLORS.border}`,
                      background: language === lang ? COLORS.accentLight : 'transparent',
                      color: language === lang ? COLORS.accent : COLORS.textSecondary,
                      fontSize: '0.8125rem',
                      fontWeight: language === lang ? 600 : 400,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                      transition: 'all 0.15s',
                    }}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Client Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: COLORS.textSecondary, marginBottom: '0.5rem' }}>
                Client Name
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="ApiClient"
                style={{
                  width: '100%',
                  background: COLORS.bgCard,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  color: COLORS.textPrimary,
                  fontSize: '0.875rem',
                  padding: '0.5rem 0.75rem',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.accentBorder; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = COLORS.border; }}
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                padding: '0.75rem',
                background: loading ? 'rgba(99,102,241,0.5)' : COLORS.accent,
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'opacity 0.15s',
              }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite',
                    }}
                  />
                  Generating…
                </>
              ) : (
                'Generate Client'
              )}
            </button>

            {/* Error */}
            {error && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  background: COLORS.errorBg,
                  border: `1px solid ${COLORS.errorBorder}`,
                  borderRadius: '8px',
                  color: COLORS.error,
                  fontSize: '0.875rem',
                }}
              >
                {error}
              </div>
            )}
          </div>

          {/* Right: Results Panel */}
          <div
            style={{
              background: COLORS.bgPanel,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '12px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              minHeight: '300px',
            }}
          >
            {!result && !loading && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.textMuted, fontSize: '0.875rem' }}>
                Generated client will appear here
              </div>
            )}

            {loading && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    border: '3px solid rgba(99,102,241,0.2)',
                    borderTopColor: COLORS.accent,
                    borderRadius: '50%',
                  }}
                />
                <span style={{ color: COLORS.textSecondary, fontSize: '0.875rem' }}>Generating client…</span>
              </div>
            )}

            {result && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: COLORS.textPrimary }}>
                    {result.files.length} file{result.files.length !== 1 ? 's' : ''} generated
                  </span>
                  <button
                    onClick={downloadZip}
                    style={{
                      padding: '0.35rem 0.875rem',
                      background: COLORS.accentLight,
                      border: `1px solid ${COLORS.accentBorder}`,
                      borderRadius: '6px',
                      color: COLORS.accent,
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Download Files
                  </button>
                </div>

                {result.dependencies.length > 0 && (
                  <div
                    style={{
                      padding: '0.75rem',
                      background: COLORS.bgCard,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '8px',
                      fontSize: '0.8125rem',
                    }}
                  >
                    <div style={{ color: COLORS.textMuted, marginBottom: '0.4rem', fontWeight: 600 }}>Dependencies</div>
                    <div style={{ color: COLORS.textSecondary, fontFamily: 'monospace' }}>
                      {result.dependencies.join(' ')}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
                  {result.files.map((file) => (
                    <div
                      key={file.path}
                      style={{
                        background: COLORS.bgCard,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: '8px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem 0.75rem',
                          borderBottom: `1px solid ${COLORS.border}`,
                          background: 'rgba(255,255,255,0.02)',
                        }}
                      >
                        <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: COLORS.textSecondary }}>
                          {file.path}
                        </span>
                        <button
                          onClick={() => copyToClipboard(file.content, file.path)}
                          style={{
                            padding: '0.2rem 0.6rem',
                            background: 'transparent',
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: '4px',
                            color: copied === file.path ? '#10b981' : COLORS.textMuted,
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            transition: 'color 0.15s',
                          }}
                        >
                          {copied === file.path ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <pre
                        style={{
                          margin: 0,
                          padding: '0.75rem',
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          color: COLORS.textSecondary,
                          overflowX: 'auto',
                          maxHeight: '320px',
                          overflowY: 'auto',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all',
                        }}
                      >
                        {file.content}
                      </pre>
                    </div>
                  ))}
                </div>

                {result.usage && (
                  <div
                    style={{
                      background: COLORS.bgCard,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '8px',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ padding: '0.5rem 0.75rem', borderBottom: `1px solid ${COLORS.border}`, fontSize: '0.75rem', color: COLORS.textMuted, fontWeight: 600 }}>
                      Usage Example
                    </div>
                    <pre
                      style={{
                        margin: 0,
                        padding: '0.75rem',
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                        color: COLORS.textSecondary,
                        overflowX: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                      }}
                    >
                      {result.usage}
                    </pre>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
