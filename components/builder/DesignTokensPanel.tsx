'use client';

// components/builder/DesignTokensPanel.tsx
// UI editor for per-project design tokens.
// Shows color, typography, spacing, radius, and shadow token editors
// with a live preview card and preset picker.

import { useState, useCallback } from 'react';
import { Palette, Type, Maximize2, Circle, Layers, RotateCcw, Check, ChevronDown } from 'lucide-react';
import {
  SAAS_DEFAULT_TOKENS,
  PRESET_TOKEN_MAP,
  tokensFromPreset,
} from '@/lib/design-tokens-schema';
import type { ProjectDesignTokens, ProjectColorTokens } from '@/lib/design-tokens-schema';

// ─── Styles (inline to match project page conventions) ────────────────────────

const S = {
  root: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.25rem',
  },
  section: {
    background: 'rgba(15,23,42,0.6)',
    border: '1px solid rgba(51,65,85,0.4)',
    borderRadius: '12px',
    padding: '1rem 1.25rem',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.875rem',
    cursor: 'pointer',
  },
  sectionTitle: {
    fontSize: '0.78rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    color: '#818cf8',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.625rem',
  },
  label: {
    fontSize: '0.78rem',
    color: '#94a3b8',
    width: '9rem',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    background: '#0f172a',
    border: '1px solid rgba(51,65,85,0.5)',
    borderRadius: '6px',
    color: '#f1f5f9',
    fontSize: '0.8rem',
    padding: '0.375rem 0.625rem',
    outline: 'none',
    fontFamily: 'monospace',
  } as React.CSSProperties,
  colorSwatch: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.15)',
    flexShrink: 0,
    cursor: 'pointer',
  },
  colorInput: {
    width: 0,
    height: 0,
    opacity: 0,
    position: 'absolute' as const,
    pointerEvents: 'none' as const,
  },
  previewCard: {
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.25rem 0.625rem',
    borderRadius: '9999px',
    fontSize: '0.7rem',
    fontWeight: 600,
    background: 'rgba(99,102,241,0.15)',
    color: '#818cf8',
    marginLeft: 'auto',
  },
  saveBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1.25rem',
    background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,
  resetBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    background: 'transparent',
    color: '#64748b',
    border: '1px solid rgba(51,65,85,0.5)',
    borderRadius: '8px',
    fontSize: '0.82rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  select: {
    flex: 1,
    background: '#0f172a',
    border: '1px solid rgba(51,65,85,0.5)',
    borderRadius: '6px',
    color: '#f1f5f9',
    fontSize: '0.8rem',
    padding: '0.375rem 0.625rem',
    outline: 'none',
  } as React.CSSProperties,
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface DesignTokensPanelProps {
  projectId: string;
  authToken: string;
  initialTokens?: ProjectDesignTokens;
  onSaved?: (tokens: ProjectDesignTokens) => void;
}

// ─── Collapsible section ──────────────────────────────────────────────────────

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div style={S.section}>
      <div style={S.sectionHeader} onClick={() => setOpen((o) => !o)}>
        {icon}
        <span style={S.sectionTitle}>{title}</span>
        <ChevronDown
          size={14}
          style={{
            marginLeft: 'auto',
            color: '#475569',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        />
      </div>
      {open && children}
    </div>
  );
}

// ─── Color row ───────────────────────────────────────────────────────────────

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const isHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value);

  return (
    <div style={S.row}>
      <span style={S.label}>{label}</span>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {isHex && (
          <input
            type="color"
            value={value.slice(0, 7)}
            onChange={(e) => onChange(e.target.value)}
            style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', padding: 0 }}
          />
        )}
        {!isHex && (
          <div
            style={{ ...S.colorSwatch, background: value }}
            title={value}
          />
        )}
      </div>
      <input
        style={S.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
      />
    </div>
  );
}

// ─── Live preview ─────────────────────────────────────────────────────────────

