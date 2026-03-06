'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, ImageIcon, FolderKanban, Rocket } from 'lucide-react';

const navItems = [
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/ai-ui-builder', label: 'AI UI Builder', icon: Layers },
  { href: '/ai-image-studio', label: 'Image Studio', icon: ImageIcon },
  { href: '/deploy', label: 'Deployments', icon: Rocket },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: '220px',
        minHeight: '100vh',
        background: 'rgba(15,15,26,0.98)',
        borderRight: '1px solid rgba(99,102,241,0.15)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem 0',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 40,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '0 1.25rem 1.5rem', borderBottom: '1px solid rgba(99,102,241,0.15)' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#818cf8', letterSpacing: '-0.02em' }}>
            ZIVO<span style={{ color: '#6366f1' }}>-AI</span>
          </span>
        </Link>
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.625rem 0.75rem',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#818cf8' : '#94a3b8',
                background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(99,102,241,0.15)' }}>
        <Link href="/ai" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>← Classic Builder</span>
        </Link>
      </div>
    </aside>
  );
}
