'use client';

/**
 * app/ai-builder/page.tsx
 * Full-featured AI UI Builder page.
 * Uses: Zustand store, framer-motion, @dnd-kit, Tailwind, Radix UI, lucide-react
 */

import { useEffect, useState, useRef, useCallback } from 'react';
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
  Wand2,
  Github,
  Rocket,
  RefreshCw,
  Trash2,
  GripVertical,
  Copy,
  ChevronDown,
  ChevronUp,
  Plus,
  Save,
  Eye,
  Layers,
  Settings2,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { useBuilderStore } from '@/lib/builder-store';
import { toast } from 'sonner';
import type { Section, StylePreset } from '@/types/builder';

// ─── Constants ────────────────────────────────────────────────────────────────

const STYLE_PRESETS: { value: StylePreset; label: string; color: string }[] = [
  { value: 'premium', label: '✨ Premium', color: '#6366f1' },
  { value: 'minimal', label: '⚪ Minimal', color: '#18181b' },
  { value: 'luxury_dark', label: '💎 Luxury Dark', color: '#d4af37' },
  { value: 'startup', label: '⚡ Startup', color: '#10b981' },
  { value: 'corporate', label: '🏢 Corporate', color: '#1e40af' },
  { value: 'modern_glassmorphism', label: '🔮 Glassmorphism', color: '#a855f7' },
];

const SECTION_TYPES = [
  { type: 'hero', icon: '🦸', label: 'Hero' },
  { type: 'features', icon: '⭐', label: 'Features' },
  { type: 'pricing', icon: '💰', label: 'Pricing' },
  { type: 'testimonials', icon: '💬', label: 'Testimonials' },
  { type: 'faq', icon: '❓', label: 'FAQ' },
  { type: 'contact', icon: '📧', label: 'Contact' },
  { type: 'dashboard_cards', icon: '📊', label: 'Dashboard' },
  { type: 'login_signup', icon: '🔑', label: 'Login/Signup' },
] as const;

const PROMPT_TEMPLATES = [
  { id: 'saas', icon: '🚀', title: 'SaaS Landing', prompt: 'A modern SaaS product landing page with hero, features, pricing, and CTA sections. Clean and professional design.' },
  { id: 'rideshare', icon: '🚗', title: 'Ride-share App', prompt: 'A ride-share app homepage with booking hero, how it works, driver/rider benefits, and app download section.' },
  { id: 'restaurant', icon: '🍽️', title: 'Restaurant App', prompt: 'A restaurant website with menu hero, featured dishes, online ordering section, reviews, and contact/location.' },
  { id: 'delivery', icon: '📦', title: 'Delivery Dashboard', prompt: 'A delivery management dashboard with KPI cards, order tracking, driver management, and analytics sections.' },
  { id: 'luxury', icon: '💎', title: 'Luxury Brand', prompt: 'A luxury brand homepage with full-screen hero, product showcase, brand story, testimonials, and exclusive collection.' },
];

const EXPORT_FORMATS = [
  { format: 'react', label: 'Export React', icon: '⚛️' },
  { format: 'nextjs', label: 'Export Next.js', icon: '▲' },
  { format: 'tailwind', label: 'Export Tailwind', icon: '💨' },
  { format: 'zip', label: 'Download ZIP', icon: '📦' },
] as const;