function LivePreview({ tokens }: { tokens: ProjectDesignTokens }) {
  const { colors, typography, radius, shadows } = tokens;
  return (
    <div
      style={{
        ...S.previewCard,
        background: colors.surface,
        borderColor: colors.border,
        fontFamily: typography.fontSans,
        boxShadow: shadows.md,
      }}
    >
      {/* Navbar */}
      <div
        style={{
          padding: '0 1.25rem',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          borderBottom: `1px solid ${colors.border}`,
          background: colors.background,
          gap: '0.75rem',
        }}
      >
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: radius.md,
            background: colors.primary,
          }}
        />
        <span style={{ color: colors.foreground, fontSize: '0.8rem', fontWeight: 700 }}>
          Your Brand
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          {['Features', 'Pricing'].map((t) => (
            <span key={t} style={{ color: colors.mutedForeground, fontSize: '0.72rem' }}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Hero snippet */}
      <div
        style={{
          padding: '1.25rem',
          background: colors.background,
        }}
      >
        <div
          style={{
            display: 'inline-block',
            padding: '0.2rem 0.65rem',
            borderRadius: radius.full,
            background: `${colors.primary}22`,
            color: colors.primary,
            fontSize: '0.68rem',
            fontWeight: 600,
            marginBottom: '0.5rem',
          }}
        >
          New  🎉
        </div>
        <h3
          style={{
            color: colors.foreground,
            fontSize: '1.1rem',
            fontWeight: 700,
            margin: '0 0 0.4rem',
          }}
        >
          Ship faster with AI
        </h3>
        <p style={{ color: colors.mutedForeground, fontSize: '0.75rem', margin: '0 0 0.875rem' }}>
          Generate beautiful SaaS pages in seconds.
        </p>
        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            style={{
              padding: '0.375rem 0.875rem',
              background: colors.primary,
              color: '#fff',
              border: 'none',
              borderRadius: radius.md,
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'default',
              boxShadow: shadows.sm,
            }}
          >
            Get started
          </button>
          <button
            style={{
              padding: '0.375rem 0.875rem',
              background: 'transparent',
              color: colors.foreground,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.md,
              fontSize: '0.75rem',
              cursor: 'default',
            }}
          >
            Learn more
          </button>
        </div>
      </div>

      {/* Feature cards row */}
      <div
        style={{
          padding: '0.875rem 1.25rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.5rem',
          background: colors.muted,
        }}
      >
        {['🚀 Fast', '🎨 Beautiful', '🔒 Secure'].map((feat) => (
          <div
            key={feat}
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.lg,
              padding: '0.5rem 0.625rem',
              fontSize: '0.68rem',
              color: colors.foreground,
              boxShadow: shadows.sm,
            }}
          >
            {feat}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DesignTokensPanel({
  projectId,
  authToken,
  initialTokens,
  onSaved,
}: DesignTokensPanelProps) {
  const [tokens, setTokens] = useState<ProjectDesignTokens>(
    initialTokens ?? { ...SAAS_DEFAULT_TOKENS }
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Helpers
  const patchColors = useCallback(
    (key: keyof ProjectColorTokens, value: string) =>
      setTokens((t) => ({ ...t, colors: { ...t.colors, [key]: value } })),
    []
  );

  const applyPreset = (presetKey: string) => {
    setTokens(tokensFromPreset(presetKey));
  };

  const resetToDefaults = () => {
    setTokens({ ...SAAS_DEFAULT_TOKENS });
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/design-tokens`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ tokens }),
      });
      if (!res.ok) {
        let errMsg = `Save failed (${res.status})`;
        try {
          const d = await res.json() as { error?: string };
          if (d.error) errMsg = d.error;
        } catch {
          // response body is not JSON; use the default message
        }
        throw new Error(errMsg);
      }
      let data: { tokens: ProjectDesignTokens };
      try {
        data = await res.json() as { tokens: ProjectDesignTokens };
      } catch {
        throw new Error('Failed to parse save response');
      }
      setTokens(data.tokens);
      setSaved(true);
      onSaved?.(data.tokens);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const presetKeys = Object.keys(PRESET_TOKEN_MAP);

  return (
    <div style={S.root}>

      {/* ── Preset picker ── */}
      <Section icon={<Palette size={14} style={{ color: '#818cf8' }} />} title="Style Preset">
        <div style={S.row}>
          <span style={S.label}>Apply preset</span>
          <select
            style={S.select}
            defaultValue=""
            onChange={(e) => { if (e.target.value) applyPreset(e.target.value); }}
          >
            <option value="" disabled>Pick a preset…</option>
            {presetKeys.map((k) => (
              <option key={k} value={k}>
                {PRESET_TOKEN_MAP[k]?.preset ?? k}
              </option>
            ))}
          </select>
        </div>
        <p style={{ fontSize: '0.73rem', color: '#475569', margin: 0 }}>
          Selecting a preset overwrites all tokens. You can still customize individual values below.
        </p>
      </Section>

      {/* ── Colors ── */}
      <Section icon={<Palette size={14} style={{ color: '#818cf8' }} />} title="Colors">
        {(Object.keys(tokens.colors) as (keyof ProjectColorTokens)[]).map((key) => (
          <ColorRow
            key={key}
            label={key}
            value={tokens.colors[key]}
            onChange={(v) => patchColors(key, v)}
          />
        ))}
      </Section>

      {/* ── Typography ── */}
      <Section icon={<Type size={14} style={{ color: '#818cf8' }} />} title="Typography">
        <div style={S.row}>
          <span style={S.label}>Sans font</span>
          <input
            style={S.input}
            value={tokens.typography.fontSans}
            onChange={(e) =>
              setTokens((t) => ({ ...t, typography: { ...t.typography, fontSans: e.target.value } }))
            }
          />
        </div>
        <div style={S.row}>
          <span style={S.label}>Mono font</span>
          <input
            style={S.input}
            value={tokens.typography.fontMono}
            onChange={(e) =>
              setTokens((t) => ({ ...t, typography: { ...t.typography, fontMono: e.target.value } }))
            }
          />
        </div>
        <div style={S.row}>
          <span style={S.label}>Base size (px)</span>
          <input
            style={S.input}
            type="number"
            min={10}
            max={24}
            value={tokens.typography.baseSizePx}
            onChange={(e) =>
              setTokens((t) => ({
                ...t,
                typography: { ...t.typography, baseSizePx: Number(e.target.value) },
              }))
            }
          />
        </div>
        <div style={S.row}>
          <span style={S.label}>Scale ratio</span>
          <input
            style={S.input}
            type="number"
            min={1.1}
            max={1.5}
            step={0.05}
            value={tokens.typography.scaleRatio}
            onChange={(e) =>
              setTokens((t) => ({
                ...t,
                typography: { ...t.typography, scaleRatio: Number(e.target.value) },
              }))
            }
          />
        </div>
      </Section>

      {/* ── Spacing ── */}
      <Section icon={<Maximize2 size={14} style={{ color: '#818cf8' }} />} title="Spacing">
        {(Object.keys(tokens.spacing) as (keyof typeof tokens.spacing)[]).map((key) => (
          <div key={key} style={S.row}>
            <span style={S.label}>{key}</span>
            <input
              style={S.input}
              value={tokens.spacing[key]}
              onChange={(e) =>
                setTokens((t) => ({ ...t, spacing: { ...t.spacing, [key]: e.target.value } }))
              }
            />
            <div
              style={{
                height: '14px',
                background: tokens.colors.primary,
                opacity: 0.5,
                borderRadius: '2px',
                width: tokens.spacing[key],
                minWidth: '4px',
                maxWidth: '80px',
                flexShrink: 0,
              }}
            />
          </div>
        ))}
      </Section>

      {/* ── Radius ── */}
      <Section icon={<Circle size={14} style={{ color: '#818cf8' }} />} title="Border Radius">
        {(Object.keys(tokens.radius) as (keyof typeof tokens.radius)[]).map((key) => (
          <div key={key} style={S.row}>
            <span style={S.label}>{key}</span>
            <input
              style={S.input}
              value={tokens.radius[key]}
              onChange={(e) =>
                setTokens((t) => ({ ...t, radius: { ...t.radius, [key]: e.target.value } }))
              }
            />
            <div
              style={{
                width: '28px',
                height: '28px',
                background: tokens.colors.primary,
                opacity: 0.4,
                borderRadius: tokens.radius[key],
                flexShrink: 0,
              }}
            />
          </div>
        ))}
      </Section>

      {/* ── Shadows ── */}
      <Section icon={<Layers size={14} style={{ color: '#818cf8' }} />} title="Shadows">
        {(Object.keys(tokens.shadows) as (keyof typeof tokens.shadows)[]).map((key) => (
          <div key={key} style={{ marginBottom: '0.75rem' }}>
            <div style={{ ...S.row, marginBottom: '0.25rem' }}>
              <span style={S.label}>{key}</span>
            </div>
            <input
              style={{ ...S.input, width: '100%', boxSizing: 'border-box' as const }}
              value={tokens.shadows[key]}
              onChange={(e) =>
                setTokens((t) => ({ ...t, shadows: { ...t.shadows, [key]: e.target.value } }))
              }
            />
            <div
              style={{
                marginTop: '0.375rem',
                height: '24px',
                background: tokens.colors.surface,
                borderRadius: tokens.radius.md,
                boxShadow: tokens.shadows[key],
              }}
            />
          </div>
        ))}
      </Section>

      {/* ── Live preview ── */}
      <Section icon={<Palette size={14} style={{ color: '#818cf8' }} />} title="Live Preview">
        <LivePreview tokens={tokens} />
      </Section>

      {/* ── Actions ── */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <button style={S.saveBtn} onClick={handleSave} disabled={saving}>
          {saved ? (
            <><Check size={14} /> Saved</>
          ) : saving ? (
            'Saving…'
          ) : (
            'Save tokens'
          )}
        </button>
        <button style={S.resetBtn} onClick={resetToDefaults}>
          <RotateCcw size={13} /> Reset to defaults
        </button>
        {saveError && (
          <span style={{ fontSize: '0.78rem', color: '#ef4444' }}>{saveError}</span>
        )}
      </div>

    </div>
  );
}
