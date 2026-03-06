'use client';

import { Sidebar } from '@/components/layout/Sidebar';

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0f' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: '220px', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}
