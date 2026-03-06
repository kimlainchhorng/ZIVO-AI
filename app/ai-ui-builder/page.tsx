'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Wand2, Download, Github, Rocket, RefreshCw, Trash2, GripVertical,
  Copy, ChevronDown, ChevronUp, Plus, X, CheckCircle2, AlertCircle,
} from 'lucide-react';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { useBuilderStore } from '@/lib/builder-store';
import { toast } from 'sonner';
import type { Section, StylePreset } from '@/types/builder';

const STYLE_PRESETS: { value: StylePreset; label: string }[] = [
  { value: 'premium',               label: '✨ Premium' },
  { value: 'minimal',               label: '⚪ Minimal' },
  { value: 'luxury_dark',           label: '💎 Luxury Dark' },
  { value: 'startup',               label: '⚡ Startup' },
  { value: 'corporate',             label: '🏢 Corporate' },
  { value: 'modern_glassmorphism',  label: '🔮 Glassmorphism' },
];

const SECTION_TYPES = [
  'hero', 'features', 'pricing', 'testimonials', 'faq',
  'contact', 'dashboard_cards', 'login_signup',
] as const;

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('zivo_supabase_token');
}

// ─── Sortable Section Card ────────────────────────────────────────────────────

interface SortableSectionProps {
  section: Section;
  pageId: string;
  onRegenerate: (section: Section) => void;
  onDelete: (sectionId: string) => void;
  onUpdate: (sectionId: string, updates: Partial<Section>) => void;
}

