'use client';

import { useState } from 'react';

interface DependencyViewerProps {
  packageJsonContent: string;
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

type Category = 'UI' | 'AI' | 'Database' | 'Auth' | 'Utils' | 'Other';

const CATEGORY_COLORS: Record<Category, string> = {
  UI: '#818cf8',
  AI: '#c084fc',
  Database: '#34d399',
  Auth: '#fb923c',
  Utils: '#38bdf8',
  Other: COLORS.textMuted,
};

const CATEGORY_PREFIXES: Record<Category, string[]> = {
  UI: ['react', 'next', 'tailwindcss', 'framer-motion', 'lucide-react'],
  AI: ['openai', '@anthropic-ai/sdk', '@google/generative-ai'],
  Database: ['@supabase/supabase-js', 'prisma', '@prisma/client'],
  Auth: ['next-auth', '@clerk/nextjs'],
  Utils: ['zod', 'date-fns', 'axios', 'lodash', 'immer', 'zustand'],
  Other: [],
};

function categorize(name: string): Category {
  for (const [cat, names] of Object.entries(CATEGORY_PREFIXES) as [Category, string[]][]) {
    if (cat === 'Other') continue;
    if (names.some((n) => name === n || name.startsWith(n))) return cat;
  }
  return 'Other';
}

interface DepRow {
  name: string;
  version: string;
  category: Category;
}

function parseDeps(content: string): DepRow[] {
  try {
    const pkg = JSON.parse(content) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    const all: Record<string, string> = { ...pkg.dependencies, ...pkg.devDependencies };
    return Object.entries(all).map(([name, version]) => ({ name, version, category: categorize(name) }));
  } catch {
    return [];
  }
}

/** Rough average size in bytes used to estimate total bundle size from dep count. */
const AVG_DEPENDENCY_SIZE_BYTES = 50 * 1024;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function DependencyViewer({ packageJsonContent }: DependencyViewerProps) {
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<Category | 'All'>('All');

  const deps = parseDeps(packageJsonContent);
  const filtered = filter === 'All' ? deps : deps.filter((d) => d.category === filter);
  const estimatedSize = deps.length * AVG_DEPENDENCY_SIZE_BYTES;

  function handleInstall() {
    const names = deps.map((d) => d.name).join(' ');
    navigator.clipboard.writeText(`npm install ${names}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const categories: (Category | 'All')[] = ['All', 'UI', 'AI', 'Database', 'Auth', 'Utils', 'Other'];

  return (
    <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h3 style={{ margin: 0, color: COLORS.textPrimary, fontSize: 15, fontWeight: 600 }}>Dependencies</h3>
          <span style={{ color: COLORS.textMuted, fontSize: 12 }}>
            {deps.length} packages · Est. bundle {formatSize(estimatedSize)}
          </span>
        </div>
        <button
          onClick={handleInstall}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            border: `1px solid ${COLORS.accent}`,
            background: `${COLORS.accent}22`,
            color: copied ? COLORS.success : COLORS.accent,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {copied ? '✓ Copied!' : 'Install Dependencies'}
        </button>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding: '3px 10px',
              borderRadius: 6,
              border: `1px solid ${filter === cat ? (cat === 'All' ? COLORS.accent : CATEGORY_COLORS[cat as Category]) : COLORS.border}`,
              background: filter === cat ? `${cat === 'All' ? COLORS.accent : CATEGORY_COLORS[cat as Category]}22` : 'transparent',
              color: filter === cat ? (cat === 'All' ? COLORS.accent : CATEGORY_COLORS[cat as Category]) : COLORS.textMuted,
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Dep list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 360, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <span style={{ color: COLORS.textMuted, fontSize: 13 }}>No dependencies found.</span>
        ) : (
          filtered.map((dep) => (
            <div
              key={dep.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 8,
                background: COLORS.bgCard,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <span
                style={{
                  padding: '1px 7px',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 700,
                  background: `${CATEGORY_COLORS[dep.category]}22`,
                  color: CATEGORY_COLORS[dep.category],
                  flexShrink: 0,
                  width: 62,
                  textAlign: 'center',
                }}
              >
                {dep.category}
              </span>
              <a
                href={`https://www.npmjs.com/package/${dep.name}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: COLORS.textPrimary, fontSize: 13, flex: 1, textDecoration: 'none', fontFamily: 'monospace' }}
              >
                {dep.name}
              </a>
              <span style={{ color: COLORS.textMuted, fontSize: 12, fontFamily: 'monospace', flexShrink: 0 }}>{dep.version}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
