'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Wand2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { Section, StylePreset } from '@/types/builder';

// ─── Constants ────────────────────────────────────────────────────────────────

const SECTION_TYPES = [
  { value: 'hero',            label: '🦸 Hero',        desc: 'Full-width hero section' },
  { value: 'features',        label: '⚡ Features',     desc: 'Feature grid or list' },
  { value: 'pricing',         label: '💰 Pricing',      desc: 'Pricing table or cards' },
  { value: 'testimonials',    label: '💬 Testimonials', desc: 'Customer reviews' },
  { value: 'faq',             label: '❓ FAQ',           desc: 'Accordion FAQ section' },
  { value: 'contact',         label: '📧 Contact',      desc: 'Contact form' },
  { value: 'dashboard_cards', label: '📊 Dashboard',    desc: 'Stats & metrics' },
  { value: 'login_signup',    label: '🔐 Auth',         desc: 'Login / Sign up form' },
  { value: 'footer',          label: '📄 Footer',       desc: 'Footer with links' },
  { value: 'navigation',      label: '🧭 Nav',          desc: 'Navigation bar' },
  { value: 'custom',          label: '✨ Custom',        desc: 'Custom section' },
] as const;

type SectionTypeValue = (typeof SECTION_TYPES)[number]['value'];

const COLORS = {
  bgPanel: '#0f1120',
  bgCard: 'rgba(255,255,255,0.04)',
  bgCardHover: 'rgba(99,102,241,0.08)',
  border: 'rgba(255,255,255,0.08)',
  borderHover: '#6366f1',
  accent: '#6366f1',
  textPrimary: '#f1f5f9',
  textMuted: '#475569',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface SectionGeneratorProps {
  pageId: string;
  projectId?: string;
  stylePreset?: StylePreset;
  prompt?: string;
  onInsert: (section: Section) => void;
  /** If provided, renders as a trigger button that opens a modal. */
  asModal?: boolean;
}

// ─── Section Type Grid ────────────────────────────────────────────────────────

function SectionTypeGrid({
  generating,
  onSelect,
}: {
  generating: string | null;
  onSelect: (type: SectionTypeValue) => void;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
      {SECTION_TYPES.map(({ value, label, desc }) => (
        <button
          key={value}
          onClick={() => onSelect(value)}
          disabled={generating !== null}
          style={{
            padding: '0.75rem',
            background: generating === value ? 'rgba(99,102,241,0.12)' : COLORS.bgCard,
            border: `1px solid ${generating === value ? COLORS.borderHover : COLORS.border}`,
            borderRadius: '8px',
            cursor: generating !== null ? 'not-allowed' : 'pointer',
            textAlign: 'left',
            opacity: generating !== null && generating !== value ? 0.5 : 1,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            if (generating === null) {
              e.currentTarget.style.borderColor = COLORS.borderHover;
              e.currentTarget.style.background = COLORS.bgCardHover;
            }
          }}
          onMouseLeave={(e) => {
            if (generating !== value) {
              e.currentTarget.style.borderColor = COLORS.border;
              e.currentTarget.style.background = COLORS.bgCard;
            }
          }}
        >
          {generating === value ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                <RefreshCw size={12} color={COLORS.accent} />
              </motion.span>
              <span style={{ fontSize: '0.875rem', color: COLORS.accent }}>Generating…</span>
            </div>
          ) : (
            <>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: COLORS.textPrimary }}>{label}</div>
              <div style={{ fontSize: '0.75rem', color: COLORS.textMuted, marginTop: '0.125rem' }}>{desc}</div>
            </>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SectionGenerator({
  pageId,
  projectId,
  stylePreset = 'premium',
  prompt,
  onInsert,
  asModal = false,
}: SectionGeneratorProps) {
  const [open, setOpen] = useState(!asModal);
  const [generating, setGenerating] = useState<string | null>(null);

  async function handleSelect(sectionType: SectionTypeValue) {
    setGenerating(sectionType);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('zivo_supabase_token') : null;
      const res = await fetch('/api/generate-section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ sectionType, stylePreset, prompt, projectId, pageId }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error((e as { error?: string }).error ?? 'Failed to generate section');
      }
      const data = await res.json() as { section: Section };
      onInsert(data.section);
      toast.success(`${sectionType} section added`);
      if (asModal) setOpen(false);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to generate section');
    } finally {
      setGenerating(null);
    }
  }

  if (asModal) {
    return (
      <>
        {/* Trigger */}
        <button
          onClick={() => setOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', cursor: 'pointer', color: '#a5b4fc', fontWeight: 600, fontSize: '0.875rem' }}
        >
          <Plus size={14} /> Insert Section
        </button>

        {/* Modal */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
              onClick={() => setOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: '12px', width: '500px', maxWidth: '100%', padding: '1.5rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
                  <Wand2 size={18} color={COLORS.accent} />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>Insert Section</h3>
                </div>
                <SectionTypeGrid generating={generating} onSelect={handleSelect} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: '12px', padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
        <Wand2 size={16} color={COLORS.accent} />
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>Insert Section</h3>
      </div>
      <SectionTypeGrid generating={generating} onSelect={handleSelect} />
    </div>
  );
}
