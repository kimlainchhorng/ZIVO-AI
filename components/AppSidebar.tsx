'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Layers,
  Wand2,
  Smartphone,
  Code2,
  Package,
  Palette,
  Paintbrush,
  Grid,
  Sparkles,
  Image,
  Shield,
  FileText,
  MessageSquare,
  Zap,
  Activity,
  BarChart2,
  Store,
  ShieldCheck,
  Eye,
  HelpCircle,
  MessageCircle,
  Play,
  Globe,
  Monitor,
  Layout,
  MousePointer,
  ChevronDown,
  ChevronRight,
  Home,
  Database,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'build',
    title: 'Build',
    items: [
      { label: 'AI Builder', href: '/ai', icon: Wand2 },
      { label: 'UI Builder', href: '/ui-builder', icon: Layers },
      { label: 'Schema Designer', href: '/schema-designer', icon: Code2 },
      { label: 'Builder', href: '/builder', icon: Home },
      { label: 'Visual Builder', href: '/visual-builder', icon: Layers },
      { label: 'Project Wizard', href: '/project-wizard', icon: Wand2 },
      { label: 'Mobile Pipeline', href: '/mobile-pipeline', icon: Smartphone },
      { label: 'AI Code Review', href: '/ai-code-review', icon: Code2 },
      { label: 'Template Marketplace', href: '/template-marketplace', icon: Package },
    ],
  },
  {
    id: 'data',
    title: 'Data & APIs',
    items: [
      { label: 'Schema Designer', href: '/schema-designer', icon: Database },
      { label: 'API Generator', href: '/api-generator', icon: Zap },
      { label: 'Webhook Inspector', href: '/webhook-inspector', icon: Activity },
      { label: 'API Client Generator', href: '/api-client', icon: Globe },
    ],
  },
  {
    id: 'design',
    title: 'Design',
    items: [
      { label: 'Design Tokens', href: '/design-tokens', icon: Palette },
      { label: 'Theme Editor', href: '/theme-editor', icon: Paintbrush },
      { label: 'Icon Library', href: '/icon-library', icon: Grid },
      { label: 'Animation Editor', href: '/animation-editor', icon: Sparkles },
      { label: 'Asset Manager', href: '/asset-manager', icon: Image },
    ],
  },
  {
    id: 'ai-tools',
    title: 'AI Tools',
    items: [
      { label: 'AI Code Review', href: '/ai-code-review', icon: Code2 },
      { label: 'AI Security Review', href: '/ai-code-review', icon: Shield },
      { label: 'Spec Generator', href: '/spec-generator', icon: FileText },
      { label: 'Prompt Templates', href: '/prompt-templates', icon: MessageSquare },
      { label: 'Interaction Builder', href: '/interaction-builder', icon: Zap },
    ],
  },
  {
    id: 'devops',
    title: 'DevOps',
    items: [
      { label: 'Webhook Inspector', href: '/webhook-inspector', icon: Activity },
      { label: 'Status Page', href: '/status', icon: Activity },
      { label: 'Performance Panel', href: '/performance-panel', icon: BarChart2 },
      { label: 'Component Marketplace', href: '/component-marketplace', icon: Store },
    ],
  },
  {
    id: 'security',
    title: 'Security',
    items: [
      { label: 'Policy Guardrails', href: '/policy', icon: ShieldCheck },
      { label: 'A11y Checker', href: '/a11y-checker', icon: Eye },
    ],
  },
  {
    id: 'enterprise',
    title: 'Enterprise',
    items: [
      { label: 'Help Center', href: '/help-center', icon: HelpCircle },
      { label: 'User Feedback', href: '/user-feedback', icon: MessageCircle },
      { label: 'Session Replay', href: '/session-replay', icon: Play },
    ],
  },
  {
    id: 'localization',
    title: 'Localization',
    items: [
      { label: 'i18n Editor', href: '/i18n-editor', icon: Globe },
    ],
  },
  {
    id: 'preview',
    title: 'Preview',
    items: [
      { label: 'Device Preview', href: '/device-preview', icon: Monitor },
      { label: 'Device Grid', href: '/device-grid', icon: Layout },
      { label: 'UX Heatmap', href: '/ux-heatmap', icon: MousePointer },
    ],
  },
];

