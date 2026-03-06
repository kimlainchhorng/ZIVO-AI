'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Section } from '@/types/builder';

// ─── Types & Constants ────────────────────────────────────────────────────────

const SPACING_OPTIONS = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const FONT_SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const RADIUS_OPTIONS = ['none', 'sm', 'md', 'lg', 'xl', 'full'] as const;

const COLORS = {
  bgPanel: '#0f1120',
  bgCard: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  accent: '#6366f1',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
};

// ─── Toolbar Props ────────────────────────────────────────────────────────────

interface SectionEditorToolbarProps {
  section: Section;
  onUpdate: (updates: Partial<Section>) => void;
  onRegenerate: () => void;
  onDelete: () => void;
  onClose: () => void;
  isRegenerating?: boolean;
}

// ─── Segmented Control ────────────────────────────────────────────────────────

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: string | undefined;
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ marginBottom: '0.875rem' }}>
      <label style={{ fontSize: '0.6875rem', color: COLORS.textMuted, display: 'block', marginBottom: '0.375rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </label>
      <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '2px' }}>
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{ flex: 1, padding: '0.25rem 0', fontSize: '0.6875rem', fontWeight: 600, background: value === opt ? COLORS.accent : 'transparent', border: 'none', borderRadius: '6px', color: value === opt ? '#fff' : COLORS.textMuted, cursor: 'pointer', transition: 'all 0.12s' }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Color Picker Field ───────────────────────────────────────────────────────

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ marginBottom: '0.875rem' }}>
      <label style={{ fontSize: '0.6875rem', color: COLORS.textMuted, display: 'block', marginBottom: '0.375rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </label>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input
          type="color"
          value={value || '#6366f1'}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: '36px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: 0, background: 'none' }}
        />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#6366f1"
          style={{ flex: 1, background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '0.375rem 0.5rem', color: COLORS.textPrimary, fontSize: '0.8125rem', fontFamily: 'monospace', outline: 'none' }}
        />
      </div>
    </div>
  );
}

// ─── Main Toolbar ─────────────────────────────────────────────────────────────

export default function SectionEditorToolbar({
  section,
  onUpdate,
  onRegenerate,
  onDelete,
  onClose,
  isRegenerating = false,
}: SectionEditorToolbarProps) {
  const [localTitle, setLocalTitle] = useState(section.title);
  const [localContent, setLocalContent] = useState(section.content);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleSaveText() {
    onUpdate({ title: localTitle, content: localContent });
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: '12px', padding: '1.25rem', width: '360px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Edit Section</span>
          <div style={{ fontSize: '0.875rem', color: COLORS.textPrimary, fontWeight: 600, marginTop: '0.125rem', textTransform: 'capitalize' }}>{section.type.replace('_', ' ')}</div>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: '1.125rem', lineHeight: 1 }}>×</button>
      </div>

      {/* Title */}
      <div style={{ marginBottom: '0.875rem' }}>
        <label style={{ fontSize: '0.6875rem', color: COLORS.textMuted, display: 'block', marginBottom: '0.375rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Title</label>
        <input
          type="text"
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          onBlur={handleSaveText}
          style={{ width: '100%', boxSizing: 'border-box', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '0.5rem 0.625rem', color: COLORS.textPrimary, fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none' }}
          onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.accent; }}
        />
      </div>

      {/* Content */}
      <div style={{ marginBottom: '0.875rem' }}>
        <label style={{ fontSize: '0.6875rem', color: COLORS.textMuted, display: 'block', marginBottom: '0.375rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Content</label>
        <textarea
          value={localContent}
          onChange={(e) => setLocalContent(e.target.value)}
          onBlur={handleSaveText}
          rows={3}
          style={{ width: '100%', boxSizing: 'border-box', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '0.5rem 0.625rem', color: COLORS.textPrimary, fontSize: '0.8125rem', fontFamily: 'inherit', outline: 'none', resize: 'vertical' }}
          onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.accent; }}
        />
      </div>

      {/* Colors */}
      <ColorField label="Background Color" value={section.bgColor ?? ''} onChange={(v) => onUpdate({ bgColor: v })} />
      <ColorField label="Text Color" value={section.textColor ?? ''} onChange={(v) => onUpdate({ textColor: v })} />

      {/* Spacing */}
      <Segmented label="Spacing" options={SPACING_OPTIONS} value={section.spacing} onChange={(v) => onUpdate({ spacing: v })} />

      {/* Font size */}
      <Segmented label="Font Size" options={FONT_SIZES} value={section.fontSize} onChange={(v) => onUpdate({ fontSize: v })} />

      {/* Border radius */}
      <Segmented label="Border Radius" options={RADIUS_OPTIONS} value={section.borderRadius} onChange={(v) => onUpdate({ borderRadius: v })} />

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', paddingTop: '0.875rem', borderTop: `1px solid ${COLORS.border}` }}>
        <button
          onClick={onRegenerate}
          disabled={isRegenerating}
          style={{ flex: 1, padding: '0.5rem', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '6px', cursor: isRegenerating ? 'not-allowed' : 'pointer', color: '#a5b4fc', fontWeight: 600, fontSize: '0.8125rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
        >
          {isRegenerating ? '↻ Generating…' : '↻ Regenerate'}
        </button>

        {confirmDelete ? (
          <button onClick={onDelete} style={{ flex: 1, padding: '0.5rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '6px', cursor: 'pointer', color: '#f87171', fontWeight: 700, fontSize: '0.8125rem' }}>
            Confirm Delete
          </button>
        ) : (
          <button onClick={() => setConfirmDelete(true)} style={{ padding: '0.5rem 0.75rem', background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: '6px', cursor: 'pointer', color: COLORS.textMuted, fontWeight: 600, fontSize: '0.8125rem' }}>
            🗑 Delete
          </button>
        )}
      </div>
    </motion.div>
  );
}
