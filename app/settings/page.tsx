'use client';
import { useState } from 'react';
import Nav from '../components/nav';

export default function SettingsPage() {
  const [model, setModel] = useState('gpt-4.1-mini');
  const [maxTokens, setMaxTokens] = useState('4000');
  const [autoBuild, setAutoBuild] = useState(false);
  const [autoScan, setAutoScan] = useState(true);
  const [saved, setSaved] = useState(false);

  function save() {
    localStorage.setItem('zivo_settings', JSON.stringify({ model, maxTokens, autoBuild, autoScan }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const inputStyle = { padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, width: '100%', boxSizing: 'border-box' as const };
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 } as const;
  const cardStyle = { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 20 };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      <Nav />
      <main style={{ maxWidth: 700, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Settings</h1>
        <p style={{ color: '#64748b', marginBottom: 32 }}>Configure ZIVO AI Builder</p>

        <div style={cardStyle}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>AI Model Settings</h2>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>AI Model</label>
            <select value={model} onChange={e => setModel(e.target.value)} style={inputStyle}>
              <option value="gpt-4.1-mini">GPT-4.1 Mini (Fast, Cost-effective)</option>
              <option value="gpt-4o">GPT-4o (Most Capable)</option>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Legacy)</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Max Tokens</label>
            <input type="number" value={maxTokens} onChange={e => setMaxTokens(e.target.value)} style={inputStyle} min="100" max="128000" />
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Automation Settings</h2>
          {[
            { id: 'autoBuild', label: 'Auto Build', desc: 'Automatically build after code generation', value: autoBuild, set: setAutoBuild },
            { id: 'autoScan', label: 'Auto Code Scan', desc: 'Automatically scan generated code for issues', value: autoScan, set: setAutoScan },
          ].map(opt => (
            <div key={opt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{opt.label}</div>
                <div style={{ color: '#64748b', fontSize: 13 }}>{opt.desc}</div>
              </div>
              <button onClick={() => opt.set(!opt.value)} style={{ width: 48, height: 26, borderRadius: 999, border: 'none', background: opt.value ? '#3b82f6' : '#d1d5db', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                <span style={{ position: 'absolute', top: 3, left: opt.value ? 24 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', display: 'block' }} />
              </button>
            </div>
          ))}
        </div>

        <div style={cardStyle}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Environment</h2>
          <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 8, fontSize: 13, fontFamily: 'monospace' }}>
            <div style={{ marginBottom: 6 }}><span style={{ color: '#64748b' }}>OPENAI_API_KEY:</span>{' '}<span style={{ color: '#16a34a' }}>•••• (configured via .env.local)</span></div>
            <div style={{ marginBottom: 6 }}><span style={{ color: '#64748b' }}>GITHUB_CLIENT_ID:</span>{' '}<span style={{ color: '#94a3b8' }}>not configured</span></div>
            <div><span style={{ color: '#64748b' }}>SUPABASE_URL:</span>{' '}<span style={{ color: '#94a3b8' }}>not configured</span></div>
          </div>
        </div>

        {saved && <div style={{ background: '#dcfce7', color: '#16a34a', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontWeight: 600, fontSize: 14 }}>✅ Settings saved!</div>}
        <button onClick={save} style={{ padding: '12px 32px', borderRadius: 8, border: 'none', background: '#111', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Save Settings</button>
      </main>
    </div>
  );
}
