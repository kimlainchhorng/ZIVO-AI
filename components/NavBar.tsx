'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/ai', label: 'Builder' },
  { href: '/templates', label: 'Templates' },
  { href: '/components', label: 'Components' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/projects', label: 'Projects' },
  { href: '/schema-designer', label: 'Schema' },
  { href: '/workflow', label: 'Workflow' },
] as const;

interface NavBarProps {
  className?: string;
  /** Extra right-side content (e.g. user avatar, sign-in button) */
  right?: React.ReactNode;
}

export function NavBar({ className, right }: NavBarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [mobileOpen]);

  return (
    <header
      className={cn(
        'relative flex h-12 shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#0a0b14] px-6',
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <Link href="/ai" className="flex items-center gap-2.5 no-underline">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
            Z
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-100">ZIVO AI</span>
        </Link>

        <div className="mx-1 h-5 w-px bg-white/10" aria-hidden="true" />

        {/* Desktop nav */}
        <nav aria-label="Main navigation" className="hidden items-center gap-0.5 md:flex">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors no-underline',
                pathname === href || pathname.startsWith(href + '/')
                  ? 'bg-white/10 text-slate-100'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          className="flex items-center justify-center rounded-md p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200 md:hidden"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Right slot */}
      {right && <div className="flex items-center gap-2">{right}</div>}

      {/* Mobile dropdown */}
      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          style={{
            position: 'absolute',
            top: '48px',
            left: 0,
            right: 0,
            background: '#0a0b14',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            padding: '0.5rem 1rem',
            gap: '0.25rem',
          }}
        >
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors no-underline',
                pathname === href || pathname.startsWith(href + '/')
                  ? 'bg-white/10 text-slate-100'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
