'use client';
import { useState } from 'react';
import NavBar from '../../components/NavBar';

const COLORS = {
  bg: "#0a0b14", bgPanel: "#0f1120", bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)", accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  textPrimary: "#f1f5f9", textSecondary: "#94a3b8", textMuted: "#64748b",
  success: "#22c55e", warning: "#f59e0b", error: "#ef4444",
};

const fadeInCSS = '@keyframes fadeIn { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }';

const versions = [
  { version: 'v2.1.0', status: 'Latest', status2: 'Deployed', date: '2026-03-01', commits: 12, summary: 'Performance improvements' },
  { version: 'v2.0.1', status: 'Deployed', status2: '', date: '2026-02-15', commits: 3, summary: 'Bug fixes' },
  { version: 'v2.0.0', status: 'Deployed', status2: '', date: '2026-02-01', commits: 45, summary: 'Major redesign' },
  { version: 'v1.9.5', status: 'Deprecated', status2: '', date: '2026-01-15', commits: 8, summary: 'Hotfix' },
  { version: 'v1.9.0', status: 'Archived', status2: '', date: '2026-01-01', commits: 22, summary: 'New features' },
];

const deployTargets = [
  { name: 'Vercel', status: 'connected', extra: 'live', icon: '▲' },
  { name: 'Docker Hub', status: 'connected', extra: '', icon: '🐳' },
  { name: 'AWS EC2', status: 'not connected', extra: '', icon: '☁️' },
];

const snapshots = [
  { id: 'snap-001', version: 'v2.1.0', date: '2026-03-01 14:32', size: '2.4 MB' },
  { id: 'snap-002', version: 'v2.0.0', date: '2026-02-01 09:15', size: '2.1 MB' },
  { id: 'snap-003', version: 'v1.9.0', date: '2026-01-01 18:00', size: '1.8 MB' },
];

function statusColor(status: string) {
  if (status === 'Latest') return COLORS.accent;
  if (status === 'Deployed') return COLORS.success;
  if (status === 'Deprecated') return COLORS.warning;
  if (status === 'Archived') return COLORS.textMuted;
  return COLORS.textSecondary;
}

export default function ReleasesPage() {
  const [showModal, setShowModal] = useState(false);
  const [newVersion, setNewVersion] = useState('');
  const [newSummary, setNewSummary] = useState('');

  function handleDeploy(v: string) {
    window.confirm(`Deploy ${v} to production?`);
  }
  function handleRollback(v: string) {
    window.confirm(`Rollback to ${v}? This will replace the current deployment.`);
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', color: COLORS.textPrimary }}>
      <style>{fadeInCSS}</style>
      <NavBar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Release Manager</h1>
          <button
            onClick={() => setShowModal(true)}
            style={{ background: COLORS.accentGradient, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}
          >+ Create Release</button>
        </div>

        {/* Version Table */}
        <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, marginBottom: 32, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${COLORS.border}` }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Version History</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                {['Version', 'Status', 'Date', 'Commits', 'Summary', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: COLORS.textMuted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {versions.map((v, i) => (
                <tr key={v.version} style={{ borderTop: `1px solid ${COLORS.border}`, animation: `fadeIn 0.3s ease ${i * 0.05}s both` }}>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: 'rgba(99,102,241,0.15)', color: COLORS.accent, padding: '3px 10px', borderRadius: 6, fontFamily: 'monospace', fontWeight: 700 }}>{v.version}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: `${statusColor(v.status)}22`, color: statusColor(v.status), padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{v.status}</span>
                    {v.status2 && <span style={{ marginLeft: 6, background: `${COLORS.success}22`, color: COLORS.success, padding: '3px 8px', borderRadius: 6, fontSize: 12 }}>{v.status2}</span>}
                  </td>
                  <td style={{ padding: '14px 16px', color: COLORS.textSecondary, fontSize: 14 }}>{v.date}</td>
                  <td style={{ padding: '14px 16px', color: COLORS.textSecondary, fontSize: 14 }}>{v.commits}</td>
                  <td style={{ padding: '14px 16px', color: COLORS.textSecondary, fontSize: 14 }}>{v.summary}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleDeploy(v.version)} style={{ background: 'rgba(34,197,94,0.15)', color: COLORS.success, border: `1px solid ${COLORS.success}44`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>Deploy</button>
                      <button onClick={() => handleRollback(v.version)} style={{ background: 'rgba(245,158,11,0.15)', color: COLORS.warning, border: `1px solid ${COLORS.warning}44`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>Rollback</button>
                      <button style={{ background: COLORS.bgCard, color: COLORS.textSecondary, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>Changelog</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Deploy Targets */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Deploy Targets</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {deployTargets.map(t => (
              <div key={t.name} style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{t.icon}</div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>{t.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.status === 'connected' ? COLORS.success : COLORS.textMuted, display: 'inline-block' }} />
                  <span style={{ fontSize: 13, color: t.status === 'connected' ? COLORS.success : COLORS.textMuted }}>{t.status}</span>
                  {t.extra && <span style={{ fontSize: 12, color: COLORS.accent, background: 'rgba(99,102,241,0.15)', padding: '2px 6px', borderRadius: 4 }}>{t.extra}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Snapshots */}
        <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${COLORS.border}` }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Snapshots</h2>
          </div>
          {snapshots.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: i > 0 ? `1px solid ${COLORS.border}` : 'none' }}>
              <div>
                <span style={{ fontFamily: 'monospace', color: COLORS.accent, marginRight: 12 }}>{s.id}</span>
                <span style={{ color: COLORS.textSecondary, fontSize: 14 }}>{s.version} · {s.date} · {s.size}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => window.alert(`Restoring ${s.id}...`)} style={{ background: 'rgba(99,102,241,0.15)', color: COLORS.accent, border: `1px solid ${COLORS.accent}44`, borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 13 }}>Restore</button>
                <button style={{ background: COLORS.bgCard, color: COLORS.textSecondary, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 13 }}>Download</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Release Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 32, width: 420 }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 20 }}>Create Release</h2>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: COLORS.textSecondary, fontSize: 13, marginBottom: 6 }}>Version</label>
              <input value={newVersion} onChange={e => setNewVersion(e.target.value)} placeholder="v2.2.0" style={{ width: '100%', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 12px', color: COLORS.textPrimary, fontSize: 14, boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', color: COLORS.textSecondary, fontSize: 13, marginBottom: 6 }}>Summary</label>
              <input value={newSummary} onChange={e => setNewSummary(e.target.value)} placeholder="Release summary..." style={{ width: '100%', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 12px', color: COLORS.textPrimary, fontSize: 14, boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ background: COLORS.bgCard, color: COLORS.textSecondary, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 20px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { window.alert(`Release ${newVersion} created!`); setShowModal(false); }} style={{ background: COLORS.accentGradient, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
