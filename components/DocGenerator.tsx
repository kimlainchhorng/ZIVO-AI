'use client';

import { useState } from 'react';
import JSZip from 'jszip';

interface DocGeneratorProps {
  files?: Array<{ path: string; content: string; action?: string }>;
  projectName?: string;
}

const COLORS = {
  bg: '#0a0b14',
  bgPanel: '#0f1120',
  bgCard: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  accent: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
};

type TabKey = 'readme' | 'api' | 'components' | 'setup';

const TABS: { key: TabKey; label: string; filename: string }[] = [
  { key: 'readme', label: 'README', filename: 'README.md' },
  { key: 'api', label: 'API Docs', filename: 'API.md' },
  { key: 'components', label: 'Components', filename: 'COMPONENTS.md' },
  { key: 'setup', label: 'Setup Guide', filename: 'SETUP.md' },
];

type DocContent = Record<TabKey, string>;

export default function DocGenerator({ files, projectName = 'Project' }: DocGeneratorProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('readme');
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<DocContent | null>(null);
  const [copied, setCopied] = useState<TabKey | null>(null);

  async function handleGenerate() {
    if (!files?.length) return;
    setLoading(true);
    setDocs(null);

    try {
      const res = await fetch('/api/generate-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files, projectName }),
      });

      if (!res.ok || !res.body) {
        setLoading(false);
        return;
      }

      const partial: DocContent = { readme: '', api: '', components: '', setup: '' };
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((l) => l.startsWith('data:'));

        for (const line of lines) {
          try {
            const payload = JSON.parse(line.slice(5)) as { tab: TabKey; content: string };
            partial[payload.tab] = (partial[payload.tab] ?? '') + payload.content;
            setDocs({ ...partial });
          } catch {
            // ignore malformed SSE frames
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(key: TabKey) {
    const text = docs?.[key] ?? '';
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  async function handleDownloadZip() {
    if (!docs) return;
    const zip = new JSZip();
    TABS.forEach(({ key, filename }) => {
      zip.file(filename, docs[key] ?? '');
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}-docs.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const currentContent = docs?.[activeTab] ?? '';

  return (
    <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ margin: 0, color: COLORS.textPrimary, fontSize: 15, fontWeight: 600 }}>Documentation Generator</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={handleGenerate}
            disabled={loading || !files?.length}
            style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${COLORS.accent}`, background: `${COLORS.accent}22`, color: COLORS.accent, fontSize: 12, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: !files?.length ? 0.5 : 1 }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Spinner /> Generating…
              </span>
            ) : docs ? 'Regenerate' : 'Generate Documentation'}
          </button>
          {docs && (
            <button
              onClick={handleDownloadZip}
              style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${COLORS.border}`, background: 'transparent', color: COLORS.textSecondary, fontSize: 12, cursor: 'pointer' }}
            >
              Download ZIP
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${COLORS.border}`, gap: 0 }}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === key ? `2px solid ${COLORS.accent}` : '2px solid transparent',
              color: activeTab === key ? COLORS.accent : COLORS.textMuted,
              fontSize: 13,
              fontWeight: activeTab === key ? 600 : 400,
              cursor: 'pointer',
              marginBottom: -1,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div style={{ position: 'relative', minHeight: 200 }}>
        {!docs && !loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: COLORS.textMuted, fontSize: 13 }}>
            Click &quot;Generate Documentation&quot; to create docs for your project
          </div>
        ) : loading && !docs ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '48px 0', gap: 10, color: COLORS.textSecondary, fontSize: 13 }}>
            <Spinner /> Generating documentation…
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <button
                onClick={() => handleCopy(activeTab)}
                style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${COLORS.border}`, background: 'transparent', color: copied === activeTab ? COLORS.success : COLORS.textMuted, fontSize: 11, cursor: 'pointer' }}
              >
                {copied === activeTab ? '✓ Copied' : 'Copy Markdown'}
              </button>
            </div>
            <pre
              style={{
                margin: 0,
                padding: '12px 16px',
                borderRadius: 8,
                background: COLORS.bgCard,
                border: `1px solid ${COLORS.border}`,
                color: COLORS.textSecondary,
                fontSize: 12,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: 480,
                overflowY: 'auto',
                fontFamily: 'monospace',
              }}
            >
              {currentContent || <span style={{ color: COLORS.textMuted }}>No content yet…</span>}
            </pre>
          </>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      width={14} height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      style={{ animation: 'spin 0.8s linear infinite' }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
