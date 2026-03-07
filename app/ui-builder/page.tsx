'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, Plus, RefreshCw, Globe, History, Monitor, Tablet, Smartphone, Rocket } from 'lucide-react';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { useBuilderStore } from '@/lib/builder-store';
import PromptTemplateCards from '@/components/builder/PromptTemplateCards';
import StylePresetPicker from '@/components/builder/StylePresetPicker';
import SectionList from '@/components/builder/SectionList';
import InlineEditorPanel from '@/components/builder/InlineEditor';
import ExportMenu from '@/components/builder/ExportMenu';
import DeployMenu from '@/components/builder/DeployMenu';
import VersionHistoryPanel from '@/components/builder/VersionHistoryPanel';
import VersionCompare from '@/components/builder/VersionCompare';
import { toast } from 'sonner';
import type { Section, StylePreset, Page, UIOutput } from '@/types/builder';

// ─── Constants ───────────────────────────────────────────────────────────────

const COLORS = {
  bg: '#0a0b14',
  bgPanel: '#0f1120',
  bgCard: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  accent: '#6366f1',
  accentGradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  success: '#10b981',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
};

const SECTION_TYPES = [
  { value: 'hero',           label: '🦸 Hero',       desc: 'Full-width hero section' },
  { value: 'features',       label: '⚡ Features',    desc: 'Feature grid or list' },
  { value: 'pricing',        label: '💰 Pricing',     desc: 'Pricing table or cards' },
  { value: 'testimonials',   label: '💬 Testimonials',desc: 'Customer reviews' },
  { value: 'faq',            label: '❓ FAQ',          desc: 'Accordion FAQ section' },
  { value: 'contact',        label: '📧 Contact',     desc: 'Contact form' },
  { value: 'dashboard_cards',label: '📊 Dashboard',   desc: 'Stats & metrics' },
  { value: 'login_signup',   label: '🔐 Auth',        desc: 'Login / Sign up form' },
  { value: 'footer',         label: '📄 Footer',      desc: 'Footer with links' },
  { value: 'navigation',     label: '🧭 Nav',         desc: 'Navigation bar' },
  { value: 'custom',         label: '✨ Custom',       desc: 'Custom section' },
] as const;

type DevicePreview = 'desktop' | 'tablet' | 'mobile';
type SidePanel = 'history' | 'compare' | null;

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('zivo_supabase_token');
}

function toolbarBtnStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: '0.3rem',
    padding: '0.375rem 0.75rem', fontSize: '0.8125rem', fontWeight: 600,
    background: active ? 'rgba(99,102,241,0.2)' : COLORS.bgCard,
    border: `1px solid ${active ? COLORS.accent : COLORS.border}`,
    borderRadius: '6px', cursor: 'pointer',
    color: active ? COLORS.accent : COLORS.textSecondary,
    transition: 'all 0.15s',
  };
}

