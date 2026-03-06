'use client';

// ─── Imports ─────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Section, Page, UIOutput, StylePreset } from '@/types/builder';
import StylePresetPicker from '@/components/builder/StylePresetPicker';
import PromptTemplateCards from '@/components/builder/PromptTemplateCards';
import SectionList from '@/components/builder/SectionList';
import ExportMenu from '@/components/builder/ExportMenu';
import DeployMenu from '@/components/builder/DeployMenu';
import VersionHistoryPanel from '@/components/builder/VersionHistoryPanel';
import VersionCompare from '@/components/builder/VersionCompare';

/** Cross-browser safe UUID generator with fallback for non-secure contexts. */
function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const COLORS = {
  bg: "#0a0b14",
  bgPanel: "#0f1120",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  accent: "#6366f1",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#475569",
} as const;

// ─── Types ───────────────────────────────────────────────────────────────────

type DeviceFrame = 'desktop' | 'tablet' | 'mobile';
type RightTab = 'sections' | 'versions';

interface BuildState {
  output: UIOutput | null;
  pages: Page[];
  activePage: number;
  sections: Section[];
  projectId: string | null;
  githubRepo?: string;
  vercelUrl?: string;
  deployStatus?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEVICE_WIDTHS: Record<DeviceFrame, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '390px',
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VisualBuilderPage() {
  // ── Build state ──
  const [prompt, setPrompt] = useState('');
  const [stylePreset, setStylePreset] = useState<StylePreset>('premium');
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>();
  const [showTemplates, setShowTemplates] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [continuePrompt, setContinuePrompt] = useState('');
  const [isContinuing, setIsContinuing] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ── UI state ──
  const [device, setDevice] = useState<DeviceFrame>('desktop');
  const [zoom, setZoom] = useState(100);
  const [rightTab, setRightTab] = useState<RightTab>('sections');

  // ── Version compare ──
  const [compareVersions, setCompareVersions] = useState<{ a: string; b: string } | null>(null);

  // ── Build result ──
  const [buildState, setBuildState] = useState<BuildState>({
    output: null,
    pages: [],
    activePage: 0,
    sections: [],
    projectId: null,
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const getAuthToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  // ── Build handler ──────────────────────────────────────────────────────────
  const handleBuild = useCallback(
    async (overridePrompt?: string) => {
      const text = overridePrompt ?? prompt;
      if (!text.trim()) return;
      setIsBuilding(true);
      setBuildError(null);

      try {
        const token = getAuthToken();
        const res = await fetch('/api/generate-ui', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            prompt: text,
            stylePreset,
            projectId: buildState.projectId ?? undefined,
          }),
        });

        if (!res.ok) {
          const err = await res.json() as { error?: string };
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }

        const data = await res.json() as UIOutput & { projectId?: string };
        const pages: Page[] = data.pages ?? [];
        const sections: Section[] = pages[0]?.sections ?? [];

        setBuildState({
          output: data,
          pages,
          activePage: 0,
          sections,
          projectId: data.projectId ?? buildState.projectId,
        });

        // Inject into iframe
        if (data.generatedCode && iframeRef.current) {
          const iframe = iframeRef.current;
          const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
          if (doc) {
            doc.open();
            doc.write(data.generatedCode);
            doc.close();
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Build failed';
        setBuildError(msg);
      } finally {
        setIsBuilding(false);
      }
    },
    [prompt, stylePreset, buildState.projectId]
  );

  const handleContinue = async () => {
    if (!continuePrompt.trim()) return;
    setIsContinuing(true);
    await handleBuild(continuePrompt);
    setContinuePrompt('');
    setIsContinuing(false);
  };

  // ── Save handler ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!buildState.projectId) return;
    setIsSaving(true);
    try {
      const token = getAuthToken();
      await fetch(`/api/projects/${buildState.projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ pages: buildState.pages, sections: buildState.sections }),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('[save]', err);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Section operations ────────────────────────────────────────────────────
  const handleSectionReorder = (reordered: Section[]) => {
    setBuildState((prev) => ({ ...prev, sections: reordered }));
  };

  const handleSectionDelete = (id: string) => {
    setBuildState((prev) => ({ ...prev, sections: prev.sections.filter((s) => s.id !== id) }));
  };

  const handleSectionRegenerate = async (id: string) => {
    const section = buildState.sections.find((s) => s.id === id);
    if (!section) return;
    const token = getAuthToken();
    try {
      const res = await fetch('/api/generate-section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ sectionType: section.type, stylePreset }),
      });
      const data = await res.json() as { section?: Section };
      if (data.section) {
        setBuildState((prev) => ({
          ...prev,
          sections: prev.sections.map((s) =>
            s.id === id ? { ...data.section!, id, order: s.order } : s
          ),
        }));
      }
    } catch (err) {
      console.error('[regenerate-section]', err);
    }
  };

  const handleInsertSection = () => {
    const newSection: Section = {
      id: generateId(),
      type: 'custom',
      title: 'New Section',
      content: '<div style="padding:4rem 2rem;text-align:center;color:#94a3b8;">New section — regenerate to fill with content</div>',
      order: buildState.sections.length,
      bgColor: COLORS.bgCard,
      textColor: COLORS.textPrimary,
      spacing: 'md',
      fontSize: 'md',
      borderRadius: 'md',
    };
    setBuildState((prev) => ({ ...prev, sections: [...prev.sections, newSection] }));
  };

  // ── Restore version ────────────────────────────────────────────────────────
  const handleRestoreVersion = async (versionId: string) => {
    if (!buildState.projectId) return;
    const token = getAuthToken();
    try {
      const res = await fetch(`/api/projects/${buildState.projectId}/versions/${versionId}/restore`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json() as { pages?: Page[] };
      if (data.pages) {
        const sections = data.pages[0]?.sections ?? [];
        setBuildState((prev) => ({ ...prev, pages: data.pages!, sections, activePage: 0 }));
      }
    } catch (err) {
      console.error('[restore-version]', err);
    }
  };

  // ── Active page sections ───────────────────────────────────────────────────
  const activeSections = buildState.sections;
  const hasOutput = buildState.output !== null;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        button { font-family: inherit; }
        input, textarea { font-family: inherit; }
      `}</style>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          background: COLORS.bg,
          color: COLORS.textPrimary,
          fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
          overflow: 'hidden',
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0 1.25rem',
            height: '48px',
            borderBottom: `1px solid ${COLORS.border}`,
            background: COLORS.bgPanel,
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          <a
            href="/ai"
            style={{
              fontSize: '0.8125rem',
              color: COLORS.textMuted,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            ← Back
          </a>
          <div style={{ width: '1px', height: '16px', background: COLORS.border }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.125rem' }}>⚡</span>
            <h1 style={{ fontSize: '0.9375rem', fontWeight: 700, color: COLORS.textPrimary, margin: 0, letterSpacing: '-0.01em' }}>
              ZIVO AI Builder
            </h1>
          </div>
          <div style={{ flex: 1 }} />

          {/* Device switcher */}
          <div
            style={{
              display: 'flex',
              gap: '2px',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '8px',
              padding: '2px',
              border: `1px solid ${COLORS.border}`,
            }}
          >
            {(['desktop', 'tablet', 'mobile'] as DeviceFrame[]).map((d) => (
              <button
                key={d}
                onClick={() => setDevice(d)}
                title={d.charAt(0).toUpperCase() + d.slice(1)}
                style={{
                  padding: '0.25rem 0.625rem',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  background: device === d ? COLORS.accent : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: device === d ? '#fff' : COLORS.textMuted,
                  cursor: 'pointer',
                }}
              >
                {d === 'desktop' ? '🖥' : d === 'tablet' ? '📱' : '📲'}
              </button>
            ))}
          </div>

          {/* Zoom */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              style={{ padding: '0.25rem 0.4rem', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: '5px', color: COLORS.textMuted, cursor: 'pointer', fontSize: '0.75rem' }}
            >
              −
            </button>
            <span style={{ fontSize: '0.6875rem', color: COLORS.textMuted, minWidth: '36px', textAlign: 'center' }}>
              {zoom}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(150, z + 10))}
              style={{ padding: '0.25rem 0.4rem', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: '5px', color: COLORS.textMuted, cursor: 'pointer', fontSize: '0.75rem' }}
            >
              +
            </button>
          </div>
        </header>

        {/* ── Body ───────────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* ── Left panel ─────────────────────────────────────────────────── */}
          <aside
            style={{
              width: '320px',
              flexShrink: 0,
              background: COLORS.bgPanel,
              borderRight: `1px solid ${COLORS.border}`,
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

              {/* Prompt */}
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: COLORS.textMuted, display: 'block', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Describe your UI
                </label>
                <div style={{ position: 'relative' }}>
                  <textarea
                    value={prompt}
                    onChange={(e) => {
                      if (e.target.value.length <= 2000) setPrompt(e.target.value);
                    }}
                    placeholder="Build a modern SaaS landing page with pricing, features, and a hero section..."
                    rows={5}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.75rem',
                      paddingBottom: '1.5rem',
                      background: COLORS.bgCard,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '8px',
                      color: COLORS.textPrimary,
                      fontSize: '0.8125rem',
                      lineHeight: 1.5,
                      resize: 'none',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '0.375rem',
                      right: '0.5rem',
                      fontSize: '0.5625rem',
                      color: prompt.length > 1800 ? '#f59e0b' : COLORS.textMuted,
                    }}
                  >
                    {prompt.length}/2000
                  </span>
                </div>
              </div>

              {/* Style preset */}
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: COLORS.textMuted, display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Style Preset
                </label>
                <StylePresetPicker value={stylePreset} onChange={setStylePreset} />
              </div>

              {/* Template cards (collapsible) */}
              <div>
                <button
                  onClick={() => setShowTemplates((v) => !v)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.5rem 0',
                    background: 'none',
                    border: 'none',
                    color: COLORS.textMuted,
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <span>Templates</span>
                  <span style={{ transform: showTemplates ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                    ▾
                  </span>
                </button>
                <AnimatePresence>
                  {showTemplates && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <PromptTemplateCards
                        onSelect={(p) => {
                          setPrompt(p);
                          setSelectedTemplate(p);
                          setShowTemplates(false);
                        }}
                        selectedTemplate={selectedTemplate}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Build button */}
              <motion.button
                onClick={() => handleBuild()}
                disabled={isBuilding || !prompt.trim()}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  background: isBuilding
                    ? 'rgba(99,102,241,0.4)'
                    : prompt.trim()
                    ? COLORS.accent
                    : 'rgba(99,102,241,0.2)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  cursor: isBuilding || !prompt.trim() ? 'not-allowed' : 'pointer',
                  letterSpacing: '-0.01em',
                }}
              >
                {isBuilding ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      style={{ display: 'inline-block' }}
                    >
                      ⟳
                    </motion.span>
                    Building…
                  </>
                ) : (
                  <>⚡ Build Now</>
                )}
              </motion.button>

              {buildError && (
                <div
                  style={{
                    padding: '0.625rem 0.75rem',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: '8px',
                    color: '#ef4444',
                    fontSize: '0.75rem',
                  }}
                >
                  {buildError}
                </div>
              )}
            </div>
          </aside>

          {/* ── Center panel ───────────────────────────────────────────────── */}
          <main
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              background: COLORS.bg,
            }}
          >
            {/* Page tabs */}
            {buildState.pages.length > 1 && (
              <div
                style={{
                  display: 'flex',
                  gap: '2px',
                  padding: '0.5rem 1rem',
                  borderBottom: `1px solid ${COLORS.border}`,
                  background: COLORS.bgPanel,
                  flexShrink: 0,
                }}
              >
                {buildState.pages.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() =>
                      setBuildState((prev) => ({ ...prev, activePage: i, sections: p.sections }))
                    }
                    style={{
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: buildState.activePage === i ? COLORS.accent : 'transparent',
                      border: `1px solid ${buildState.activePage === i ? COLORS.accent : COLORS.border}`,
                      borderRadius: '6px',
                      color: buildState.activePage === i ? '#fff' : COLORS.textMuted,
                      cursor: 'pointer',
                    }}
                  >
                    {p.name}
                    {p.isHome && <span style={{ marginLeft: '0.25rem', fontSize: '0.5rem' }}>🏠</span>}
                  </button>
                ))}
              </div>
            )}

