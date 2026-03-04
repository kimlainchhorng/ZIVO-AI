'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const COLORS = {
  bg: "#0a0b14",
  bgPanel: "#0f1120",
  border: "rgba(255,255,255,0.08)",
  accent: "#6366f1",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
};

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/logs', label: 'Logs' },
  { href: '/health', label: 'Health' },
  { href: '/secrets', label: 'Secrets' },
  { href: '/config', label: 'Config' },
  { href: '/permissions', label: 'Permissions' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav style={{
      background: COLORS.bgPanel,
      borderBottom: `1px solid ${COLORS.border}`,
      padding: '0 32px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      height: '56px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <Link href="/" style={{ marginRight: '24px', textDecoration: 'none' }}>
        <span style={{ color: COLORS.accent, fontWeight: 700, fontSize: '18px', letterSpacing: '-0.5px' }}>
          ZIVO<span style={{ color: COLORS.textPrimary }}> AI</span>
        </span>
      </Link>
      {NAV_LINKS.map((link) => {
        const active = pathname === link.href || pathname.startsWith(link.href + '/');
        return (
          <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
            <span style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: active ? 600 : 400,
              color: active ? COLORS.textPrimary : COLORS.textSecondary,
              background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
              transition: 'all 0.15s',
              cursor: 'pointer',
            }}>
              {link.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
