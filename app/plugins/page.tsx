'use client';
import { useState, useEffect } from 'react';
import Nav from '../components/nav';

interface Plugin { id: string; name: string; version: string; description: string; author: string; enabled: boolean }

export default function PluginsPage() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => { loadPlugins(); }, []);

  async function loadPlugins() {
    setLoading(true);
    try {
      const res = await fetch('/api/plugins');
      const data = await res.json();
      setPlugins(data.plugins || []);
    } catch { setMsg('Failed to load plugins'); }
    setLoading(false);
  }

  async function toggle(id: string, enabled: boolean) {
    const res = await fetch('/api/plugins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: enabled ? 'disable' : 'enable', id }) });
    const data = await res.json();
    if (data.ok) { setMsg(`Plugin ${enabled ? 'disabled' : 'enabled'}`); loadPlugins(); }
    else setMsg(data.error || 'Failed');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      <Nav />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Plugin Marketplace</h1>
        <p style={{ color: '#64748b', marginBottom: 24 }}>Extend ZIVO AI with plugins and integrations</p>
        {msg && <div style={{ background: '#dbeafe', color: '#1e40af', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{msg}</div>}
        {loading ? <p style={{ color: '#94a3b8' }}>Loading plugins...</p> : (
          <div style={{ display: 'grid', gap: 16 }}>
            {plugins.map(plugin => (
              <div key={plugin.id} style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{plugin.name} <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>v{plugin.version}</span></div>
                  <div style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>{plugin.description}</div>
                  <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>by {plugin.author}</div>
                </div>
                <button onClick={() => toggle(plugin.id, plugin.enabled)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: plugin.enabled ? '#ef4444' : '#3b82f6', color: '#fff', fontWeight: 600, cursor: 'pointer', minWidth: 90 }}>
                  {plugin.enabled ? 'Disable' : 'Enable'}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
