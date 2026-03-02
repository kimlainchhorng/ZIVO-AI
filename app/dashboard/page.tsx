'use client';
import { useState, useEffect } from 'react';
import Nav from '../components/nav';

interface Stats { total: number; today: number; thisWeek: number; byType: { sitesGenerated: number; buildsCompleted: number; codeScans: number } }

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [builds, setBuilds] = useState<{ id: string; status: string; duration: number; timestamp: string }[]>([]);

  useEffect(() => {
    fetch('/api/analytics').then(r => r.json()).then(d => setStats(d.stats)).catch(() => {});
    fetch('/api/build').then(r => r.json()).then(d => setBuilds(d.builds || [])).catch(() => {});
  }, []);

  const cards = [
    { label: 'Sites Generated', value: stats?.byType.sitesGenerated ?? 0, icon: '🌐', color: '#3b82f6' },
    { label: 'Builds Completed', value: stats?.byType.buildsCompleted ?? 0, icon: '🏗️', color: '#10b981' },
    { label: 'Code Scans', value: stats?.byType.codeScans ?? 0, icon: '🔍', color: '#f59e0b' },
    { label: 'Events Today', value: stats?.today ?? 0, icon: '📈', color: '#8b5cf6' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      <Nav />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Dashboard</h1>
        <p style={{ color: '#64748b', marginBottom: 32 }}>Overview of your ZIVO AI projects and activity</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20, marginBottom: 40 }}>
          {cards.map(card => (
            <div key={card.label} style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderLeft: `4px solid ${card.color}` }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{card.icon}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: card.color }}>{card.value}</div>
              <div style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>{card.label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Recent Builds</h2>
          {builds.length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '24px 0' }}>No builds yet. Generate a site to get started!</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Build ID', 'Status', 'Duration', 'Timestamp'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: 13, fontWeight: 600 }}>{h}</th>)}</tr></thead>
              <tbody>{builds.slice(0, 10).map((b) => (
                <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 13 }}>{b.id}</td>
                  <td style={{ padding: '10px 12px' }}><span style={{ background: b.status === 'success' ? '#dcfce7' : '#fee2e2', color: b.status === 'success' ? '#16a34a' : '#dc2626', padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>{b.status}</span></td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: '#475569' }}>{b.duration}ms</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: '#94a3b8' }}>{new Date(b.timestamp).toLocaleString()}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>

        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {[
            { href: '/ai', title: '🤖 AI Builder', desc: 'Generate websites with AI' },
            { href: '/plugins', title: '🔌 Plugins', desc: 'Manage extensions and marketplace' },
            { href: '/integrations', title: '🔗 Integrations', desc: 'GitHub and Supabase connections' },
            { href: '/security', title: '🔒 Security Audit', desc: 'Scan and fix code vulnerabilities' },
          ].map(link => (
            <a key={link.href} href={link.href} style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{link.title}</div>
              <div style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>{link.desc}</div>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
