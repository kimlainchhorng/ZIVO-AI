'use client';

import { useState } from 'react';
import NavBar from '../components/NavBar';

const COLORS = {
  bg: "#0a0b14",
  bgPanel: "#0f1120",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
};

const fadeInCSS = '@keyframes fadeIn { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }';

interface Secret {
  id: number;
  name: string;
  masked: string;
  actual: string;
  created: string;
  lastUsed: string;
  expires: string;
}

const INITIAL_SECRETS: Secret[] = [
  { id: 1, name: 'OPENAI_API_KEY',    masked: 'sk-••••••••••••••••abcd',           actual: 'sk-proj-abc123def456ghi789abcd', created: '2026-01-15', lastUsed: 'today',  expires: 'never'       },
  { id: 2, name: 'SUPABASE_URL',      masked: 'https://••••••••.supabase.co',      actual: 'https://xyzabcde.supabase.co',  created: '2026-01-15', lastUsed: '2d ago', expires: 'never'       },
  { id: 3, name: 'STRIPE_SECRET_KEY', masked: 'sk_live_••••••••••••••••efgh',      actual: 'sk_live_test789xyz456efgh',      created: '2026-02-01', lastUsed: '5d ago', expires: '2027-02-01'  },
  { id: 4, name: 'GITHUB_TOKEN',      masked: 'ghp_••••••••••••••••ijkl',          actual: 'ghp_r4nd0mT0kenStr1ngijkl',     created: '2026-02-10', lastUsed: '1d ago', expires: 'never'       },
];

interface CreateForm {
  name: string;
  value: string;
  expiry: string;
}

