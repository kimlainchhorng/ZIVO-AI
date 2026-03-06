'use client';

import React, { useMemo, useState } from 'react';

interface GeneratedFile {
  path: string;
  content: string;
  action?: 'create' | 'update' | 'delete';
}

interface GeneratedAppAnalysisProps {
  files: GeneratedFile[];
}

const COLORS = {
  bg: '#0a0b14',
  bgPanel: '#0f1120',
  bgCard: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  accent: '#6366f1',
  success: '#10b981',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
};

/** Extract Next.js routes from generated file paths */
function extractRoutes(files: GeneratedFile[]): string[] {
  const routes = new Set<string>();
  for (const f of files) {
    const p = f.path.replace(/\\/g, '/');
    // Match Next.js App Router pages
    const appMatch = p.match(/app(\/.*?)\/page\.(tsx?|jsx?)$/);
    if (appMatch) {
      const route = appMatch[1] || '/';
      routes.add(route === '' ? '/' : route);
      continue;
    }
    // Match Next.js Pages Router
    const pagesMatch = p.match(/pages(\/.*?)\.(tsx?|jsx?)$/);
    if (pagesMatch) {
      const r = pagesMatch[1];
      if (!r.startsWith('/_') && !r.startsWith('/api/')) {
        routes.add(r === '/index' ? '/' : r);
      }
    }
  }
  return Array.from(routes).sort((a, b) => a.localeCompare(b));
}

/** Extract component names from generated file paths */
function extractComponents(files: GeneratedFile[]): string[] {
  const comps = new Set<string>();
  for (const f of files) {
    const p = f.path.replace(/\\/g, '/');
    if (p.includes('/components/') || p.match(/\/[A-Z][A-Za-z]+\.(tsx?|jsx?)$/)) {
      const filename = p.split('/').pop() ?? '';
      const name = filename.replace(/\.(tsx?|jsx?)$/, '');
      if (/^[A-Z]/.test(name) && !name.includes('.')) {
        comps.add(name);
      }
    }
  }
  return Array.from(comps).sort();
}

/** Get homepage content from app/page.tsx or pages/index.tsx */
function getHomepageContent(files: GeneratedFile[]): string | null {
  const candidates = ['app/page.tsx', 'app/page.jsx', 'pages/index.tsx', 'pages/index.jsx'];
  for (const c of candidates) {
    const f = files.find((file) => file.path.endsWith(c) || file.path === c);
    if (f) return f.content;
  }
  return null;
}

export default function GeneratedAppAnalysis({ files }: GeneratedAppAnalysisProps) {
  const [expanded, setExpanded] = useState(true);
  const [showFullHomepage, setShowFullHomepage] = useState(false);

  const routes = useMemo(() => extractRoutes(files), [files]);
  const components = useMemo(() => extractComponents(files), [files]);
  const homepageContent = useMemo(() => getHomepageContent(files), [files]);

  if (files.length === 0) return null;

  const homepagePreview = homepageContent
    ? showFullHomepage
      ? homepageContent
      : homepageContent.slice(0, 800) + (homepageContent.length > 800 ? '\n...' : '')
    : null;

  return (
    <div
      style={{
        borderTop: `1px solid ${COLORS.border}`,
        background: COLORS.bgPanel,
        flexShrink: 0,
        animation: 'fadeIn 0.4s ease',
      }}
    >
      {/* Section Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          borderBottom: expanded ? `1px solid ${COLORS.border}` : 'none',
        }}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke={COLORS.textMuted}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          App Analysis
        </span>
        <div style={{ flex: 1 }} />
        <span
          style={{
            fontSize: '0.65rem',
            padding: '1px 7px',
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: '20px',
            color: COLORS.accent,
            fontWeight: 700,
          }}
        >
          {routes.length} routes · {components.length} components
        </span>
      </button>

      {expanded && (
        <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

          {/* Pages & Routes */}
          {routes.length > 0 && (
            <div>
              <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                Pages &amp; Routes
                <span style={{ padding: '0 5px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', color: COLORS.textMuted }}>{routes.length}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                {routes.map((route) => (
                  <span
                    key={route}
                    style={{
                      padding: '0.2rem 0.55rem',
                      background: 'rgba(99,102,241,0.08)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      color: COLORS.accent,
                      fontFamily: 'monospace',
                    }}
                  >
                    {route}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Components */}
          {components.length > 0 && (
            <div>
              <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.27 6.96 8.73 5.04 8.73-5.04"/><path d="M12 22V12"/></svg>
                Components
                <span style={{ padding: '0 5px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', color: COLORS.textMuted }}>{components.length}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                {components.map((comp) => (
                  <span
                    key={comp}
                    style={{
                      padding: '0.2rem 0.55rem',
                      background: COLORS.bgCard,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      color: COLORS.textSecondary,
                    }}
                  >
                    {comp}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Homepage Content */}
          {homepagePreview && (
            <div>
              <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                Homepage Content
              </div>
              <div
                style={{
                  background: '#000',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  padding: '0.6rem 0.75rem',
                  fontSize: '0.72rem',
                  fontFamily: "'Fira Code', 'SF Mono', monospace",
                  color: '#4ade80',
                  lineHeight: 1.6,
                  maxHeight: showFullHomepage ? '400px' : '140px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  transition: 'max-height 0.3s ease',
                }}
              >
                {homepagePreview}
              </div>
              {homepageContent && homepageContent.length > 800 && (
                <button
                  onClick={() => setShowFullHomepage((v) => !v)}
                  style={{
                    marginTop: '0.3rem',
                    background: 'none',
                    border: 'none',
                    color: COLORS.accent,
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    padding: '0 0.25rem',
                  }}
                >
                  {showFullHomepage ? '↑ Show less' : '↓ Show more'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
