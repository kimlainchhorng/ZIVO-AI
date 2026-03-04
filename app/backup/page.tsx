'use client';
import NavBar from '../components/NavBar';
import { useState } from 'react';

const COLORS = {
  bg: "#0a0b14", bgPanel: "#0f1120", bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)", accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  textPrimary: "#f1f5f9", textSecondary: "#94a3b8", textMuted: "#64748b",
  success: "#22c55e", warning: "#f59e0b", error: "#ef4444",
};

const fadeInCSS = '@keyframes fadeIn { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }';

interface Backup {
  date: string;
  type: string;
  size: string;
  status: 'success' | 'failed';
  duration: string;
}

interface Snapshot {
  name: string;
  description: string;
  timestamp: string;
}

const BACKUPS: Backup[] = [
  { date: '2026-03-04', type: 'Full',        size: '2.4 GB', status: 'success', duration: '4m 32s' },
  { date: '2026-03-01', type: 'Incremental', size: '180 MB', status: 'success', duration: '0m 45s' },
  { date: '2026-02-22', type: 'Full',        size: '2.1 GB', status: 'success', duration: '4m 01s' },
  { date: '2026-02-15', type: 'Incremental', size: '95 MB',  status: 'failed',  duration: '—'      },
  { date: '2026-02-08', type: 'Full',        size: '1.8 GB', status: 'success', duration: '3m 28s' },
];

const SNAPSHOTS: Snapshot[] = [
  { name: 'Pre-migration v2',  description: 'Snapshot before major schema migration',  timestamp: '2026-03-03 14:22' },
  { name: 'Release candidate', description: 'Stable state before v3.0 release',        timestamp: '2026-02-28 09:15' },
  { name: 'Pre-deployment',    description: 'Before production deployment on Feb 15',  timestamp: '2026-02-15 11:00' },
];

