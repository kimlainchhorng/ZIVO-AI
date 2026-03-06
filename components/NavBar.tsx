'use client';
import Link from 'next/link';

export default function NavBar() {
  return (
    <nav style={{
      background: '#0f1120',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      padding: '0 24px',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      gap: '24px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <Link href="/" style={{ color: '#6366f1', fontWeight: 700, fontSize: '18px', textDecoration: 'none' }}>ZIVO</Link>
      <Link href="/releases" style={{ color: '#94a3b8', fontSize: '14px', textDecoration: 'none' }}>Releases</Link>
      <Link href="/infrastructure" style={{ color: '#94a3b8', fontSize: '14px', textDecoration: 'none' }}>Infrastructure</Link>
      <Link href="/security" style={{ color: '#94a3b8', fontSize: '14px', textDecoration: 'none' }}>Security</Link>
      <Link href="/canvas" style={{ color: '#94a3b8', fontSize: '14px', textDecoration: 'none' }}>Canvas</Link>
      <Link href="/form-builder" style={{ color: '#94a3b8', fontSize: '14px', textDecoration: 'none' }}>Form Builder</Link>
      <Link href="/chart-builder" style={{ color: '#94a3b8', fontSize: '14px', textDecoration: 'none' }}>Chart Builder</Link>
      <Link href="/nav-builder" style={{ color: '#94a3b8', fontSize: '14px', textDecoration: 'none' }}>Nav Builder</Link>
    </nav>
  );
}