function EmptyState({ isGenerating, onGenerate }: { isGenerating: boolean; onGenerate: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '1rem', textAlign: 'center' }}>
      <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }} style={{ fontSize: '3rem' }}>
        🎨
      </motion.div>
      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '0.5rem' }}>Start building your UI</h3>
        <p style={{ fontSize: '0.875rem', color: COLORS.textSecondary, maxWidth: '360px' }}>Enter a prompt on the left and click Generate UI, or pick a template to get started instantly.</p>
      </div>
      {isGenerating ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: COLORS.accent, fontSize: '0.875rem' }}>
          <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><RefreshCw size={16} /></motion.span>
          Generating your UI…
        </div>
      ) : (
        <button onClick={onGenerate} style={{ padding: '0.625rem 1.5rem', background: COLORS.accentGradient, border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#fff', fontWeight: 700, fontSize: '0.9375rem' }}>
          Generate UI
        </button>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UIBuilderPage() {
  const {
    projectId, prompt, stylePreset, pages, activePageId, isGenerating,
    selectedVersionIds,
    setPrompt, setStylePreset, setUIOutput, setActivePage,
    updateSection, deleteSection, addSection, reorderSections, addPage,
    setIsGenerating, setProjectId, selectVersionForCompare,
  } = useBuilderStore();

  const [sidePanel, setSidePanel]           = useState<SidePanel>(null);
  const [devicePreview, setDevicePreview]   = useState<DevicePreview>('desktop');
  const [showAddSection, setShowAddSection] = useState(false);
  const [addToPageId, setAddToPageId]       = useState<string | null>(null);
  const [generatingId, setGeneratingId]     = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<{ pageId: string; sectionId: string } | null>(null);
  const [showWebsiteGen, setShowWebsiteGen] = useState(false);

  const activePage = pages.find((p) => p.id === activePageId) ?? pages[0] ?? null;

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) { toast.error('Enter a prompt first'); return; }
    setIsGenerating(true);
    try {
      const token = getStoredToken();
      const res = await fetch('/api/generate-ui', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ prompt, stylePreset, projectId }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as { error?: string }).error ?? 'Generation failed'); }
      const data = await res.json() as { data: UIOutput; projectId?: string };
      setUIOutput(data.data);
      if (data.projectId) setProjectId(data.projectId);
      toast.success('UI generated!');
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to generate');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, stylePreset, projectId, setIsGenerating, setUIOutput, setProjectId]);

  const handleGenerateWebsite = useCallback(async () => {
    if (!prompt.trim()) { toast.error('Enter a prompt first'); return; }
    setIsGenerating(true);
    setShowWebsiteGen(false);
    try {
      const token = getStoredToken();
      const res = await fetch('/api/generate-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ prompt, stylePreset, pages: ['Home', 'About', 'Pricing', 'Contact', 'Dashboard'], projectId }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as { error?: string }).error ?? 'Website generation failed'); }
      const data = await res.json() as { data: UIOutput; projectId?: string };
      setUIOutput(data.data);
      if (data.projectId) setProjectId(data.projectId);
      toast.success('Full website generated!');
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to generate website');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, stylePreset, projectId, setIsGenerating, setUIOutput, setProjectId]);

  const handleRegenerateSection = useCallback(async (pageId: string, sectionId: string) => {
    if (!activePage) return;
    const section = activePage.sections.find((s) => s.id === sectionId);
    if (!section) return;
    setGeneratingId(sectionId);
    try {
      const token = getStoredToken();
      const res = await fetch('/api/generate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ sectionType: section.type, stylePreset, prompt, projectId, pageId }),
      });
      if (!res.ok) throw new Error('Section regeneration failed');
      const data = await res.json() as { section: Section };
      updateSection(pageId, sectionId, data.section);
      toast.success(`${section.type} section regenerated`);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to regenerate section');
    } finally {
      setGeneratingId(null);
    }
  }, [activePage, stylePreset, prompt, projectId, updateSection]);

  const handleAddSectionType = useCallback(async (pageId: string, sectionType: string) => {
    setShowAddSection(false);
    setGeneratingId(`new-${sectionType}`);
    try {
      const token = getStoredToken();
      const res = await fetch('/api/generate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ sectionType, stylePreset, prompt, projectId, pageId }),
      });
      if (!res.ok) throw new Error('Failed to generate section');
      const data = await res.json() as { section: Section };
      addSection(pageId, data.section);
      toast.success(`${sectionType} section added`);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to add section');
    } finally {
      setGeneratingId(null);
      setAddToPageId(null);
    }
  }, [stylePreset, prompt, projectId, addSection]);

  function handleReorder(pageId: string, newSections: Section[]) {
    // Compute old/new index pair and call reorderSections
    if (!activePage) return;
    const old = activePage.sections;
    const movedId = newSections.find((s, i) => old[i]?.id !== s.id)?.id;
    if (!movedId) return;
    const oldIdx = old.findIndex((s) => s.id === movedId);
    const newIdx = newSections.findIndex((s) => s.id === movedId);
    if (oldIdx !== -1 && newIdx !== -1) reorderSections(pageId, oldIdx, newIdx);
  }

  function handleAddPage() {
    const name = `Page ${pages.length + 1}`;
    const slug = `page-${pages.length + 1}`;
    const newPage: Page = { id: crypto.randomUUID(), name, slug, sections: [], isHome: false, order: 0, requiresAuth: false };
    addPage(newPage);
    setActivePage(newPage.id);
    toast.success('New page added');
  }

  const handleRestoreVersion = useCallback(async (versionId: string) => {
    if (!projectId) return;
    try {
      const token = getStoredToken();
      const res = await fetch(`/api/projects/${projectId}/versions/${versionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ action: 'restore' }),
      });
      if (!res.ok) throw new Error('Restore failed');
      const refreshRes = await fetch(`/api/projects/${projectId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (refreshRes.ok) {
        const d = await refreshRes.json() as { project?: { pages?: Page[] } };
        if (d.project?.pages) setUIOutput({ pages: d.project.pages } as UIOutput);
      }
      toast.success('Version restored!');
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Restore failed');
    }
  }, [projectId, setUIOutput]);

  // ─── Render ────────────────────────────────────────────────────────────────

  const previewWidth = devicePreview === 'desktop' ? '100%' : devicePreview === 'tablet' ? '768px' : '375px';

  return (
    <SidebarLayout>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: COLORS.bg, color: COLORS.textPrimary, fontFamily: 'Inter, sans-serif' }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.5rem', background: COLORS.bgPanel, borderBottom: `1px solid ${COLORS.border}`, position: 'sticky', top: 0, zIndex: 40, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.5rem' }}>
            <Wand2 size={18} color={COLORS.accent} />
            <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>UI Builder</span>
          </div>

          {/* Device preview */}
          <div style={{ display: 'flex', gap: '2px', background: COLORS.bgCard, borderRadius: '8px', padding: '2px', border: `1px solid ${COLORS.border}` }}>
            {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as [DevicePreview, React.FC<{size:number}>][]).map(([id, Icon]) => (
              <button key={id} onClick={() => setDevicePreview(id)} title={id}
                style={{ padding: '0.3rem 0.5rem', background: devicePreview === id ? COLORS.accent : 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', color: devicePreview === id ? '#fff' : COLORS.textMuted, transition: 'all 0.15s' }}>
                <Icon size={14} />
              </button>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          <button onClick={() => setSidePanel(sidePanel === 'history' ? null : 'history')} disabled={!projectId} style={toolbarBtnStyle(sidePanel === 'history')}>
            <History size={14} /> History
          </button>
          {activePage && <ExportMenu projectId={projectId ?? ''} sections={activePage.sections} pages={pages} />}
          <DeployMenu projectId={projectId ?? ''} />
          <button onClick={() => setShowWebsiteGen(true)} style={{ ...toolbarBtnStyle(false), background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
            <Globe size={14} /> Website
          </button>
        </div>

        {/* Main layout */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Left panel */}
          <div style={{ width: '320px', flexShrink: 0, borderRight: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: COLORS.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>Prompt</label>
              <textarea
                value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe your UI…" rows={5}
                style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', minHeight: '100px', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: '8px', color: COLORS.textPrimary, fontSize: '0.875rem', padding: '0.625rem 0.75rem', fontFamily: 'inherit', outline: 'none', lineHeight: 1.5 }}
                onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.accent; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = COLORS.border; }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: COLORS.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>Templates</label>
              <PromptTemplateCards onSelect={(p) => setPrompt(p)} />
            </div>

            <button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()}
              style={{ width: '100%', padding: '0.75rem', background: isGenerating ? 'rgba(99,102,241,0.3)' : COLORS.accentGradient, border: 'none', borderRadius: '8px', cursor: isGenerating ? 'not-allowed' : 'pointer', color: '#fff', fontWeight: 700, fontSize: '0.9375rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {isGenerating ? (<><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><RefreshCw size={16} /></motion.span> Generating…</>) : (<><Wand2 size={16} /> Generate UI</>)}
            </button>

            <div>
              <label style={{ fontSize: '0.75rem', color: COLORS.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>Style Preset</label>
              <StylePresetPicker value={stylePreset} onChange={(p) => setStylePreset(p as StylePreset)} />
            </div>
          </div>

          {/* Canvas */}
          <div style={{ flex: 1, overflowY: 'auto', background: COLORS.bg, display: 'flex', flexDirection: 'column' }}>
            {/* Page tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, overflowX: 'auto' }}>
              {pages.map((page) => (
                <button key={page.id} onClick={() => setActivePage(page.id)}
                  style={{ padding: '0.3rem 0.75rem', fontSize: '0.8125rem', fontWeight: 600, background: activePage?.id === page.id ? COLORS.accent : 'transparent', color: activePage?.id === page.id ? '#fff' : COLORS.textSecondary, border: `1px solid ${activePage?.id === page.id ? COLORS.accent : COLORS.border}`, borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                  {page.name}
                </button>
              ))}
              <button onClick={handleAddPage} style={{ padding: '0.3rem 0.5rem', background: 'transparent', border: `1px dashed ${COLORS.border}`, borderRadius: '6px', cursor: 'pointer', color: COLORS.textMuted, display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem' }}>
                <Plus size={12} /> Page
              </button>
            </div>

            {/* Section canvas */}
            <div style={{ flex: 1, padding: '1.25rem', maxWidth: previewWidth, margin: '0 auto', width: '100%', boxSizing: 'border-box', transition: 'max-width 0.3s ease' }}>
              {!activePage || activePage.sections.length === 0 ? (
                <EmptyState isGenerating={isGenerating} onGenerate={handleGenerate} />
              ) : (
                <SectionList
                  sections={activePage.sections}
                  onReorder={(newSections) => handleReorder(activePage.id, newSections)}
                  onRegenerate={(id) => handleRegenerateSection(activePage.id, id)}
                  onDelete={(id) => deleteSection(activePage.id, id)}
                  onInsert={() => { setAddToPageId(activePage.id); setShowAddSection(true); }}
                />
              )}

              {activePage && (
                <button onClick={() => { setAddToPageId(activePage.id); setShowAddSection(true); }}
                  style={{ width: '100%', marginTop: '1rem', padding: '0.625rem', background: 'transparent', border: `1px dashed ${COLORS.border}`, borderRadius: '8px', cursor: 'pointer', color: COLORS.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', fontSize: '0.875rem' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLORS.accent; e.currentTarget.style.color = COLORS.accent; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.color = COLORS.textMuted; }}>
                  <Plus size={14} /> Add Section
                </button>
              )}
            </div>
          </div>

          {/* Right side panel */}
          <AnimatePresence>
            {sidePanel && (
              <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 300, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                style={{ flexShrink: 0, borderLeft: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                  {sidePanel === 'history' && projectId && (
                    <VersionHistoryPanel projectId={projectId} onRestore={handleRestoreVersion}
                      onCompare={(v1, v2) => { selectVersionForCompare(v1, 0); selectVersionForCompare(v2, 1); setSidePanel('compare'); }}
                    />
                  )}
                  {sidePanel === 'compare' && projectId && selectedVersionIds[0] && selectedVersionIds[1] && (
                    <VersionCompare
                      projectId={projectId}
                      versionAId={selectedVersionIds[0]}
                      versionBId={selectedVersionIds[1]}
                      onClose={() => setSidePanel('history')}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Add Section Modal */}
        <AnimatePresence>
          {showAddSection && addToPageId && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
              onClick={() => setShowAddSection(false)}>
              <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()}
                style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: '12px', width: '500px', maxWidth: '100%', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>Insert Section</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {SECTION_TYPES.map(({ value, label, desc }) => (
                    <button key={value} onClick={() => handleAddSectionType(addToPageId, value)} disabled={generatingId === `new-${value}`}
                      style={{ padding: '0.75rem', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLORS.accent; e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.background = COLORS.bgCard; }}>
                      <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{label}</div>
                      <div style={{ fontSize: '0.75rem', color: COLORS.textMuted, marginTop: '0.125rem' }}>{desc}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inline Editor Modal */}
        <AnimatePresence>
          {editingSection && (() => {
            const pg = pages.find((p) => p.id === editingSection.pageId);
            const sec = pg?.sections.find((s) => s.id === editingSection.sectionId);
            if (!sec) return null;
            return (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                onClick={() => setEditingSection(null)}>
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} style={{ width: '480px', maxWidth: '100%' }}>
                  <InlineEditorPanel section={sec}
                    onUpdate={(updates) => updateSection(editingSection.pageId, editingSection.sectionId, updates)}
                    onClose={() => setEditingSection(null)}
                  />
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Generate Website Modal */}
        <AnimatePresence>
          {showWebsiteGen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
              onClick={() => setShowWebsiteGen(false)}>
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()}
                style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: '12px', width: '460px', maxWidth: '100%', padding: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <Globe size={20} color="#10b981" />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Generate Full Website</h3>
                </div>
                <p style={{ fontSize: '0.875rem', color: COLORS.textSecondary, marginBottom: '1.25rem', lineHeight: 1.6 }}>
                  Generate a complete multi-page website (Home, About, Pricing, Contact, Dashboard) from your prompt and selected style preset.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={() => setShowWebsiteGen(false)} style={{ flex: 1, padding: '0.625rem', background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: '8px', cursor: 'pointer', color: COLORS.textSecondary, fontWeight: 600 }}>Cancel</button>
                  <button onClick={handleGenerateWebsite} style={{ flex: 2, padding: '0.625rem', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
                    <Rocket size={14} /> Generate Website
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SidebarLayout>
  );
}
