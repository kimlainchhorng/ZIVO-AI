'use client';

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

const NAV_LINKS = [
  { href: '/ai', label: 'Builder' },
  { href: '/workflow', label: 'Workflow' },
  { href: '/templates', label: 'Templates' },
  { href: '/history', label: 'History' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <>
      <style>{`
        .znav-link:hover { color: #f1f5f9 !important; }
        .znav-hamburger-menu { display: none; }
        @media (max-width: 640px) {
          .znav-links { display: none !important; }
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
        zIndex: 50,
      }}>
        {/* Left: Logo + Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <a href="/ai" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
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
          <nav className="znav-links" style={{ display: 'flex', gap: '0.25rem' }}>
            {NAV_LINKS.map(({ href, label }) => {
              const isActive = pathname === href || (href !== '/ai' && pathname.startsWith(href));
              return (
                <a
                  key={href}
                  href={href}
                  className="znav-link"
                  style={{
                    padding: '0.25rem 0.75rem',
                    background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                    color: isActive ? COLORS.accent : COLORS.textSecondary,
                    borderRadius: '6px',
                    border: isActive ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    transition: 'color 0.15s',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  {label}
                </a>
              );
            })}
          </nav>
          {/* Mobile hamburger placeholder */}
          <div className="znav-hamburger-menu" style={{ display: 'none', alignItems: 'center' }}>
            <span style={{ color: COLORS.textSecondary, fontSize: '1.25rem', cursor: 'pointer' }}>☰</span>
          </div>
        </div>

        {/* Right: Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
          <span style={{ fontSize: '0.75rem', color: COLORS.textSecondary }}>Ready</span>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: COLORS.accentGradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.875rem', color: '#fff',
          }}>Z</div>
        </div>
      </div>
    </>
  );
}
