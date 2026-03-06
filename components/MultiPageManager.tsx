'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Globe, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { Page, UIOutput, StylePreset } from '@/types/builder';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_PAGES = ['Home', 'About', 'Pricing', 'Contact', 'Dashboard', 'Settings'];

const COLORS = {
  bgPanel: '#0f1120',
  bgCard: 'rgba(255,255,255,0.04)',
  bgCardHover: 'rgba(99,102,241,0.08)',
  border: 'rgba(255,255,255,0.08)',
  borderAccent: '#6366f1',
  accent: '#6366f1',
  success: '#10b981',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface MultiPageManagerProps {
  pages: Page[];
  activePageId: string | null;
  prompt: string;
  stylePreset: StylePreset;
  projectId?: string;
  onSetUIOutput: (output: UIOutput) => void;
  onSelectPage: (pageId: string) => void;
  onAddPage: (page: Page) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MultiPageManager({
  pages,
  activePageId,
  prompt,
  stylePreset,
  projectId,
  onSetUIOutput,
  onSelectPage,
  onAddPage,
}: MultiPageManagerProps) {
  const [generating, setGenerating] = useState(false);
  const [selectedPages, setSelectedPages] = useState<string[]>(DEFAULT_PAGES.slice(0, 5));
  const [showPagePicker, setShowPagePicker] = useState(false);
  const [customPageName, setCustomPageName] = useState('');

  // ─── Generate full website ─────────────────────────────────────────────────

  async function handleGenerateWebsite() {
    if (!prompt.trim()) { toast.error('Enter a prompt first'); return; }
    setGenerating(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('zivo_supabase_token') : null;
      const res = await fetch('/api/generate-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ prompt, stylePreset, pages: selectedPages, projectId }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error((e as { error?: string }).error ?? 'Website generation failed');
      }
      const data = await res.json() as { data: UIOutput };
      onSetUIOutput(data.data);
      toast.success(`Generated ${data.data.pages.length} pages!`);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to generate website');
    } finally {
      setGenerating(false);
    }
  }

  // ─── Toggle page in selection ──────────────────────────────────────────────

  function togglePageSelection(name: string) {
    setSelectedPages((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  }

  // ─── Add custom page ───────────────────────────────────────────────────────

  function handleAddCustomPage() {
    const name = customPageName.trim();
    if (!name) return;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'page';
    const newPage: Page = {
      id: crypto.randomUUID(),
      name,
      slug,
      sections: [],
      isHome: false,
    };
    onAddPage(newPage);
    onSelectPage(newPage.id);
    setCustomPageName('');
    setShowPagePicker(false);
    toast.success(`Page "${name}" added`);
  }

  return (
    <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: '12px', padding: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Globe size={16} color={COLORS.success} />
          <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: COLORS.textPrimary }}>Multi-Page Manager</span>
        </div>
        <button
          onClick={() => setShowPagePicker(!showPagePicker)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.625rem', background: 'transparent', border: `1px dashed ${COLORS.border}`, borderRadius: '6px', cursor: 'pointer', color: COLORS.textMuted, fontSize: '0.8125rem' }}
        >
          <Plus size={12} /> Add Page
        </button>
      </div>

      {/* Current pages */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '1rem' }}>
        {pages.length === 0 ? (
          <div style={{ fontSize: '0.875rem', color: COLORS.textMuted, textAlign: 'center', padding: '1rem' }}>
            No pages yet — generate a website below
          </div>
        ) : (
          pages.map((page) => {
            const isActive = page.id === activePageId;
            return (
              <button
                key={page.id}
                onClick={() => onSelectPage(page.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  background: isActive ? 'rgba(99,102,241,0.12)' : COLORS.bgCard,
                  border: `1px solid ${isActive ? COLORS.borderAccent : COLORS.border}`,
                  borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: '0.875rem', fontWeight: isActive ? 700 : 500, color: isActive ? COLORS.accent : COLORS.textPrimary }}>
                  {page.isHome ? '🏠 ' : ''}{page.name}
                </span>
                <span style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>
                  {page.sections.length} section{page.sections.length !== 1 ? 's' : ''}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Add page form */}
      <AnimatePresence>
        {showPagePicker && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', marginBottom: '0.875rem' }}
          >
            <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.25rem' }}>
              <input
                type="text"
                value={customPageName}
                onChange={(e) => setCustomPageName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomPage()}
                placeholder="Page name (e.g. Blog)"
                style={{ flex: 1, background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '0.5rem 0.625rem', color: COLORS.textPrimary, fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.borderAccent; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = COLORS.border; }}
              />
              <button
                onClick={handleAddCustomPage}
                disabled={!customPageName.trim()}
                style={{ padding: '0.5rem 0.875rem', background: COLORS.accent, border: 'none', borderRadius: '6px', cursor: customPageName.trim() ? 'pointer' : 'not-allowed', color: '#fff', fontWeight: 700, fontSize: '0.875rem', opacity: customPageName.trim() ? 1 : 0.4 }}
              >
                Add
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Divider */}
      <div style={{ height: '1px', background: COLORS.border, margin: '0.875rem 0' }} />

      {/* Generate website section */}
      <div>
        <div style={{ fontSize: '0.75rem', color: COLORS.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.625rem' }}>
          Generate Full Website
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.75rem' }}>
          {DEFAULT_PAGES.map((name) => {
            const selected = selectedPages.includes(name);
            return (
              <button
                key={name}
                onClick={() => togglePageSelection(name)}
                style={{
                  padding: '0.25rem 0.625rem', fontSize: '0.75rem', fontWeight: 600,
                  background: selected ? 'rgba(99,102,241,0.15)' : COLORS.bgCard,
                  border: `1px solid ${selected ? COLORS.borderAccent : COLORS.border}`,
                  borderRadius: '99px', cursor: 'pointer',
                  color: selected ? COLORS.accent : COLORS.textMuted,
                  transition: 'all 0.12s',
                }}
              >
                {name}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleGenerateWebsite}
          disabled={generating || selectedPages.length === 0}
          style={{
            width: '100%', padding: '0.625rem',
            background: generating ? 'rgba(16,185,129,0.2)' : 'linear-gradient(135deg, #10b981, #059669)',
            border: 'none', borderRadius: '8px',
            cursor: generating || selectedPages.length === 0 ? 'not-allowed' : 'pointer',
            color: '#fff', fontWeight: 700, fontSize: '0.875rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
            opacity: selectedPages.length === 0 ? 0.4 : 1,
          }}
        >
          {generating ? (
            <><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><RefreshCw size={14} /></motion.span> Generating {selectedPages.length} pages…</>
          ) : (
            <><Globe size={14} /> Generate {selectedPages.length} Pages</>
          )}
        </button>
      </div>
    </div>
  );
}