const STORAGE_KEY = 'zivo-sidebar-collapsed';

/** Default collapsed state: all groups collapsed except 'build'. */
function getDefaultCollapsedState(): Record<string, boolean> {
  const state: Record<string, boolean> = {};
  for (const group of NAV_GROUPS) {
    state[group.id] = group.id !== 'build';
  }
  return state;
}

function readCollapsedState(): Record<string, boolean> {
  if (typeof window === 'undefined') return getDefaultCollapsedState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : getDefaultCollapsedState();
  } catch {
    return getDefaultCollapsedState();
  }
}

function writeCollapsedState(state: Record<string, boolean>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / security errors
  }
}

export default function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => readCollapsedState());
  const [search, setSearch] = useState('');

  function toggleGroup(id: string) {
    setCollapsed((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      writeCollapsedState(next);
      return next;
    });
  }

  const query = search.trim().toLowerCase();

  /** When searching, flatten all groups into a single filtered list. */
  const filteredGroups = query
    ? NAV_GROUPS.map((g) => ({
        ...g,
        items: g.items.filter((item) => item.label.toLowerCase().includes(query)),
      })).filter((g) => g.items.length > 0)
    : NAV_GROUPS;

  const hasResults = filteredGroups.length > 0;

  return (
    <aside
      style={{
        width: 240,
        minWidth: 240,
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        backgroundColor: '#0a0a0a',
        borderRight: '1px solid #1f1f1f',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        overflowY: 'auto',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid #1f1f1f',
          flexShrink: 0,
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: '#6366f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={18} color="#fff" />
          </div>
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.3px',
            }}
          >
            ZIVO<span style={{ color: '#6366f1' }}>-AI</span>
          </span>
        </Link>

        {/* Search */}
        <div style={{ position: 'relative', marginTop: 12 }}>
          <input
            className="zivo-sidebar-search"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search navigation"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              aria-label="Clear search"
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                padding: 0,
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          padding: '12px 8px',
          overflowY: 'auto',
        }}
      >
        {!hasResults && (
          <div style={{ padding: '8px', color: '#475569', fontSize: 13, textAlign: 'center' }}>
            No results
          </div>
        )}

        {filteredGroups.map((group) => {
          const isCollapsed = query ? false : !!collapsed[group.id];

          return (
            <div key={group.id} style={{ marginBottom: 4 }}>
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  color: '#6b7280',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = '#6b7280';
                }}
              >
                <span>{group.title}</span>
                {isCollapsed ? (
                  <ChevronRight size={13} />
                ) : (
                  <ChevronDown size={13} />
                )}
              </button>

              {/* Group items */}
              <div
                style={{
                  overflow: 'hidden',
                  maxHeight: isCollapsed ? 0 : 1000,
                  transition: 'max-height 0.2s ease',
                }}
              >
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={`${group.id}-${item.href}-${item.label}`}
                      href={item.href}
                      title={item.label}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '7px 8px',
                        borderRadius: 6,
                        textDecoration: 'none',
                        color: isActive ? '#818cf8' : '#9ca3af',
                        backgroundColor: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                        fontSize: 13,
                        fontWeight: isActive ? 500 : 400,
                        transition: 'background-color 0.15s ease, color 0.15s ease',
                        marginBottom: 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          const el = e.currentTarget as HTMLAnchorElement;
                          el.style.backgroundColor = '#1a1a2e';
                          el.style.color = '#ffffff';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          const el = e.currentTarget as HTMLAnchorElement;
                          el.style.backgroundColor = 'transparent';
                          el.style.color = '#9ca3af';
                        }
                      }}
                    >
                      <Icon
                        size={15}
                        style={{ flexShrink: 0, opacity: isActive ? 1 : 0.75 }}
                      />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid #1f1f1f',
          flexShrink: 0,
          color: '#4b5563',
          fontSize: 11,
        }}
      >
        ZIVO-AI © {new Date().getFullYear()}
      </div>
    </aside>
  );
}
