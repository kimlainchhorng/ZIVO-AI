'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const COLORS = {
  bgPanel: "#0f1120",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  accent: "#6366f1",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
};

interface PaletteItem {
  icon: string;
  label: string;
  description: string;
  href: string;
  section: string;
}

const ALL_ITEMS: PaletteItem[] = [
  // Pages – Builder
  { icon: '🤖', label: 'AI Studio', description: 'Build apps with AI', href: '/ai', section: 'Pages' },
  { icon: '🎨', label: 'Canvas Builder', description: 'Visual drag-and-drop builder', href: '/canvas', section: 'Pages' },
  { icon: '📋', label: 'Form Builder', description: 'Build forms visually', href: '/form-builder', section: 'Pages' },
  { icon: '📊', label: 'Chart Builder', description: 'Create data visualizations', href: '/chart-builder', section: 'Pages' },
  { icon: '⚡', label: 'Workflow', description: 'Automate workflows', href: '/workflow', section: 'Pages' },
  { icon: '📁', label: 'Templates', description: 'Browse templates', href: '/templates', section: 'Pages' },
  { icon: '🧭', label: 'Nav Builder', description: 'Build navigation menus', href: '/nav-builder', section: 'Pages' },
  // Pages – AI Tools
  { icon: '🧠', label: 'Agent Studio', description: 'Multi-agent orchestration', href: '/agent-studio', section: 'Pages' },
  { icon: '✏️', label: 'Prompt Studio', description: 'Engineer and version prompts', href: '/prompt-studio', section: 'Pages' },
  { icon: '📚', label: 'Prompt Library', description: 'Browse saved prompts', href: '/prompt-library', section: 'Pages' },
  { icon: '🗂️', label: 'Context Manager', description: 'Manage project knowledge base', href: '/context-manager', section: 'Pages' },
  { icon: '🔀', label: 'Model Router', description: 'Route tasks to optimal models', href: '/model-router', section: 'Pages' },
  // Pages – Analytics
  { icon: '📈', label: 'Analytics', description: 'Usage and cost dashboard', href: '/analytics', section: 'Pages' },
  { icon: '🔍', label: 'Logs', description: 'Log explorer and error tracking', href: '/logs', section: 'Pages' },
  { icon: '🕐', label: 'History', description: 'Build history', href: '/history', section: 'Pages' },
  { icon: '💚', label: 'Health', description: 'System health checks', href: '/health', section: 'Pages' },
  // Pages – DevOps
  { icon: '🚀', label: 'Releases', description: 'Release manager and deploy', href: '/releases', section: 'Pages' },
  { icon: '☁️', label: 'Infrastructure', description: 'Cloud resource manager', href: '/infrastructure', section: 'Pages' },
  { icon: '💾', label: 'Backup', description: 'Backup and restore snapshots', href: '/backup', section: 'Pages' },
  // Pages – Dev Tools
  { icon: '🔌', label: 'API Inspector', description: 'Test and mock API routes', href: '/api-inspector', section: 'Pages' },
  { icon: '⚙️', label: 'SDK Generator', description: 'Generate SDK code', href: '/sdk', section: 'Pages' },
  { icon: '🗄️', label: 'Migrations', description: 'Database migrations and explorer', href: '/migrations', section: 'Pages' },
  { icon: '👁️', label: 'Preview', description: 'Multi-platform preview', href: '/preview', section: 'Pages' },
  { icon: '♿', label: 'Accessibility', description: 'WCAG accessibility checker', href: '/a11y', section: 'Pages' },
  { icon: '🌍', label: 'Localization', description: 'i18n translation manager', href: '/i18n', section: 'Pages' },
  // Pages – Settings
  { icon: '⚙️', label: 'Config', description: 'Config editor and feature flags', href: '/config', section: 'Pages' },
  { icon: '🔐', label: 'Secrets', description: 'API key and secrets vault', href: '/secrets', section: 'Pages' },
  { icon: '🛡️', label: 'Permissions', description: 'RBAC and roles', href: '/permissions', section: 'Pages' },
  { icon: '🔒', label: 'Security', description: 'Security dashboard', href: '/security', section: 'Pages' },
  { icon: '🧩', label: 'Plugins', description: 'Plugin and extension system', href: '/plugins', section: 'Pages' },
  // Pages – Collaboration
  { icon: '🤝', label: 'Workspace', description: 'Shared workspaces', href: '/workspace', section: 'Pages' },
  { icon: '📌', label: 'Tasks', description: 'Kanban task board', href: '/tasks', section: 'Pages' },
  // Pages – Other
  { icon: '🛒', label: 'Marketplace', description: 'Components and plugins', href: '/marketplace', section: 'Pages' },
  { icon: '🌟', label: 'Showcase', description: 'Community projects', href: '/showcase', section: 'Pages' },
  { icon: '📊', label: 'Dashboard', description: 'Overview dashboard', href: '/dashboard', section: 'Pages' },
  { icon: '🔗', label: 'Connectors', description: 'App integrations', href: '/connectors', section: 'Pages' },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const openPalette = useCallback(() => {
    setOpen(true);
    setQuery('');
    setSelectedIdx(0);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openPalette();
      }
    };
    const onCustomEvent = () => openPalette();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('zivo:open-command-palette', onCustomEvent);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('zivo:open-command-palette', onCustomEvent);
    };
  }, [openPalette]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const filtered = query.trim()
    ? ALL_ITEMS.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase())
      )
    : ALL_ITEMS;

  const sections = Array.from(new Set(filtered.map((i) => i.section)));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && filtered[selectedIdx]) {
      window.location.href = filtered[selectedIdx].href;
      setOpen(false);
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '10vh',
      }}
      onClick={() => setOpen(false)}
    >
      <div
        style={{
          width: '100%', maxWidth: '560px',
          background: COLORS.bgPanel,
          border: `1px solid ${COLORS.border}`,
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '0.75rem 1rem', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span style={{ fontSize: '1rem', opacity: 0.5 }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIdx(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, actions, commands…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: COLORS.textPrimary, fontSize: '0.9375rem',
            }}
          />
          <kbd style={{ fontSize: '0.7rem', color: COLORS.textMuted, background: COLORS.bgCard, padding: '2px 6px', borderRadius: '4px', border: `1px solid ${COLORS.border}` }}>Esc</kbd>
        </div>
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {filtered.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: COLORS.textMuted, fontSize: '0.875rem' }}>No results for &quot;{query}&quot;</div>
          )}
          {sections.map((section) => {
            const sectionItems = filtered.filter((i) => i.section === section);
            return (
              <div key={section}>
                <div style={{ padding: '0.5rem 1rem 0.25rem', fontSize: '0.6875rem', fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{section}</div>
                {sectionItems.map((item) => {
                  const globalIdx = filtered.indexOf(item);
                  const isSelected = globalIdx === selectedIdx;
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.5rem 1rem',
                        background: isSelected ? 'rgba(99,102,241,0.15)' : 'transparent',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={() => setSelectedIdx(globalIdx)}
                    >
                      <span style={{ fontSize: '1.125rem', width: '24px', textAlign: 'center' }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize: '0.875rem', color: COLORS.textPrimary, fontWeight: 500 }}>{item.label}</div>
                        <div style={{ fontSize: '0.75rem', color: COLORS.textSecondary }}>{item.description}</div>
                      </div>
                    </a>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div style={{ padding: '0.5rem 1rem', borderTop: `1px solid ${COLORS.border}`, display: 'flex', gap: '1rem', fontSize: '0.7rem', color: COLORS.textMuted }}>
          <span>↑↓ navigate</span><span>↵ open</span><span>Esc close</span>
        </div>
      </div>
    </div>
  );
}