export default function BackupPage() {
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(BACKUPS[0].date + ' - ' + BACKUPS[0].type);
  const [snapshots, setSnapshots] = useState<Snapshot[]>(SNAPSHOTS);
  const [frequency, setFrequency] = useState('daily');
  const [retention, setRetention] = useState('30');

  function createBackup() {
    setCreating(true);
    setCreateSuccess(false);
    setTimeout(() => {
      setCreating(false);
      setCreateSuccess(true);
    }, 2000);
  }

  function restoreBackup() {
    if (window.confirm(`Restore from backup: ${selectedBackup}?\n\nThis will overwrite current data. This action cannot be undone.`)) {
      window.alert('Restore initiated. This may take several minutes.');
    }
  }

  function deleteSnapshot(name: string) {
    if (window.confirm(`Delete snapshot "${name}"?`)) {
      setSnapshots(prev => prev.filter(s => s.name !== name));
    }
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', color: COLORS.textPrimary }}>
      <style>{fadeInCSS}</style>
      <NavBar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Backup & Restore</h1>
        <p style={{ color: COLORS.textSecondary, marginBottom: 28 }}>Manage data backups, snapshots and restoration</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Create Backup */}
          <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>Create Backup</h2>
                <p style={{ fontSize: 13, color: COLORS.textSecondary }}>Create a full backup of all workspace data</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {createSuccess && (
                  <span style={{ fontSize: 13, color: COLORS.success, fontWeight: 600, animation: 'fadeIn 0.3s ease' }}>✓ Backup created successfully!</span>
                )}
                <button
                  onClick={createBackup}
                  disabled={creating}
                  style={{ background: COLORS.accentGradient, border: 'none', borderRadius: 9, color: '#fff', padding: '10px 24px', fontWeight: 600, fontSize: 14, cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.7 : 1, minWidth: 150 }}
                >
                  {creating ? '⏳ Creating…' : '+ Create Backup'}
                </button>
              </div>
            </div>
          </div>

          {/* Backup history */}
          <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${COLORS.border}` }}>
              <h2 style={{ fontSize: 17, fontWeight: 600 }}>Backup History</h2>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  {['Date', 'Type', 'Size', 'Status', 'Duration', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: COLORS.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BACKUPS.map((b, i) => (
                  <tr key={i} style={{ borderBottom: i < BACKUPS.length - 1 ? `1px solid ${COLORS.border}` : 'none' }}>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: COLORS.textMuted, fontFamily: 'monospace' }}>{b.date}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13 }}>{b.type}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: COLORS.textSecondary }}>{b.size}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: b.status === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: b.status === 'success' ? COLORS.success : COLORS.error }}>
                        {b.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: COLORS.textMuted, fontFamily: 'monospace' }}>{b.duration}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => window.alert(`Downloading backup from ${b.date}…`)} style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.textSecondary, padding: '4px 10px', cursor: 'pointer', fontSize: 11 }}>↓</button>
                        <button onClick={() => window.alert(`Restoring from ${b.date}…`)} disabled={b.status === 'failed'} style={{ background: 'rgba(99,102,241,0.1)', border: `1px solid ${COLORS.accent}`, borderRadius: 6, color: COLORS.accent, padding: '4px 10px', cursor: b.status === 'failed' ? 'not-allowed' : 'pointer', fontSize: 11, opacity: b.status === 'failed' ? 0.4 : 1 }}>⟳</button>
                        <button onClick={() => window.alert(`Backup from ${b.date} deleted.`)} style={{ background: 'rgba(239,68,68,0.08)', border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 6, color: COLORS.error, padding: '4px 10px', cursor: 'pointer', fontSize: 11 }}>✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Restore section */}
          <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 22 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 16 }}>Restore from Backup</h2>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <select
                value={selectedBackup}
                onChange={e => setSelectedBackup(e.target.value)}
                style={{ flex: 1, minWidth: 220, background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textPrimary, padding: '9px 12px', fontSize: 13 }}
              >
                {BACKUPS.filter(b => b.status === 'success').map(b => (
                  <option key={b.date + b.type} value={b.date + ' - ' + b.type}>{b.date} — {b.type} ({b.size})</option>
                ))}
              </select>
              <button onClick={restoreBackup} style={{ background: 'rgba(245,158,11,0.15)', border: `1px solid ${COLORS.warning}`, borderRadius: 8, color: COLORS.warning, padding: '9px 22px', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                ⟳ Restore
              </button>
            </div>
          </div>

          {/* Named snapshots */}
          <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${COLORS.border}` }}>
              <h2 style={{ fontSize: 17, fontWeight: 600 }}>Named Snapshots</h2>
            </div>
            {snapshots.map((snap, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: i < snapshots.length - 1 ? `1px solid ${COLORS.border}` : 'none', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>{snap.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{snap.description}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{snap.timestamp}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => window.alert(`Restoring snapshot: ${snap.name}…`)} style={{ background: 'rgba(99,102,241,0.12)', border: `1px solid ${COLORS.accent}`, borderRadius: 7, color: COLORS.accent, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Restore</button>
                  <button onClick={() => deleteSnapshot(snap.name)} style={{ background: 'rgba(239,68,68,0.08)', border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 7, color: COLORS.error, padding: '6px 14px', cursor: 'pointer', fontSize: 12 }}>Delete</button>
                </div>
              </div>
            ))}
          </div>

          {/* Auto-backup schedule */}
          <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 22 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 16 }}>Auto-Backup Schedule</h2>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div>
                <label style={{ fontSize: 12, color: COLORS.textMuted, display: 'block', marginBottom: 6 }}>Frequency</label>
                <select value={frequency} onChange={e => setFrequency(e.target.value)} style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textPrimary, padding: '9px 12px', fontSize: 13 }}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: COLORS.textMuted, display: 'block', marginBottom: 6 }}>Retention (days)</label>
                <input type="number" value={retention} onChange={e => setRetention(e.target.value)} min={1} max={365} style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textPrimary, padding: '9px 12px', fontSize: 13, width: 100 }} />
              </div>
              <button onClick={() => window.alert(`Auto-backup schedule saved: ${frequency}, ${retention}-day retention.`)} style={{ background: COLORS.accentGradient, border: 'none', borderRadius: 8, color: '#fff', padding: '10px 22px', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Save Schedule</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