const PAGE_TEMPLATES = ['Home', 'About', 'Pricing', 'Contact', 'Dashboard', 'Settings'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function SortableSection({ section, pageId: _pageId, onRegenerate, onDelete, onUpdate }: SortableSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [localTitle, setLocalTitle] = useState(section.title);
  const [localContent, setLocalContent] = useState(section.content);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-xl border border-indigo-500/15 bg-slate-950/90 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-indigo-500/5 border-b border-indigo-500/10">
        <button {...attributes} {...listeners} className="cursor-grab text-slate-500 hover:text-slate-300 transition-colors">
          <GripVertical size={15} />
        </button>
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
          {section.type}
        </span>
        <span className="flex-1 text-sm font-medium text-slate-200 truncate">{section.title}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors"
            title="Toggle preview"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={() => onRegenerate(section)}
            className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-emerald-400 transition-colors"
            title="Regenerate this section"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => setEditing((v) => !v)}
            className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-blue-400 transition-colors"
            title="Edit section"
          >
            <Settings2 size={14} />
          </button>
          <button
            onClick={() => onDelete(section.id)}
            className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-red-400 transition-colors"
            title="Delete section"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Content Preview */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 text-sm text-slate-400 leading-relaxed border-b border-white/5">
              {section.content.slice(0, 300)}{section.content.length > 300 ? '…' : ''}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Form */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 flex flex-col gap-2 border-t border-white/5">
              <input
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                placeholder="Section title"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
              />
              <textarea
                value={localContent}
                onChange={(e) => setLocalContent(e.target.value)}
                placeholder="Section content"
                rows={4}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-200 text-sm placeholder-slate-500 resize-none focus:outline-none focus:border-indigo-500/50"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

function Modal({ title, onClose, children }: ModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-indigo-500/20 bg-slate-950 p-6 flex flex-col gap-4 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 transition-colors">
            <X size={16} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AIBuilderPage() {
  const {
    projectId,
    stylePreset,
    pages,
    activePageId,
    isGenerating,
    versions,
    setProjectId,
    setStylePreset,
    setUIOutput,
    setActivePage,
    addSection,
    addPage,
    updateSection,
    deleteSection,
    reorderSections,
    setVersions,
    setIsGenerating,
    reset,
  } = useBuilderStore();

  const [token, setToken] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState('My Project');
  const [editingTitle, setEditingTitle] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [showVercelModal, setShowVercelModal] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [vercelToken, setVercelToken] = useState('');
  const [deployStatus, setDeployStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [showVersions, setShowVersions] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<[string | null, string | null]>([null, null]);
  const [diffText, setDiffText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activePage = pages.find((p) => p.id === activePageId) ?? pages[0] ?? null;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Load token from localStorage
  useEffect(() => {
    setToken(getStoredToken());
  }, []);

  // Load or create a project on mount
  useEffect(() => {
    if (!token) return;
    const stored = localStorage.getItem('zivo_builder_project_id');
    if (stored) {
      setProjectId(stored);
    }
  }, [token, setProjectId]);

  // Auto-save trigger when pages change
  const triggerAutoSave = useCallback(() => {
    if (!projectId || !token) return;
    setAutoSaveStatus('unsaved');
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      setAutoSaveStatus('saving');
      try {
        await fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ pages }),
        });
        setAutoSaveStatus('saved');
      } catch {
        setAutoSaveStatus('unsaved');
      }
    }, 3000);
  }, [projectId, token, pages]);

  useEffect(() => {
    if (pages.length > 0) triggerAutoSave();
  }, [pages, triggerAutoSave]);

  // ── Generate full UI ────────────────────────────────────────────────────────

  async function handleGenerate() {
    if (!prompt.trim()) { toast.error('Enter a prompt first'); return; }
    if (!token) { toast.error('Please sign in to generate UI'); return; }

    setIsGenerating(true);
    try {
      // Create project if needed
      let pid = projectId;
      if (!pid) {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title: projectTitle, mode: 'website_v2' }),
        });
        const data = await res.json();
        pid = data.project?.id;
        if (pid) {
          setProjectId(pid);
          localStorage.setItem('zivo_builder_project_id', pid);
        }
      }

      const res = await fetch('/api/generate-ui', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt, stylePreset, projectId: pid }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? 'Generation failed');
        return;
      }

      setUIOutput(data);
      toast.success('UI generated successfully!');
    } catch (_err) {
      toast.error('Network error during generation');
    } finally {
      setIsGenerating(false);
    }
  }

  // ── Add a blank section ─────────────────────────────────────────────────────

  async function handleAddSection(type: string) {
    const pageId = activePage?.id;
    if (!pageId) { toast.error('Generate a UI first to add sections'); return; }

    if (token && projectId) {
      try {
        const res = await fetch('/api/generate-section', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ projectId, sectionType: type, prompt: `Generate a ${type} section`, stylePreset }),
        });
        const data = await res.json();
        if (res.ok && data.section) {
          addSection(pageId, data.section);
          toast.success(`${type} section added`);
          return;
        }
      } catch {
        // Fall through to blank section
      }
    }

    // Fallback: blank section
    addSection(pageId, {
      id: `sec_${Date.now()}`,
      type: type as Section['type'],
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Section`,
      content: `Edit this ${type} section content.`,
      order: (activePage?.sections.length ?? 0),
    });
    toast.success(`${type} section added`);
  }

  // ── Regenerate a single section ─────────────────────────────────────────────

  async function handleRegenerate(section: Section) {
    const pageId = activePage?.id;
    if (!pageId || !token || !projectId) { toast.error('Not authenticated'); return; }

    try {
      const res = await fetch('/api/regenerate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          projectId,
          versionId: versions[0]?.id,
          sectionId: section.id,
          sectionType: section.type,
          prompt: section.title,
          stylePreset,
        }),
      });
      const data = await res.json();
      if (res.ok && data.section) {
        updateSection(pageId, section.id, data.section);
        toast.success('Section regenerated');
      } else {
        toast.error(data.error ?? 'Regeneration failed');
      }
    } catch {
      toast.error('Network error');
    }
  }

  // ── Add page ────────────────────────────────────────────────────────────────

  function handleAddPage(name: string) {
    const newPage = {
      id: `page_${Date.now()}`,
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      sections: [],
      isHome: false,
    };
    addPage(newPage);
    setActivePage(newPage.id);
    toast.success(`Page "${name}" added`);
  }

  // ── DnD ─────────────────────────────────────────────────────────────────────

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !activePage) return;
    const sections = activePage.sections;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      reorderSections(activePage.id, oldIndex, newIndex);
    }
  }

  // ── Export ──────────────────────────────────────────────────────────────────

  async function handleExport(format: string) {
    if (!token || !projectId) { toast.error('Not authenticated'); return; }
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ projectId, format, projectName: projectTitle.replace(/\s+/g, '-').toLowerCase() }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? 'Export failed');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectTitle.replace(/\s+/g, '-').toLowerCase()}-${format}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export ready!');
    } catch {
      toast.error('Export failed');
    }
  }

  async function handleCopyCode() {
    if (!activePage) { toast.error('No sections to copy'); return; }
    const code = activePage.sections
      .map((s) => `// ${s.type}\n// ${s.title}\n${s.content}`)
      .join('\n\n---\n\n');
    await navigator.clipboard.writeText(code);
    toast.success('Code copied!');
  }

  // ── Save Version ─────────────────────────────────────────────────────────────

  async function handleSaveVersion() {
    if (!token || !projectId) { toast.error('Not authenticated'); return; }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          label: `Saved ${new Date().toLocaleTimeString()}`,
          pages,
          sections: activePage?.sections ?? [],
          style_preset: stylePreset,
          snapshot: { pages, stylePreset },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Version ${data.version?.version_number} saved`);
        await loadVersions();
      } else {
        toast.error(data.error ?? 'Save failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setIsSaving(false);
    }
  }

  async function loadVersions() {
    if (!token || !projectId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/versions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setVersions(data.versions ?? []);
    } catch {}
  }

  useEffect(() => {
    if (token && projectId) loadVersions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, projectId]);

  // ── Compare ──────────────────────────────────────────────────────────────────

  async function handleCompare() {
    if (!token || !projectId || !compareIds[0] || !compareIds[1]) {
      toast.error('Select two versions to compare');
      return;
    }
    try {
      const res = await fetch(
        `/api/projects/${projectId}/compare?v1=${compareIds[0]}&v2=${compareIds[1]}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok) {
        setDiffText(data.diff ?? 'No differences found');
      } else {
        toast.error(data.error ?? 'Compare failed');
      }
    } catch {
      toast.error('Network error');
    }
  }

  // ── Restore Version ──────────────────────────────────────────────────────────

  async function handleRestore(versionId: string) {
    if (!token || !projectId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/versions/${versionId}?action=restore`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Restored to version ${data.restoredVersion}`);
        // Reload the project state
        window.location.reload();
      } else {
        toast.error(data.error ?? 'Restore failed');
      }
    } catch {
      toast.error('Network error');
    }
  }

  // ── Duplicate Project ────────────────────────────────────────────────────────

  async function handleDuplicate() {
    if (!token || !projectId) { toast.error('Not authenticated'); return; }
    try {
      const res = await fetch(`/api/projects/${projectId}/duplicate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Project duplicated');
        if (data.project?.id) {
          localStorage.setItem('zivo_builder_project_id', data.project.id);
          setProjectId(data.project.id);
        }
      } else {
        toast.error(data.error ?? 'Duplicate failed');
      }
    } catch {
      toast.error('Network error');
    }
  }

  // ── GitHub Publish ───────────────────────────────────────────────────────────

  async function handlePublishGitHub() {
    if (!token || !projectId || !githubToken || !githubRepo) {
      toast.error('Fill in GitHub token and repo name');
      return;
    }
    setDeployStatus({ type: 'info', message: 'Publishing to GitHub…' });
    try {
      const res = await fetch('/api/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ projectId, repoName: githubRepo, githubToken, commitMessage: 'Deploy from ZIVO-AI' }),
      });
      const data = await res.json();
      if (res.ok) {
        setDeployStatus({ type: 'success', message: `Published: ${data.repoUrl ?? githubRepo}` });
        setShowGithubModal(false);
        toast.success('Published to GitHub!');
      } else {
        setDeployStatus({ type: 'error', message: data.error ?? 'GitHub publish failed' });
      }
    } catch {
      setDeployStatus({ type: 'error', message: 'Network error' });
    }
  }

  // ── Vercel Deploy ────────────────────────────────────────────────────────────

  async function handleDeployVercel() {
    if (!token || !projectId || !vercelToken) {
      toast.error('Enter Vercel token');
      return;
    }
    setDeployStatus({ type: 'info', message: 'Deploying to Vercel…' });
    try {
      const res = await fetch('/api/deploy-vercel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ projectId, vercelToken, projectName: projectTitle.replace(/\s+/g, '-').toLowerCase() }),
      });
      const data = await res.json();
      if (res.ok) {
        setDeployUrl(data.deployUrl ?? null);
        setDeployStatus({ type: 'success', message: `Deployed: ${data.deployUrl ?? 'Vercel'}` });
        setShowVercelModal(false);
        toast.success('Deployed to Vercel!');
      } else {
        setDeployStatus({ type: 'error', message: data.error ?? 'Vercel deploy failed' });
      }
    } catch {
      setDeployStatus({ type: 'error', message: 'Network error' });
    }
  }

  // ─── Generate Nav/Footer ─────────────────────────────────────────────────────

  async function handleGenerateNav() {
    if (!token || !projectId) { toast.error('Not authenticated'); return; }
    const pageId = activePage?.id;
    if (!pageId) { toast.error('Generate a page first'); return; }
    try {
      const res = await fetch('/api/generate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ projectId, sectionType: 'navigation', prompt: 'Navigation with links to all pages', stylePreset }),
      });
      const data = await res.json();
      if (res.ok && data.section) {
        addSection(pageId, data.section);
        toast.success('Navigation generated');
      }
    } catch {
      toast.error('Network error');
    }
  }

  async function handleGenerateFooter() {
    if (!token || !projectId) { toast.error('Not authenticated'); return; }
    const pageId = activePage?.id;
    if (!pageId) { toast.error('Generate a page first'); return; }
    try {
      const res = await fetch('/api/generate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ projectId, sectionType: 'footer', prompt: 'Footer with links and copyright', stylePreset }),
      });
      const data = await res.json();
      if (res.ok && data.section) {
        addSection(pageId, data.section);
        toast.success('Footer generated');
      }
    } catch {
      toast.error('Network error');
    }
  }

  // ─── Compare version selection ────────────────────────────────────────────────

  function handleVersionCompareSelect(versionId: string) {
    setCompareIds((prev) => {
      if (!prev[0]) return [versionId, null];
      if (!prev[1] && prev[0] !== versionId) return [prev[0], versionId];
      return [versionId, null];
    });
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <SidebarLayout>
      <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">

        {/* ── TOP BAR ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-indigo-500/15 bg-slate-950/95 flex-shrink-0">
          {/* Page tabs */}
          <div className="flex items-center gap-1.5 flex-1 overflow-x-auto">
            {pages.map((page) => (
              <button
                key={page.id}
                onClick={() => setActivePage(page.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activePage?.id === page.id
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {page.name}
              </button>
            ))}
            {/* Add page from templates */}
            <div className="relative group">
              <button className="px-2.5 py-1.5 rounded-lg text-sm text-slate-500 hover:text-slate-300 hover:bg-white/5 flex items-center gap-1 transition-colors">
                <Plus size={14} />
                Add Page
              </button>
              <div className="absolute top-full left-0 mt-1 w-36 rounded-xl border border-indigo-500/20 bg-slate-900 shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-20">
                {PAGE_TEMPLATES.map((name) => (
                  <button
                    key={name}
                    onClick={() => handleAddPage(name)}
                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-indigo-500/10 hover:text-indigo-300 transition-colors first:rounded-t-xl last:rounded-b-xl"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Top-bar actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleGenerateNav}
              className="px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
            >
              <Layers size={13} className="inline mr-1" />Nav
            </button>
            <button
              onClick={handleGenerateFooter}
              className="px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
            >
              Footer
            </button>
            {/* Auto-save indicator */}
            <span className={`text-xs flex items-center gap-1 ${
              autoSaveStatus === 'saved' ? 'text-emerald-500' :
              autoSaveStatus === 'saving' ? 'text-yellow-500' :
              'text-slate-500'
            }`}>
              {autoSaveStatus === 'saving' ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                  <RefreshCw size={11} />
                </motion.div>
              ) : autoSaveStatus === 'saved' ? <CheckCircle2 size={11} /> : <Clock size={11} />}
              {autoSaveStatus === 'saved' ? 'Saved' : autoSaveStatus === 'saving' ? 'Saving…' : 'Unsaved'}
            </span>
          </div>
        </div>

        {/* ── BODY (3-column) ───────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── LEFT PANEL ────────────────────────────────────────────────── */}
          <aside className="w-72 flex-shrink-0 overflow-y-auto border-r border-indigo-500/10 p-4 flex flex-col gap-4">

            {/* Project Title */}
            <div className="rounded-xl border border-indigo-500/15 bg-slate-900/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2">Project</p>
              {editingTitle ? (
                <input
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  onBlur={() => setEditingTitle(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(false)}
                  autoFocus
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-indigo-500/30 text-slate-100 text-sm focus:outline-none"
                />
              ) : (
                <button
                  onClick={() => setEditingTitle(true)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-slate-200 text-sm transition-colors"
                >
                  {projectTitle} <span className="text-slate-500 text-xs">(click to edit)</span>
                </button>
              )}
              {projectId && (
                <p className="text-xs text-slate-600 mt-1 truncate">ID: {projectId}</p>
              )}
            </div>

            {/* Style Presets */}
            <div className="rounded-xl border border-indigo-500/15 bg-slate-900/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-3">Style Preset</p>
              <div className="flex flex-col gap-1.5">
                {STYLE_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setStylePreset(p.value)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                      stylePreset === p.value
                        ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: p.color }}
                    />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt Templates */}
            <div className="rounded-xl border border-indigo-500/15 bg-slate-900/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-3">Templates</p>
              <div className="grid grid-cols-2 gap-2">
                {PROMPT_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setPrompt(t.prompt)}
                    title={t.prompt}
                    className="text-left p-2.5 rounded-lg bg-indigo-500/5 border border-indigo-500/10 hover:bg-indigo-500/10 hover:border-indigo-500/25 transition-colors"
                  >
                    <span className="block text-xl mb-1">{t.icon}</span>
                    <span className="text-xs text-slate-400">{t.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt + Generate */}
            <div className="rounded-xl border border-indigo-500/15 bg-slate-900/60 p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Prompt</p>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your website or app…"
                rows={5}
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-slate-200 text-sm placeholder-slate-600 resize-none focus:outline-none focus:border-indigo-500/40"
              />
              <motion.button
                onClick={handleGenerate}
                disabled={isGenerating}
                whileHover={{ scale: isGenerating ? 1 : 1.02 }}
                whileTap={{ scale: isGenerating ? 1 : 0.98 }}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                  isGenerating
                    ? 'bg-indigo-500/30 text-indigo-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white'
                }`}
              >
                {isGenerating ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                    <RefreshCw size={16} />
                  </motion.div>
                ) : <Wand2 size={16} />}
                {isGenerating ? 'Generating…' : 'Generate UI'}
              </motion.button>
            </div>

            {/* Section Generator */}
            <div className="rounded-xl border border-indigo-500/15 bg-slate-900/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-3">Add Section</p>
              <div className="grid grid-cols-2 gap-1.5">
                {SECTION_TYPES.map(({ type, icon, label }) => (
                  <button
                    key={type}
                    onClick={() => handleAddSection(type)}
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs text-slate-400 hover:text-indigo-300 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/10 hover:border-indigo-500/25 transition-colors"
                  >
                    <span>{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Export Buttons */}
            <div className="rounded-xl border border-indigo-500/15 bg-slate-900/60 p-4 flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1">Export</p>
              {EXPORT_FORMATS.map(({ format, label, icon }) => (
                <button
                  key={format}
                  onClick={() => handleExport(format)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 bg-white/3 hover:bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <span>{icon}</span>
                  {label}
                </button>
              ))}
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 bg-white/3 hover:bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
              >
                <Copy size={14} />
                Copy Code
              </button>
            </div>
          </aside>

          {/* ── CENTER / CANVAS ────────────────────────────────────────────── */}
          <main className="flex-1 overflow-y-auto p-6">
            {!activePage ? (
              <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 p-12 rounded-2xl border-2 border-dashed border-indigo-500/15">
                  <motion.div
                    animate={{ scale: [1, 1.06, 1] }}
                    transition={{ repeat: Infinity, duration: 2.5 }}
                  >
                    <Wand2 size={52} className="text-slate-700" />
                  </motion.div>
                  <p className="text-slate-500 text-lg text-center max-w-xs">
                    {isGenerating
                      ? 'Generating your UI…'
                      : 'Enter a prompt and click Generate UI to start building'}
                  </p>
                  {isGenerating && (
                    <motion.div
                      className="w-48 h-1 rounded-full bg-indigo-500/20 overflow-hidden"
                    >
                      <motion.div
                        className="h-full bg-indigo-500 rounded-full"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                      />
                    </motion.div>
                  )}
                </div>
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
                  <div className="flex flex-col gap-3">
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
                    {activePage.sections.length === 0 && (
                      <div className="py-16 flex flex-col items-center gap-3 text-slate-600">
                        <Layers size={32} />
                        <p className="text-sm">No sections yet. Add one from the left panel.</p>
                      </div>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </main>

          {/* ── RIGHT PANEL ───────────────────────────────────────────────── */}
          <aside className="w-64 flex-shrink-0 overflow-y-auto border-l border-indigo-500/10 p-4 flex flex-col gap-4">

            {/* Version History */}
            <div className="rounded-xl border border-indigo-500/15 bg-slate-900/60 p-4">
              <button
                onClick={() => setShowVersions((v) => !v)}
                className="flex items-center justify-between w-full text-xs font-semibold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <span className="flex items-center gap-1.5"><Clock size={12} />Versions</span>
                {showVersions ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>

              <AnimatePresence>
                {showVersions && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 flex flex-col gap-2">
                      <button
                        onClick={handleSaveVersion}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600/80 hover:bg-indigo-600 text-white transition-colors disabled:opacity-50"
                      >
                        <Save size={13} />
                        {isSaving ? 'Saving…' : 'Save Version'}
                      </button>

                      {/* Compare toggle */}
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setCompareMode((v) => !v)}
                          className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                            compareMode ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300 bg-white/3'
                          }`}
                        >
                          <Eye size={11} className="inline mr-1" />Compare
                        </button>
                        {compareMode && compareIds[0] && compareIds[1] && (
                          <button
                            onClick={handleCompare}
                            className="px-2.5 py-1.5 rounded-lg text-xs bg-emerald-600/80 hover:bg-emerald-600 text-white transition-colors"
                          >
                            Diff
                          </button>
                        )}
                      </div>

                      {diffText && (
                        <pre className="text-xs text-slate-400 bg-black/30 rounded-lg p-2 overflow-auto max-h-32 whitespace-pre-wrap">
                          {diffText}
                        </pre>
                      )}

                      {/* Version list */}
                      <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                        {versions.length === 0 ? (
                          <p className="text-xs text-slate-600 text-center py-2">No versions yet</p>
                        ) : (
                          versions.map((v) => (
                            <div
                              key={v.id}
                              className={`p-2.5 rounded-lg border text-xs transition-colors ${
                                compareMode && (compareIds[0] === v.id || compareIds[1] === v.id)
                                  ? 'border-indigo-500/40 bg-indigo-500/10'
                                  : 'border-white/5 bg-white/3'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-slate-300 font-medium truncate">
                                  v{v.versionNumber} {v.label ? `— ${v.label}` : ''}
                                </span>
                                <div className="flex gap-1">
                                  {compareMode && (
                                    <button
                                      onClick={() => handleVersionCompareSelect(v.id)}
                                      className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                                    >
                                      Sel
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleRestore(v.id)}
                                    className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                  >
                                    Restore
                                  </button>
                                </div>
                              </div>
                              <span className="text-slate-600">{new Date(v.createdAt).toLocaleString()}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Project Actions */}
            <div className="rounded-xl border border-indigo-500/15 bg-slate-900/60 p-4 flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1">Project</p>

              <button
                onClick={handleDuplicate}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
              >
                <Copy size={14} />
                Duplicate Project
              </button>

              <button
                onClick={() => setShowGithubModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
              >
                <Github size={14} />
                Publish to GitHub
              </button>

              <button
                onClick={() => setShowVercelModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
              >
                <Rocket size={14} />
                Deploy to Vercel
              </button>

              <button
                onClick={() => { reset(); localStorage.removeItem('zivo_builder_project_id'); toast.success('Builder reset'); }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 hover:text-red-400 hover:bg-red-500/5 transition-colors"
              >
                <Trash2 size={14} />
                Reset
              </button>
            </div>

            {/* Deploy Status */}
            {deployStatus && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl border p-3 text-sm ${
                  deployStatus.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300' :
                  deployStatus.type === 'error' ? 'border-red-500/30 bg-red-500/5 text-red-300' :
                  'border-blue-500/30 bg-blue-500/5 text-blue-300'
                }`}
              >
                <div className="flex items-start gap-2">
                  {deployStatus.type === 'success' ? <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />}
                  <p>{deployStatus.message}</p>
                </div>
                {deployUrl && (
                  <a href={deployUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 mt-2 text-xs text-emerald-400 hover:underline">
                    <ExternalLink size={11} />
                    Open deployment
                  </a>
                )}
              </motion.div>
            )}

            {/* Download link if no projectId */}
            {!token && (
              <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3 text-xs text-yellow-400">
                <a href="/auth" className="underline hover:text-yellow-300">Sign in</a> to save, version, and deploy your projects.
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* ── GitHub Modal ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showGithubModal && (
          <Modal title="Publish to GitHub" onClose={() => setShowGithubModal(false)}>
            <div className="flex flex-col gap-3">
              <input
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="GitHub Personal Access Token"
                type="password"
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
              />
              <input
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
                placeholder="Repository name (e.g. my-project)"
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
              />
              <div className="flex gap-2 mt-1">
                <button
                  onClick={handlePublishGitHub}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
                >
                  <Github size={15} />
                  Publish
                </button>
                <button
                  onClick={() => setShowGithubModal(false)}
                  className="px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── Vercel Modal ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showVercelModal && (
          <Modal title="Deploy to Vercel" onClose={() => setShowVercelModal(false)}>
            <div className="flex flex-col gap-3">
              <input
                value={vercelToken}
                onChange={(e) => setVercelToken(e.target.value)}
                placeholder="Vercel API Token"
                type="password"
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
              />
              <p className="text-xs text-slate-500">
                Get your token at{' '}
                <a href="https://vercel.com/account/tokens" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                  vercel.com/account/tokens
                </a>
              </p>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={handleDeployVercel}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
                >
                  <Rocket size={15} />
                  Deploy
                </button>
                <button
                  onClick={() => setShowVercelModal(false)}
                  className="px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </SidebarLayout>
  );
}