            {/* Preview area */}
            <div
              style={{
                flex: 1,
                overflow: 'auto',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                padding: '1.5rem',
              }}
            >
              {!hasOutput ? (
                // Empty state
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    gap: '1rem',
                    textAlign: 'center',
                    color: COLORS.textMuted,
                  }}
                >
                  <div
                    style={{
                      width: '72px',
                      height: '72px',
                      background: 'rgba(99,102,241,0.1)',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                    }}
                  >
                    ⚡
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: COLORS.textPrimary, margin: '0 0 0.375rem' }}>
                      No Preview Yet
                    </h2>
                    <p style={{ fontSize: '0.8125rem', margin: 0, color: COLORS.textMuted }}>
                      Describe your UI on the left and click &quot;Build Now&quot;
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {['AI-powered', 'Multi-page', 'Export ready', 'Deploy instantly'].map((f) => (
                      <span
                        key={f}
                        style={{
                          padding: '0.25rem 0.625rem',
                          background: 'rgba(99,102,241,0.08)',
                          border: `1px solid rgba(99,102,241,0.2)`,
                          borderRadius: '100px',
                          fontSize: '0.6875rem',
                          color: COLORS.accent,
                          fontWeight: 600,
                        }}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                // Preview iframe
                <div
                  style={{
                    width: DEVICE_WIDTHS[device],
                    maxWidth: '100%',
                    height: '100%',
                    minHeight: '500px',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '10px',
                    overflow: 'hidden',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'top center',
                    transition: 'width 0.3s ease, transform 0.2s ease',
                  }}
                >
                  <iframe
                    ref={iframeRef}
                    title="Preview"
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      background: '#fff',
                    }}
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              )}
            </div>

            {/* Continue building bar */}
            {hasOutput && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderTop: `1px solid ${COLORS.border}`,
                  background: COLORS.bgPanel,
                  display: 'flex',
                  gap: '0.5rem',
                  flexShrink: 0,
                }}
              >
                <input
                  value={continuePrompt}
                  onChange={(e) => setContinuePrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleContinue();
                    }
                  }}
                  placeholder="Continue building… add a pricing section, change colors, etc."
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.75rem',
                    background: COLORS.bgCard,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    color: COLORS.textPrimary,
                    fontSize: '0.8125rem',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleContinue}
                  disabled={isContinuing || !continuePrompt.trim()}
                  style={{
                    padding: '0.5rem 1rem',
                    background: isContinuing || !continuePrompt.trim() ? 'rgba(99,102,241,0.3)' : COLORS.accent,
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: isContinuing || !continuePrompt.trim() ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isContinuing ? '⟳' : '→ Continue'}
                </button>
              </div>
            )}
          </main>

          {/* ── Right panel ────────────────────────────────────────────────── */}
          <aside
            style={{
              width: '280px',
              flexShrink: 0,
              background: COLORS.bgPanel,
              borderLeft: `1px solid ${COLORS.border}`,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Tabs */}
            <div
              style={{
                display: 'flex',
                borderBottom: `1px solid ${COLORS.border}`,
                padding: '0 0.5rem',
                gap: '4px',
                flexShrink: 0,
              }}
            >
              {(['sections', 'versions'] as RightTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setRightTab(tab)}
                  style={{
                    flex: 1,
                    padding: '0.625rem 0.5rem',
                    background: 'none',
                    border: 'none',
                    borderBottom: `2px solid ${rightTab === tab ? COLORS.accent : 'transparent'}`,
                    color: rightTab === tab ? COLORS.textPrimary : COLORS.textMuted,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {tab === 'sections' ? `Sections (${activeSections.length})` : 'Versions'}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
              {rightTab === 'sections' && (
                <SectionList
                  sections={activeSections}
                  onReorder={handleSectionReorder}
                  onDelete={handleSectionDelete}
                  onRegenerate={handleSectionRegenerate}
                  onInsert={handleInsertSection}
                />
              )}
              {rightTab === 'versions' && buildState.projectId && (
                <VersionHistoryPanel
                  projectId={buildState.projectId}
                  onRestore={handleRestoreVersion}
                  onCompare={(v1, v2) => setCompareVersions({ a: v1, b: v2 })}
                />
              )}
              {rightTab === 'versions' && !buildState.projectId && (
                <div style={{ padding: '1.5rem 0', textAlign: 'center', color: COLORS.textMuted, fontSize: '0.8125rem' }}>
                  Build a project first to see version history.
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* ── Bottom bar ─────────────────────────────────────────────────────── */}
        <footer
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1rem',
            height: '44px',
            borderTop: `1px solid ${COLORS.border}`,
            background: COLORS.bgPanel,
            flexShrink: 0,
          }}
        >
          <ExportMenu
            projectId={buildState.projectId ?? ''}
            sections={activeSections}
            pages={buildState.pages}
          />

          <button
            onClick={handleSave}
            disabled={isSaving || !buildState.projectId}
            style={{
              padding: '0.375rem 0.875rem',
              background: saveSuccess ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${saveSuccess ? 'rgba(16,185,129,0.4)' : COLORS.border}`,
              borderRadius: '7px',
              color: saveSuccess ? '#10b981' : COLORS.textSecondary,
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: isSaving || !buildState.projectId ? 'not-allowed' : 'pointer',
            }}
          >
            {isSaving ? '⟳ Saving…' : saveSuccess ? '✓ Saved' : '💾 Save Project'}
          </button>

          <DeployMenu
            projectId={buildState.projectId ?? ''}
            githubRepo={buildState.githubRepo}
            vercelUrl={buildState.vercelUrl}
            deployStatus={buildState.deployStatus}
          />
        </footer>
      </div>

      {/* Version compare overlay */}
      <AnimatePresence>
        {compareVersions && buildState.projectId && (
          <VersionCompare
            projectId={buildState.projectId}
            versionAId={compareVersions.a}
            versionBId={compareVersions.b}
            onClose={() => setCompareVersions(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
