'use client';
import { useState } from 'react';
import Nav from '../components/nav';

export default function IntegrationsPage() {
  const [githubToken, setGithubToken] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [githubStatus, setGithubStatus] = useState('');
  const [supabaseStatus, setSupabaseStatus] = useState('');

  async function connectGitHub() {
    try {
      const res = await fetch('/api/github/auth');
      const data = await res.json();
      if (data.authUrl) {
        setGithubStatus(`Click to authorize: ${data.authUrl}`);
      } else if (data.error) {
        setGithubStatus(`Error: ${data.error}`);
      }
    } catch { setGithubStatus('Failed to connect to GitHub OAuth'); }
  }

  async function connectSupabase() {
    if (!supabaseUrl || !supabaseKey) { setSupabaseStatus('URL and Key are required'); return; }
    try {
      const res = await fetch('/api/supabase/connect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: supabaseUrl, anonKey: supabaseKey }) });
      const data = await res.json();
      setSupabaseStatus(data.ok ? '✅ Connected to Supabase!' : `❌ ${data.error}`);
    } catch { setSupabaseStatus('Failed to connect to Supabase'); }
  }

  const cardStyle = { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 20 };
  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box' as const, marginBottom: 12 };
  const btnStyle = { padding: '10px 24px', borderRadius: 8, border: 'none', background: '#111', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      <Nav />
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Integrations</h1>
        <p style={{ color: '#64748b', marginBottom: 32 }}>Connect ZIVO AI to external services</p>

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 28 }}>🐙</span>
            <div><h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>GitHub</h2><p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Push code, create PRs, browse repositories</p></div>
          </div>
          {githubStatus && <div style={{ background: '#f0f9ff', color: '#0369a1', padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: 13, wordBreak: 'break-all' }}>{githubStatus}</div>}
          <input style={inputStyle} placeholder="GitHub Personal Access Token (optional)" value={githubToken} onChange={e => setGithubToken(e.target.value)} type="password" />
          <button style={btnStyle} onClick={connectGitHub}>Connect GitHub OAuth</button>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 28 }}>🗄️</span>
            <div><h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Supabase</h2><p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Connect your database for project storage and auth</p></div>
          </div>
          {supabaseStatus && <div style={{ background: '#f0fdf4', color: '#166534', padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{supabaseStatus}</div>}
          <input style={inputStyle} placeholder="Supabase Project URL (e.g. https://xxxx.supabase.co)" value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)} />
          <input style={inputStyle} placeholder="Supabase Anon Key" value={supabaseKey} onChange={e => setSupabaseKey(e.target.value)} type="password" />
          <button style={btnStyle} onClick={connectSupabase}>Connect Supabase</button>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 28 }}>📊</span>
            <div><h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Analytics</h2><p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Track usage and project metrics</p></div>
          </div>
          <a href="/dashboard" style={{ ...btnStyle, display: 'inline-block', textDecoration: 'none' }}>View Analytics Dashboard</a>
        </div>
      </main>
    </div>
  );
}
