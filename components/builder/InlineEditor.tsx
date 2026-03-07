'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Section } from '@/types/builder';

interface InlineEditorProps {
  section: Section;
  onUpdate: (updates: Partial<Section>) => void;
  onClose: () => void;
}

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

function SegmentedGroup<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly T[];
  value: string | undefined;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div>
      <label style={{ fontSize: '0.6875rem', color: COLORS.textMuted, display: 'block', marginBottom: '0.375rem', fontWeight: 500 }}>
        {label}
      </label>
      <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '2px' }}>
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              flex: 1,
              padding: '0.25rem 0',
              fontSize: '0.6875rem',
              fontWeight: 600,
              background: value === opt ? COLORS.accent : 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: value === opt ? '#fff' : COLORS.textMuted,
              cursor: 'pointer',
              transition: 'all 0.12s',
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label style={{ fontSize: '0.6875rem', color: COLORS.textMuted, display: 'block', marginBottom: '0.375rem', fontWeight: 500 }}>
        {label}
      </label>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input
          type="color"
          value={value ?? '#000000'}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: '32px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'none', padding: 0 }}
        />
        <input
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          style={{
            flex: 1,
            padding: '0.3125rem 0.5rem',
            background: COLORS.bgCard,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '6px',
            color: COLORS.textPrimary,
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            outline: 'none',
          }}
        />
      </div>
    </div>
  );
}

export default function InlineEditor({ section, onUpdate, onClose }: InlineEditorProps) {
  const [local, setLocal] = useState<Partial<Section>>({
    bgColor: section.bgColor,
    textColor: section.textColor,
    spacing: section.spacing,
    fontSize: section.fontSize,
    borderRadius: section.borderRadius,
  });

  const update = <K extends keyof Section>(key: K, val: Section[K]) => {
    setLocal((prev) => ({ ...prev, [key]: val }));
  };

  const handleApply = () => {
    onUpdate(local);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      style={{
        position: 'fixed',
        right: '296px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '260px',
        background: COLORS.bgPanel,
        border: `1px solid ${COLORS.border}`,
        borderRadius: '12px',
        padding: '1rem',
        zIndex: 50,
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 700, color: COLORS.textPrimary }}>
          Edit Section
        </h3>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}
        >
          ✕
        </button>
      </div>

      <div style={{ fontSize: '0.6875rem', color: COLORS.textMuted, fontStyle: 'italic' }}>
        {section.title}
      </div>

      {/* Controls */}
      <ColorInput
        label="Background Color"
        value={local.bgColor}
        onChange={(v) => update('bgColor', v)}
      />

      <ColorInput
        label="Text Color"
        value={local.textColor}
        onChange={(v) => update('textColor', v)}
      />

      <SegmentedGroup
        label="Spacing"
        options={SPACING_OPTIONS}
        value={local.spacing}
        onChange={(v) => update('spacing', v)}
      />

      <SegmentedGroup
        label="Font Size"
        options={FONT_SIZES}
        value={local.fontSize}
        onChange={(v) => update('fontSize', v)}
      />

      <SegmentedGroup
        label="Border Radius"
        options={RADIUS_OPTIONS}
        value={local.borderRadius}
        onChange={(v) => update('borderRadius', v)}
      />

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.375rem' }}>
        <button
          onClick={onClose}
          style={{
            flex: 1,
            padding: '0.5rem',
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${COLORS.border}`,
            borderRadius: '8px',
            color: COLORS.textSecondary,
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleApply}
          style={{
            flex: 1,
            padding: '0.5rem',
            background: COLORS.accent,
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Apply
        </button>
      </div>
    </motion.div>
  );
}
