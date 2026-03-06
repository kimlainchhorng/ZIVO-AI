'use client';
import NavBar from '../components/NavBar';
import { useState } from 'react';
import DataExplorer from '@/components/DataExplorer';

const COLORS = {
  bg: "#0a0b14", bgPanel: "#0f1120", bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)", accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  textPrimary: "#f1f5f9", textSecondary: "#94a3b8", textMuted: "#64748b",
  success: "#22c55e", warning: "#f59e0b", error: "#ef4444",
};

const fadeInCSS = '@keyframes fadeIn { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }';

const MIGRATIONS = [
  { date: '2026-02-01', name: 'create_users_table', status: 'applied', duration: '0.23s', author: 'Alice' },
  { date: '2026-02-15', name: 'add_projects_table', status: 'applied', duration: '0.18s', author: 'Bob' },
  { date: '2026-03-01', name: 'add_embeddings_column', status: 'applied', duration: '0.12s', author: 'Alice' },
  { date: '2026-03-04', name: 'create_audit_logs', status: 'pending', duration: '—', author: 'Carol' },
];

const SEED_FILES = [
  { name: 'seed_users.sql', size: '4.2 KB', records: 120 },
  { name: 'seed_projects.sql', size: '1.8 KB', records: 30 },
  { name: 'seed_embeddings.sql', size: '12.4 KB', records: 500 },
];

const OLD_SCHEMA = `CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT
);`;

const NEW_SCHEMA = `CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
+ avatar_url TEXT,
+ last_login TIMESTAMPTZ
);`;

export default function MigrationsPage() {
  const [tab, setTab] = useState('Migrations');
  const [sqlEditor, setSqlEditor] = useState('-- New migration\nALTER TABLE users ADD COLUMN preferences JSONB DEFAULT \'{}\';\n');
  const [customSeed, setCustomSeed] = useState('-- Custom seed\nINSERT INTO users (id, email, name) VALUES\n  (gen_random_uuid(), \'test@example.com\', \'Test User\');');

  const TABS = ['Migrations', 'Schema Diff', 'Seed Data', 'Table Browser'];

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', color: COLORS.textPrimary }}>
      <style>{fadeInCSS}</style>
      <NavBar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Migrations</h1>
        <p style={{ color: COLORS.textSecondary, marginBottom: 24 }}>Manage database migrations, schema changes, and seed data</p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 0 }}>
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
                color: tab === t ? COLORS.accent : COLORS.textSecondary,
                borderBottom: tab === t ? `2px solid ${COLORS.accent}` : '2px solid transparent',
                fontWeight: tab === t ? 600 : 400, fontSize: 14, marginBottom: -1,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* MIGRATIONS TAB */}
        {tab === 'Migrations' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    {['Date', 'Name', 'Status', 'Duration', 'Author'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: COLORS.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MIGRATIONS.map((m, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: COLORS.textMuted }}>{m.date}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontFamily: 'monospace', color: COLORS.textPrimary }}>{m.name}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: m.status === 'applied' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)', color: m.status === 'applied' ? COLORS.success : COLORS.warning }}>
                          {m.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: COLORS.textMuted, fontFamily: 'monospace' }}>{m.duration}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: COLORS.textSecondary }}>{m.author}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>SQL Editor</h3>
              <textarea
                value={sqlEditor}
                onChange={e => setSqlEditor(e.target.value)}
                rows={7}
                style={{ width: '100%', background: '#0d0e1a', border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textPrimary, padding: '10px 12px', fontSize: 13, fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box', marginBottom: 14 }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => window.alert('Migration running…')} style={{ background: COLORS.accentGradient, border: 'none', borderRadius: 8, color: '#fff', padding: '10px 22px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>Run Migration</button>
                <button onClick={() => window.alert('Dry run complete — no errors detected.')} style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textSecondary, padding: '10px 22px', cursor: 'pointer', fontSize: 14 }}>Dry Run</button>
              </div>
            </div>
          </div>
        )}

        {/* SCHEMA DIFF TAB */}
        {tab === 'Schema Diff' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, animation: 'fadeIn 0.3s ease' }}>
            <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${COLORS.border}`, fontSize: 13, fontWeight: 600, color: COLORS.textSecondary }}>Old Schema</div>
              <pre style={{ margin: 0, padding: 16, fontSize: 12.5, fontFamily: 'monospace', lineHeight: 1.7, color: COLORS.textPrimary }}>
                {OLD_SCHEMA.split('\n').map((line, i) => (
                  <div key={i} style={{ color: line.startsWith('-') ? COLORS.error : COLORS.textPrimary }}>{line}</div>
                ))}
              </pre>
            </div>
            <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${COLORS.border}`, fontSize: 13, fontWeight: 600, color: COLORS.textSecondary }}>New Schema</div>
              <pre style={{ margin: 0, padding: 16, fontSize: 12.5, fontFamily: 'monospace', lineHeight: 1.7, color: COLORS.textPrimary }}>
                {NEW_SCHEMA.split('\n').map((line, i) => (
                  <div key={i} style={{
                    background: line.startsWith('+') ? 'rgba(34,197,94,0.1)' : 'transparent',
                    color: line.startsWith('+') ? COLORS.success : COLORS.textPrimary,
                    padding: '0 4px', borderRadius: 2,
                  }}>{line}</div>
                ))}
              </pre>
            </div>
          </div>
        )}

        {/* SEED DATA TAB */}
        {tab === 'Seed Data' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
              {SEED_FILES.map((sf, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: i < SEED_FILES.length - 1 ? `1px solid ${COLORS.border}` : 'none' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{sf.name}</div>
                    <div style={{ fontSize: 12, color: COLORS.textMuted }}>{sf.size} · {sf.records} records</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => window.alert(`Running ${sf.name}…`)} style={{ background: 'rgba(99,102,241,0.15)', border: `1px solid ${COLORS.accent}`, borderRadius: 6, color: COLORS.accent, padding: '6px 14px', cursor: 'pointer', fontSize: 13 }}>Run</button>
                    <button onClick={() => window.alert(`Resetting ${sf.name}…`)} style={{ background: 'rgba(239,68,68,0.1)', border: `1px solid rgba(239,68,68,0.25)`, borderRadius: 6, color: COLORS.error, padding: '6px 14px', cursor: 'pointer', fontSize: 13 }}>Reset</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Custom Seed</h3>
              <textarea
                value={customSeed}
                onChange={e => setCustomSeed(e.target.value)}
                rows={6}
                style={{ width: '100%', background: '#0d0e1a', border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textPrimary, padding: '10px 12px', fontSize: 13, fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box', marginBottom: 12 }}
              />
              <button onClick={() => window.alert('Custom seed executed.')} style={{ background: COLORS.accentGradient, border: 'none', borderRadius: 8, color: '#fff', padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>Run Custom Seed</button>
            </div>
          </div>
        )}

        {/* TABLE BROWSER TAB */}
        {tab === 'Table Browser' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <DataExplorer />
          </div>
        )}
      </div>
    </div>
  );
}
