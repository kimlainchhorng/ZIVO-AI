'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';

const COLORS = {
  bg: "#0a0b14",
  bgPanel: "#0f1120",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#475569",
};

const NAV_GROUPS = [
  {
    label: 'Builder',
    items: [
      { href: '/ai', label: '🤖 AI Studio' },
      { href: '/canvas', label: '🎨 Canvas' },
      { href: '/form-builder', label: '📋 Forms' },
      { href: '/chart-builder', label: '📊 Charts' },
      { href: '/workflow', label: '⚡ Workflow' },
      { href: '/templates', label: '📁 Templates' },
    ],
  },
  {
    label: 'AI Tools',
    items: [
      { href: '/agent-studio', label: '🧠 Agents' },
      { href: '/prompt-studio', label: '✏️ Prompts' },
      { href: '/prompt-library', label: '📚 Library' },
      { href: '/context-manager', label: '🗂️ Context' },
      { href: '/model-router', label: '🔀 Models' },
    ],
  },
  {
    label: 'DevOps',
    items: [
      { href: '/releases', label: '🚀 Releases' },
      { href: '/infrastructure', label: '☁️ Infra' },
      { href: '/health', label: '💚 Health' },
      { href: '/backup', label: '💾 Backup' },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { href: '/analytics', label: '📈 Analytics' },
      { href: '/logs', label: '🔍 Logs' },
      { href: '/history', label: '🕐 History' },
    ],
  },
  {
    label: 'Dev Tools',
    items: [
      { href: '/api-inspector', label: '🔌 API Inspector' },
      { href: '/sdk', label: '⚙️ SDK' },
      { href: '/migrations', label: '🗄️ Migrations' },
      { href: '/preview', label: '👁️ Preview' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { href: '/config', label: '⚙️ Config' },
      { href: '/secrets', label: '🔐 Secrets' },
      { href: '/permissions', label: '🛡️ RBAC' },
      { href: '/security', label: '🔒 Security' },
      { href: '/plugins', label: '🧩 Plugins' },
    ],
  },
const NAV_LINKS = [
  { href: '/ai', label: 'Builder' },
  { href: '/workflow', label: 'Workflow' },
  { href: '/templates', label: 'Templates' },
  { href: '/components', label: 'Components' },
  { href: '/deploy', label: 'Deploy' },
  { href: '/plugins', label: 'Plugins' },
  { href: '/database-builder', label: 'Database' },
  { href: '/api-generator', label: 'API Gen' },
  { href: '/auth-builder', label: 'Auth' },
  { href: '/visual-builder', label: 'Visual' },
  { href: '/history', label: 'History' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/onboarding', label: 'Get Started' },
];

export default function NavBar() {
  const pathname = usePathname();
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const handleCmdK = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('zivo:open-command-palette'));
    }
  };

  return (
    <>
      <style>{`
        .znav-link:hover { color: #f1f5f9 !important; }
        .znav-group-btn:hover { color: #f1f5f9 !important; background: rgba(255,255,255,0.06) !important; }
        .znav-dropdown-item:hover { background: rgba(99,102,241,0.12) !important; color: #f1f5f9 !important; }
        .znav-hamburger-menu { display: none; }
        @media (max-width: 900px) {
          .znav-groups { display: none !important; }
          .znav-hamburger-menu { display: flex !important; }
        }
      `}</style>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        height: '52px',
        borderBottom: `1px solid ${COLORS.border}`,
        background: COLORS.bgPanel,
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {/* Left: Logo + Nav Groups */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <a href="/ai" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', marginRight: '0.5rem' }}>
            <div style={{
              width: '28px', height: '28px',
              background: COLORS.accentGradient,
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: 700, color: '#fff',
            }}>Z</div>
            <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.01em', color: COLORS.textPrimary }}>ZIVO AI</span>
          </a>
          <div style={{ width: '1px', height: '20px', background: COLORS.border, margin: '0 0.25rem' }} />
          <nav className="znav-groups" style={{ display: 'flex', gap: '0.125rem' }}>
            {NAV_GROUPS.map((group) => {
              const isGroupActive = group.items.some(
                (item) => pathname === item.href || (item.href !== '/ai' && pathname.startsWith(item.href))
              );
              const isOpen = openGroup === group.label;
              return (
                <div
                  key={group.label}
                  style={{ position: 'relative' }}
                  onMouseEnter={() => setOpenGroup(group.label)}
                  onMouseLeave={() => setOpenGroup(null)}
                >
                  <button
                    className="znav-group-btn"
                    onClick={() => setOpenGroup(isOpen ? null : group.label)}
                    style={{
                      padding: '0.25rem 0.625rem',
                      background: isGroupActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                      color: isGroupActive ? COLORS.accent : COLORS.textSecondary,
                      borderRadius: '6px',
                      border: isGroupActive ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                      cursor: 'pointer',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      transition: 'color 0.15s, background 0.15s',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    {group.label}
                    <span style={{ fontSize: '0.625rem', opacity: 0.6 }}>{isOpen ? '▲' : '▼'}</span>
                  </button>
                  {isOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: '4px',
                      background: COLORS.bgPanel,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '8px',
                      padding: '0.375rem',
                      minWidth: '180px',
                      zIndex: 200,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    }}>
                      {group.items.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/ai' && pathname.startsWith(item.href));
                        return (
                          <a
                            key={item.href}
                            href={item.href}
                            className="znav-dropdown-item"
                            style={{
                              display: 'block',
                              padding: '0.375rem 0.625rem',
                              color: isActive ? COLORS.accent : COLORS.textSecondary,
                              textDecoration: 'none',
                              fontSize: '0.8125rem',
                              borderRadius: '5px',
                              background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                              transition: 'background 0.1s, color 0.1s',
                            }}
                          >
                            {item.label}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
          {/* Mobile hamburger */}
          <div className="znav-hamburger-menu" style={{ display: 'none', alignItems: 'center' }}>
            <span style={{ color: COLORS.textSecondary, fontSize: '1.25rem', cursor: 'pointer' }}>☰</span>
          </div>
        </div>

        {/* Right: ⌘K + Status + Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={handleCmdK}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.25rem 0.625rem',
              background: COLORS.bgCard,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '6px',
              color: COLORS.textMuted,
              fontSize: '0.75rem',
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
          >
            <span>⌘K</span>
          </button>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
          <span style={{ fontSize: '0.75rem', color: COLORS.textSecondary }}>Ready</span>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: COLORS.accentGradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.875rem', color: '#fff',
            cursor: 'pointer',
          }}>Z</div>
        </div>
      </div>
    </>
  );
}
