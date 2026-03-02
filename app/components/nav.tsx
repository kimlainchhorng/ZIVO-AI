'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: '📊 Dashboard' },
  { href: '/ai', label: '🤖 AI Builder' },
  { href: '/plugins', label: '🔌 Plugins' },
  { href: '/integrations', label: '🔗 Integrations' },
  { href: '/security', label: '🔒 Security' },
  { href: '/build-logs', label: '🏗️ Build Logs' },
  { href: '/settings', label: '⚙️ Settings' },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav style={{ background: '#111', color: '#fff', padding: '12px 24px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 900, fontSize: 18, marginRight: 16 }}>ZIVO AI</Link>
      {navItems.map(item => (
        <Link key={item.href} href={item.href} style={{
          color: pathname?.startsWith(item.href) ? '#60a5fa' : '#ccc',
          textDecoration: 'none', fontSize: 14, padding: '4px 8px', borderRadius: 6,
          background: pathname?.startsWith(item.href) ? 'rgba(96,165,250,0.15)' : 'transparent',
        }}>{item.label}</Link>
      ))}
    </nav>
  );
}
