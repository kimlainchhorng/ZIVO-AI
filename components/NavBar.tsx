'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
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

  return (
    <header
      className={cn(
        'flex h-12 shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#0a0b14] px-6 relative',
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
        <nav aria-label="Main navigation" className="hidden sm:flex gap-0.5">
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
      </div>

      {/* Right slot + mobile toggle */}
      <div className="flex items-center gap-2">
        {right && <div className="flex items-center gap-2">{right}</div>}
        {/* Hamburger button — visible only on mobile */}
        <button
          className="sm:hidden flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors border-0 bg-transparent cursor-pointer"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
        >
          ☰
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="sm:hidden absolute top-12 left-0 right-0 z-50 border-b border-white/[0.08] bg-[#0a0b14] px-4 py-3 flex flex-col gap-1"
        >
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
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
