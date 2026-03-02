'use client';
import { useState, useEffect } from 'react';
import Nav from '../components/nav';

interface Build { id: string; status: string; duration: number; timestamp: string; logs: string[]; previewUrl?: string }

export default function BuildLogsPage() {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [selected, setSelected] = useState<Build | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadBuilds(); }, []);

  async function loadBuilds() {
    try {
      const res = await fetch('/api/build');
      const data = await res.json();
      setBuilds(data.builds || []);
    } catch {}
    setLoading(false);
  }

  const statusColor: Record<string, string> = { success: '#16a34a', failed: '#dc2626', running: '#ca8a04' };
  const statusBg: Record<string, string> = { success: '#dcfce7', failed: '#fee2e2', running: '#fef9c3' };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      <Nav />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div><h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Build Logs</h1><p style={{ color: '#64748b', margin: '4px 0 0' }}>History of build runs and deployments</p></div>
          <button onClick={loadBuilds} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 14 }}>🔄 Refresh</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 20 }}>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            {loading ? <p style={{ padding: 24, color: '#94a3b8' }}>Loading builds...</p> : builds.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏗️</div>
                <div>No builds yet. Generate and build a site to see logs here.</div>
              </div>
            ) : builds.map(build => (
              <div key={build.id} onClick={() => setSelected(selected?.id === build.id ? null : build)} style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: selected?.id === build.id ? '#f0f9ff' : 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600 }}>{build.id}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{new Date(build.timestamp).toLocaleString()}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ background: statusBg[build.status], color: statusColor[build.status], padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{build.status}</span>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{build.duration}ms</span>
                </div>
              </div>
            ))}
          </div>

          {selected && (
            <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, color: '#e2e8f0', overflow: 'auto', maxHeight: 500 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 700, color: '#94a3b8', fontSize: 13 }}>Build Logs: {selected.id}</span>
                <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18 }}>✕</button>
              </div>
              {selected.logs.map((log, i) => <div key={i} style={{ fontFamily: 'monospace', fontSize: 12, marginBottom: 4, color: log.includes('[WARN]') ? '#fbbf24' : log.includes('error') ? '#f87171' : '#86efac' }}>{log}</div>)}
              {selected.previewUrl && <a href={selected.previewUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 12, padding: '6px 16px', background: '#3b82f6', color: '#fff', borderRadius: 6, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>🔗 View Preview</a>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