export default function SecretsPage() {
  const [secrets, setSecrets] = useState<Secret[]>(INITIAL_SECRETS);
  const [search, setSearch] = useState('');
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateForm>({ name: '', value: '', expiry: '' });

  const toggleReveal = (id: number) => {
    setRevealed(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const handleCopy = (id: number, value: string) => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: number) => {
    setSecrets(prev => prev.filter(s => s.id !== id));
  };

  const handleRotate = (id: number) => {
    window.alert(`Secret #${id} rotated. New value has been generated and applied.`);
  };

  const handleSave = () => {
    if (!form.name || !form.value) return;
    const newSecret: Secret = {
      id: Date.now(),
      name: form.name.toUpperCase().replace(/\s+/g, '_'),
      masked: form.value.slice(0, 4) + '••••••••••••••••' + form.value.slice(-4),
      actual: form.value,
      created: new Date().toISOString().slice(0, 10),
      lastUsed: 'never',
      expires: form.expiry || 'never',
    };
    setSecrets(prev => [newSecret, ...prev]);
    setForm({ name: '', value: '', expiry: '' });
    setShowForm(false);
  };

  const filtered = secrets.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', color: COLORS.textPrimary }}>
      <style>{fadeInCSS}</style>
      <NavBar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Secrets Vault</h1>
          <button onClick={() => setShowForm(p => !p)} style={{
            padding: '8px 20px', borderRadius: 8, border: 'none',
            background: COLORS.accentGradient, color: '#fff',
            cursor: 'pointer', fontSize: 14, fontWeight: 600,
          }}>+ New Secret</button>
        </div>

        {/* Create Form */}
        {showForm && (
          <div style={{
            background: COLORS.bgCard, border: `1px solid ${COLORS.accent}`, borderRadius: 12,
            padding: 24, marginBottom: 20, animation: 'fadeIn 0.25s ease',
          }}>
            <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 600 }}>Create New Secret</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: COLORS.textMuted, display: 'block', marginBottom: 6 }}>Name *</label>
                <input placeholder="e.g. MY_API_KEY" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, color: COLORS.textPrimary, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: COLORS.textMuted, display: 'block', marginBottom: 6 }}>Value *</label>
                <input type="password" placeholder="Secret value" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, color: COLORS.textPrimary, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: COLORS.textMuted, display: 'block', marginBottom: 6 }}>Expiry Date</label>
                <input type="date" value={form.expiry} onChange={e => setForm(p => ({ ...p, expiry: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, color: COLORS.textPrimary, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleSave} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: COLORS.accent, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Save</button>
              <button onClick={() => { setShowForm(false); setForm({ name: '', value: '', expiry: '' }); }} style={{ padding: '8px 20px', borderRadius: 8, border: `1px solid ${COLORS.border}`, background: 'transparent', color: COLORS.textSecondary, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Search */}
        <input placeholder="Filter secrets..." value={search} onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '9px 14px', borderRadius: 8, border: `1px solid ${COLORS.border}`,
            background: COLORS.bgCard, color: COLORS.textPrimary, fontSize: 14, outline: 'none',
            marginBottom: 16, boxSizing: 'border-box',
          }} />

        {/* Table */}
        <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1.6fr 2fr 1fr 1fr 1fr auto',
            padding: '12px 16px', borderBottom: `1px solid ${COLORS.border}`,
            fontSize: 12, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            <span>Name</span><span>Value</span><span>Created</span><span>Last Used</span><span>Expires</span><span>Actions</span>
          </div>

          {filtered.map((secret, i) => (
            <div key={secret.id} style={{
              display: 'grid', gridTemplateColumns: '1.6fr 2fr 1fr 1fr 1fr auto',
              padding: '14px 16px', borderBottom: i < filtered.length - 1 ? `1px solid ${COLORS.border}` : 'none',
              alignItems: 'center', animation: 'fadeIn 0.3s ease',
            }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary, fontFamily: 'monospace' }}>{secret.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: COLORS.textSecondary, fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {revealed.has(secret.id) ? secret.actual : secret.masked}
                </span>
                <button onClick={() => toggleReveal(secret.id)} style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.textMuted, cursor: 'pointer', fontSize: 11, padding: '3px 8px' }}>
                  {revealed.has(secret.id) ? 'Hide' : 'Reveal'}
                </button>
              </div>
              <span style={{ fontSize: 12, color: COLORS.textMuted }}>{secret.created}</span>
              <span style={{ fontSize: 12, color: COLORS.textMuted }}>{secret.lastUsed}</span>
              <span style={{
                fontSize: 12,
                color: secret.expires === 'never' ? COLORS.textMuted : (new Date(secret.expires) < new Date() ? COLORS.error : COLORS.warning),
              }}>{secret.expires}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => handleCopy(secret.id, revealed.has(secret.id) ? secret.actual : secret.masked)} style={{
                  padding: '5px 12px', borderRadius: 6, border: `1px solid ${copiedId === secret.id ? COLORS.success : COLORS.border}`,
                  background: copiedId === secret.id ? 'rgba(34,197,94,0.1)' : 'transparent',
                  color: copiedId === secret.id ? COLORS.success : COLORS.textMuted,
                  cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap', transition: 'all 0.2s',
                }}>
                  {copiedId === secret.id ? 'Copied! ✓' : 'Copy'}
                </button>
                <button onClick={() => handleRotate(secret.id)} style={{ padding: '5px 12px', borderRadius: 6, border: `1px solid ${COLORS.border}`, background: 'transparent', color: COLORS.warning, cursor: 'pointer', fontSize: 12 }}>Rotate</button>
                <button onClick={() => handleDelete(secret.id)} style={{ padding: '5px 12px', borderRadius: 6, border: `1px solid ${COLORS.border}`, background: 'transparent', color: COLORS.error, cursor: 'pointer', fontSize: 12 }}>Delete</button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: COLORS.textMuted }}>No secrets found.</div>
          )}
        </div>

        <div style={{ marginTop: 12, fontSize: 13, color: COLORS.textMuted }}>
          {filtered.length} secret{filtered.length !== 1 ? 's' : ''} stored
        </div>
      </div>
    </div>
  );
}