function SortableSection({ section, pageId, onRegenerate, onDelete, onUpdate }: SortableSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [localTitle, setLocalTitle] = useState(section.title);
  const [localContent, setLocalContent] = useState(section.content);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  function handleSave() {
    onUpdate(section.id, { title: localTitle, content: localContent });
    setEditing(false);
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <div style={{
        border: '1px solid rgba(99,102,241,0.15)',
        borderRadius: '10px',
        background: 'rgba(15,15,26,0.9)',
        overflow: 'hidden',
      }}>
        {/* Section Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.75rem 1rem', background: 'rgba(99,102,241,0.05)',
        }}>
          <div {...attributes} {...listeners} style={{ cursor: 'grab', color: '#475569' }}>
            <GripVertical size={16} />
          </div>
          <span style={{
            padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem',
            background: 'rgba(99,102,241,0.15)', color: '#818cf8',
          }}>
            {section.type}
          </span>
          <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {section.title}
          </span>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              onClick={() => setExpanded((v) => !v)}
              title="Expand"
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button
              onClick={() => { setEditing((v) => !v); setExpanded(true); }}
              title="Edit"
              style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', padding: '4px', fontSize: '0.8rem' }}
            >
              ✏️
            </button>
            <button
              onClick={() => onRegenerate(section)}
              title="Regenerate"
              style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', padding: '4px' }}
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={() => onDelete(section.id)}
              title="Delete"
              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Section Content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ padding: '1rem' }}>
                {editing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <input
                      value={localTitle}
                      onChange={(e) => setLocalTitle(e.target.value)}
                      style={{
                        padding: '0.5rem 0.75rem', borderRadius: '6px',
                        background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)',
                        color: '#f1f5f9', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box',
                      }}
                    />
                    <textarea
                      value={localContent}
                      onChange={(e) => setLocalContent(e.target.value)}
                      rows={4}
                      style={{
                        padding: '0.5rem 0.75rem', borderRadius: '6px',
                        background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)',
                        color: '#f1f5f9', fontSize: '0.85rem', resize: 'vertical', width: '100%',
                        boxSizing: 'border-box',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={handleSave}
                        style={{
                          padding: '0.375rem 1rem', borderRadius: '6px',
                          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                          color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.85rem',
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditing(false)}
                        style={{
                          padding: '0.375rem 1rem', borderRadius: '6px',
                          background: 'transparent', border: '1px solid rgba(99,102,241,0.2)',
                          color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6 }}>
                    {section.content.slice(0, 300)}{section.content.length > 300 ? '…' : ''}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AIUIBuilderPage() {
  const {
    pages, prompt, stylePreset, isGenerating, versions,
    setPrompt, setStylePreset, setUIOutput, setIsGenerating,
    updateSection, deleteSection, reorderSections, setVersions,
    activePageId, setActivePage, projectId, setProjectId,
  } = useBuilderStore();

  const [templates, setTemplates] = useState<Array<{ id: string; title: string; prompt: string; icon: string; description?: string }>>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showGithubDialog, setShowGithubDialog] = useState(false);
  const [showVercelDialog, setShowVercelDialog] = useState(false);
  const [repoName, setRepoName] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [vercelToken, setVercelToken] = useState('');
  const [projectName, setProjectName] = useState('');
  const [deployStatus, setDeployStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<[string | null, string | null]>([null, null]);
  const [diffText, setDiffText] = useState<string | null>(null);

  const token = getStoredToken();

  // Load templates on mount
  useEffect(() => {
    fetch('/api/prompt-templates')
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates ?? []))
      .catch(() => {});
  }, []);

  // Load versions if projectId is set
  useEffect(() => {
    const pid = new URLSearchParams(window.location.search).get('projectId');
    if (pid) {
      setProjectId(pid);
      if (token) {
        fetch(`/api/versions?projectId=${pid}`, { headers: { Authorization: `Bearer ${token}` } })
          .then((r) => r.json())
          .then((d) => setVersions(d.versions ?? []))
          .catch(() => {});
      }
    }
  }, []);

  const activePage = pages.find((p) => p.id === activePageId) ?? pages[0];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !activePage) return;
    const oldIndex = activePage.sections.findIndex((s) => s.id === active.id);
    const newIndex = activePage.sections.findIndex((s) => s.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      reorderSections(activePage.id, oldIndex, newIndex);
    }
  }

  async function handleGenerate() {
    if (!prompt.trim()) { toast.error('Enter a prompt first'); return; }
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-ui', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ prompt, stylePreset, projectId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Generation failed'); return; }
      setUIOutput(data.data);
      toast.success('UI generated successfully!');
      if (data.versionId && token && projectId) {
        const vRes = await fetch(`/api/versions?projectId=${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const vData = await vRes.json();
        setVersions(vData.versions ?? []);
      }
    } catch {
      toast.error('Network error');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleRegenerate(section: Section) {
    if (!token || !projectId || !activePage) { toast.error('Save project first to regenerate sections'); return; }
    const latestVersion = versions[0];
    if (!latestVersion) { toast.error('No version found'); return; }
    setRegeneratingId(section.id);
    try {
      const res = await fetch('/api/regenerate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          projectId,
          versionId: latestVersion.id,
          sectionId: section.id,
          sectionType: section.type,
          prompt: `Regenerate this ${section.type} section with fresh, compelling content`,
          stylePreset,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        updateSection(activePage.id, section.id, data.section);
        toast.success('Section regenerated!');
      } else {
        toast.error(data.error ?? 'Regeneration failed');
      }
    } finally {
      setRegeneratingId(null);
    }
  }

  async function handleAddSection(sectionType: string) {
    if (!activePage) return;
    const newSection: Section = {
      id: `s-${Date.now()}`,
      type: sectionType as Section['type'],
      title: `New ${sectionType} Section`,
      content: `Add your ${sectionType} content here.`,
      order: activePage.sections.length,
    };
    const { addSection } = useBuilderStore.getState();
    addSection(activePage.id, newSection);
    toast.success(`Added ${sectionType} section`);
  }

  async function handleExport(exportType: 'react' | 'nextjs' | 'tailwind' | 'zip') {
    if (!token || !projectId) { toast.error('Save project first'); return; }
    try {
      const res = await fetch('/api/builder-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ projectId, exportType }),
      });
      if (exportType === 'zip') {
        const base64 = await res.text();
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'application/zip' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'project.zip'; a.click();
        URL.revokeObjectURL(url);
        toast.success('ZIP downloaded!');
      } else {
        const data = await res.json();
        if (res.ok) {
          const firstFile = Object.values(data.files ?? {})[0] as string;
          if (firstFile) {
            await navigator.clipboard.writeText(firstFile);
            toast.success(`${exportType} code copied to clipboard!`);
          }
        } else {
          toast.error(data.error ?? 'Export failed');
        }
      }
    } catch {
      toast.error('Export failed');
    }
  }

  async function handlePublishGithub() {
    if (!token || !projectId) { toast.error('Not authenticated'); return; }
    try {
      const res = await fetch('/api/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ projectId, repoName, githubToken }),
      });
      const data = await res.json();
      if (res.ok) {
        setDeployStatus({ type: 'success', message: `Published to ${data.repoUrl}` });
        setShowGithubDialog(false);
        toast.success('Published to GitHub!');
      } else {
        setDeployStatus({ type: 'error', message: data.error ?? 'GitHub publish failed' });
      }
    } catch {
      setDeployStatus({ type: 'error', message: 'Network error' });
    }
  }

  async function handleDeployVercel() {
    if (!token || !projectId) { toast.error('Not authenticated'); return; }
    try {
      const res = await fetch('/api/deploy-vercel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ projectId, vercelToken, projectName }),
      });
      const data = await res.json();
      if (res.ok) {
        setDeployStatus({ type: 'success', message: `Deployed to ${data.deployUrl ?? 'Vercel'}` });
        setShowVercelDialog(false);
        toast.success('Deployed to Vercel!');
      } else {
        setDeployStatus({ type: 'error', message: data.error ?? 'Vercel deploy failed' });
      }
    } catch {
      setDeployStatus({ type: 'error', message: 'Network error' });
    }
  }

  async function handleCompareVersions() {
    if (!token || !projectId || !compareIds[0] || !compareIds[1]) {
      toast.error('Select two versions to compare');
      return;
    }
    const va = versions.find((v) => v.id === compareIds[0])?.versionNumber;
    const vb = versions.find((v) => v.id === compareIds[1])?.versionNumber;
    if (!va || !vb) return;
    try {
      const res = await fetch('/api/versions/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ projectId, versionA: va, versionB: vb }),
      });
      const data = await res.json();
      if (res.ok) setDiffText(data.diff);
    } catch {}
  }

  async function handleRestoreVersion(versionNumber: number) {
    if (!token || !projectId) return;
    try {
      const res = await fetch('/api/versions/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ projectId, versionNumber }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Restored as version ${data.newVersion?.versionNumber}`);
        const vRes = await fetch(`/api/versions?projectId=${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const vData = await vRes.json();
        setVersions(vData.versions ?? []);
      }
    } catch {}
  }

  const panelStyle = {
    background: 'rgba(15,15,26,0.95)',
    border: '1px solid rgba(99,102,241,0.15)',
    borderRadius: '12px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  };

  const sectionBtnStyle = (type: string) => ({
    padding: '0.375rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem',
    background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)',
    color: '#818cf8', cursor: 'pointer',
  });

  return (
    <SidebarLayout>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0a0a0f', color: '#f1f5f9' }}>

        {/* ── LEFT PANEL ── */}
        <div style={{ width: '300px', flexShrink: 0, overflow: 'auto', padding: '1rem', borderRight: '1px solid rgba(99,102,241,0.1)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Prompt Templates */}
          <div style={panelStyle}>
            <h3 style={{ fontWeight: 700, fontSize: '0.85rem', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Templates
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setPrompt(t.prompt)}
                  title={t.description}
                  style={{
                    padding: '0.625rem 0.5rem', borderRadius: '8px',
                    background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)',
                    color: '#f1f5f9', cursor: 'pointer', fontSize: '0.8rem', textAlign: 'left',
                  }}
                >
                  <span style={{ display: 'block', fontSize: '1.25rem', marginBottom: '0.25rem' }}>{t.icon}</span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{t.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Style Preset */}
          <div style={panelStyle}>
            <h3 style={{ fontWeight: 700, fontSize: '0.85rem', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Style Preset
            </h3>
            <select
              value={stylePreset}
              onChange={(e) => setStylePreset(e.target.value as StylePreset)}
              style={{
                padding: '0.625rem 0.75rem', borderRadius: '8px',
                background: '#0a0a0f', border: '1px solid rgba(99,102,241,0.2)',
                color: '#f1f5f9', fontSize: '0.9rem',
              }}
            >
              {STYLE_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Prompt */}
          <div style={panelStyle}>
            <h3 style={{ fontWeight: 700, fontSize: '0.85rem', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Prompt
            </h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your website or app..."
              rows={5}
              style={{
                padding: '0.75rem', borderRadius: '8px',
                background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)',
                color: '#f1f5f9', fontSize: '0.9rem', resize: 'vertical',
              }}
            />
            <motion.button
              onClick={handleGenerate}
              disabled={isGenerating}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.75rem', borderRadius: '8px',
                background: isGenerating ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#fff', border: 'none', cursor: isGenerating ? 'not-allowed' : 'pointer',
                fontWeight: 600, fontSize: '0.95rem',
              }}
            >
              {isGenerating ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                >
                  <RefreshCw size={18} />
                </motion.div>
              ) : <Wand2 size={18} />}
              {isGenerating ? 'Generating...' : 'Generate UI'}
            </motion.button>
          </div>

          {/* Add Section */}
          <div style={panelStyle}>
            <h3 style={{ fontWeight: 700, fontSize: '0.85rem', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Add Section
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {SECTION_TYPES.map((type) => (
                <button key={type} onClick={() => handleAddSection(type)} style={sectionBtnStyle(type)}>
                  + {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── CENTER PANEL ── */}
        <div style={{ flex: 1, overflow: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Page Tabs */}
          {pages.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {pages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => setActivePage(page.id)}
                  style={{
                    padding: '0.375rem 0.75rem', borderRadius: '6px',
                    background: activePage?.id === page.id ? 'rgba(99,102,241,0.2)' : 'transparent',
                    border: `1px solid ${activePage?.id === page.id ? 'rgba(99,102,241,0.5)' : 'rgba(99,102,241,0.15)'}`,
                    color: activePage?.id === page.id ? '#818cf8' : '#64748b',
                    cursor: 'pointer', fontSize: '0.85rem', fontWeight: activePage?.id === page.id ? 600 : 400,
                  }}
                >
                  {page.name}
                </button>
              ))}
            </div>
          )}

          {/* Sections */}
          {!activePage ? (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: '1.5rem', padding: '4rem',
              border: '2px dashed rgba(99,102,241,0.15)', borderRadius: '16px',
            }}>
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Wand2 size={48} style={{ color: '#334155' }} />
              </motion.div>
              <p style={{ color: '#475569', fontSize: '1.1rem' }}>
                {isGenerating ? 'Generating your UI...' : 'Enter a prompt and click Generate UI'}
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={activePage.sections.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <AnimatePresence>
                    {activePage.sections.map((section) => (
                      <SortableSection
                        key={section.id}
                        section={section}
                        pageId={activePage.id}
                        onRegenerate={handleRegenerate}
                        onDelete={(id) => deleteSection(activePage.id, id)}
                        onUpdate={(id, updates) => updateSection(activePage.id, id, updates)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ width: '280px', flexShrink: 0, overflow: 'auto', padding: '1rem', borderLeft: '1px solid rgba(99,102,241,0.1)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Version History */}
          <div style={panelStyle}>
            <button
              onClick={() => setShowVersions((v) => !v)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', padding: 0 }}
            >
              Version History
              {showVersions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <AnimatePresence>
              {showVersions && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                  {/* Compare toggle */}
                  <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      onClick={() => setCompareMode((v) => !v)}
                      style={{
                        padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem',
                        background: compareMode ? 'rgba(99,102,241,0.2)' : 'transparent',
                        border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', cursor: 'pointer',
                      }}
                    >
                      Compare
                    </button>
                    {compareMode && compareIds[0] && compareIds[1] && (
                      <button onClick={handleCompareVersions} style={{ padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', color: '#fff', cursor: 'pointer' }}>
                        Diff
                      </button>
                    )}
                  </div>

                  {diffText && (
                    <pre style={{ fontSize: '0.75rem', color: '#94a3b8', background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '6px', overflow: 'auto', maxHeight: '150px', marginBottom: '0.75rem' }}>
                      {diffText}
                    </pre>
                  )}

                  {versions.length === 0 ? (
                    <p style={{ color: '#475569', fontSize: '0.85rem' }}>No versions saved yet</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {versions.slice(0, 10).map((v) => (
                        <div
                          key={v.id}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '0.5rem 0.75rem', borderRadius: '6px',
                            background: compareIds.includes(v.id) ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.05)',
                            border: '1px solid rgba(99,102,241,0.1)',
                            cursor: compareMode ? 'pointer' : 'default',
                          }}
                          onClick={() => {
                            if (!compareMode) return;
                            if (!compareIds[0]) setCompareIds([v.id, null]);
                            else if (!compareIds[1] && v.id !== compareIds[0]) setCompareIds([compareIds[0], v.id]);
                            else setCompareIds([v.id, null]);
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>v{v.versionNumber}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{v.label ?? new Date(v.createdAt).toLocaleDateString()}</div>
                          </div>
                          {!compareMode && (
                            <button
                              onClick={() => handleRestoreVersion(v.versionNumber)}
                              style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', cursor: 'pointer' }}
                            >
                              Restore
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Export Panel */}
          <div style={panelStyle}>
            <button
              onClick={() => setShowExport((v) => !v)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', padding: 0 }}
            >
              Export
              {showExport ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <AnimatePresence>
              {showExport && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(['react', 'nextjs', 'tailwind'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => handleExport(type)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.5rem 0.75rem', borderRadius: '6px',
                        background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)',
                        color: '#818cf8', cursor: 'pointer', fontSize: '0.85rem',
                      }}
                    >
                      <Copy size={14} /> Export {type}
                    </button>
                  ))}
                  <button
                    onClick={() => handleExport('zip')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.5rem 0.75rem', borderRadius: '6px',
                      background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)',
                      color: '#10b981', cursor: 'pointer', fontSize: '0.85rem',
                    }}
                  >
                    <Download size={14} /> Download ZIP
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Deploy Panel */}
          <div style={panelStyle}>
            <h3 style={{ fontWeight: 700, fontSize: '0.85rem', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Deploy
            </h3>
            <button
              onClick={() => setShowGithubDialog(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 0.75rem', borderRadius: '6px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#f1f5f9', cursor: 'pointer', fontSize: '0.85rem',
              }}
            >
              <Github size={14} /> Publish to GitHub
            </button>
            <button
              onClick={() => setShowVercelDialog(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 0.75rem', borderRadius: '6px',
                background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#f1f5f9', cursor: 'pointer', fontSize: '0.85rem',
              }}
            >
              <Rocket size={14} /> Deploy to Vercel
            </button>

            {deployStatus && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.625rem 0.75rem', borderRadius: '6px',
                background: deployStatus.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${deployStatus.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                fontSize: '0.8rem',
                color: deployStatus.type === 'success' ? '#10b981' : '#ef4444',
              }}>
                {deployStatus.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                {deployStatus.message}
              </div>
            )}

            {/* Duplicate Project */}
            {projectId && (
              <button
                onClick={async () => {
                  if (!token) return;
                  const res = await fetch(`/api/projects/${projectId}/duplicate`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  if (res.ok) toast.success('Project duplicated!');
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.5rem 0.75rem', borderRadius: '6px',
                  background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)',
                  color: '#818cf8', cursor: 'pointer', fontSize: '0.85rem',
                }}
              >
                <Copy size={14} /> Duplicate Project
              </button>
            )}
          </div>
        </div>
      </div>

      {/* GitHub Dialog */}
      <AnimatePresence>
        {showGithubDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowGithubDialog(false); }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              style={{ background: '#0f0f1a', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '16px', padding: '2rem', width: '400px', maxWidth: '90vw' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h2 style={{ fontWeight: 700, color: '#f1f5f9' }}>Publish to GitHub</h2>
                <button onClick={() => setShowGithubDialog(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>Repository Name</label>
                  <input value={repoName} onChange={(e) => setRepoName(e.target.value)} placeholder="my-zivo-project" style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', color: '#f1f5f9', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>GitHub Token (Fine-grained PAT)</label>
                  <input type="password" value={githubToken} onChange={(e) => setGithubToken(e.target.value)} placeholder="ghp_..." style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', color: '#f1f5f9', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button onClick={() => setShowGithubDialog(false)} style={{ flex: 1, padding: '0.625rem', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(99,102,241,0.2)', color: '#94a3b8', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handlePublishGithub} disabled={!repoName || !githubToken} style={{ flex: 1, padding: '0.625rem', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, opacity: !repoName || !githubToken ? 0.6 : 1 }}>Publish</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vercel Dialog */}
      <AnimatePresence>
        {showVercelDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowVercelDialog(false); }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              style={{ background: '#0f0f1a', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '16px', padding: '2rem', width: '400px', maxWidth: '90vw' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h2 style={{ fontWeight: 700, color: '#f1f5f9' }}>Deploy to Vercel</h2>
                <button onClick={() => setShowVercelDialog(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>Project Name</label>
                  <input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="my-zivo-project" style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', color: '#f1f5f9', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>Vercel Token</label>
                  <input type="password" value={vercelToken} onChange={(e) => setVercelToken(e.target.value)} placeholder="vercel_..." style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', color: '#f1f5f9', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button onClick={() => setShowVercelDialog(false)} style={{ flex: 1, padding: '0.625rem', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(99,102,241,0.2)', color: '#94a3b8', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleDeployVercel} disabled={!projectName || !vercelToken} style={{ flex: 1, padding: '0.625rem', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, opacity: !projectName || !vercelToken ? 0.6 : 1 }}>Deploy</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </SidebarLayout>
  );
}
