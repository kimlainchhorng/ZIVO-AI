'use client';
import NavBar from '../components/NavBar';
import { useState } from 'react';
import PresenceIndicator from '@/components/PresenceIndicator';

const COLORS = {
  bg: "#0a0b14", bgPanel: "#0f1120", bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)", accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  textPrimary: "#f1f5f9", textSecondary: "#94a3b8", textMuted: "#64748b",
  success: "#22c55e", warning: "#f59e0b", error: "#ef4444",
};

const fadeInCSS = '@keyframes fadeIn { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }';

const MEMBERS = [
  { name: 'Alice Chen',    email: 'alice@zivo.ai',   role: 'Admin',       status: 'online',  last: '2 min ago' },
  { name: 'Bob Martinez',  email: 'bob@zivo.ai',     role: 'Developer',   status: 'online',  last: '5 min ago' },
  { name: 'Carol White',   email: 'carol@zivo.ai',   role: 'Designer',    status: 'away',    last: '1 hr ago' },
  { name: 'David Kim',     email: 'david@zivo.ai',   role: 'Developer',   status: 'offline', last: '3 hrs ago' },
  { name: 'Eva Rodriguez', email: 'eva@zivo.ai',     role: 'Viewer',      status: 'online',  last: 'Just now' },
];

const STATUS_DOT: Record<string, string> = { online: '#22c55e', away: '#f59e0b', offline: '#64748b' };

const PROJECTS = [
  { name: 'ZIVO Core',         desc: 'Main platform repository',         updated: '2 hrs ago',  contributors: 4 },
  { name: 'AI Agent Studio',   desc: 'Agent builder & orchestration',    updated: '1 day ago',  contributors: 3 },
  { name: 'Design System',     desc: 'Shared component library',         updated: '3 days ago', contributors: 2 },
  { name: 'SDK Package',       desc: 'Client SDKs for TypeScript/Python',updated: '1 week ago', contributors: 2 },
  { name: 'Docs Site',         desc: 'Documentation website',            updated: '2 days ago', contributors: 3 },
  { name: 'Analytics Engine',  desc: 'Real-time analytics pipeline',     updated: '5 days ago', contributors: 2 },
];

const COMMENTS = [
  { user: 'AC', name: 'Alice Chen',    text: 'The new API design looks great! Should we add rate limiting to the embeddings endpoint?', time: '10 min ago', replies: 2 },
  { user: 'BM', name: 'Bob Martinez',  text: "I've pushed the schema changes. @Carol can you review the migration before we deploy?",     time: '1 hr ago',  replies: 1 },
  { user: 'EV', name: 'Eva Rodriguez', text: 'Accessibility report is ready. We have 3 critical issues that need to be fixed this sprint.', time: '2 hrs ago', replies: 0 },
];

const ROLE_OPTIONS = ['Viewer', 'Developer', 'Designer', 'Admin'];

export default function WorkspacePage() {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Developer');
  const [toast, setToast] = useState(false);
  const [wsName, setWsName] = useState('ZIVO Workspace');
  const [wsDesc, setWsDesc] = useState('Collaborative workspace for the ZIVO AI platform team');
  const [isPublic, setIsPublic] = useState(false);

  function sendInvite() {
    if (!inviteEmail) return;
    setToast(true);
    setInviteEmail('');
    setTimeout(() => setToast(false), 3000);
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', color: COLORS.textPrimary }}>
      <style>{fadeInCSS}</style>
      <NavBar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Workspace</h1>
            <p style={{ color: COLORS.textSecondary }}>Collaborate with your team in real-time</p>
          </div>
          <PresenceIndicator />
        </div>

        {/* Toast */}
        {toast && (
          <div style={{ position: 'fixed', top: 80, right: 24, background: COLORS.success, color: '#fff', padding: '12px 20px', borderRadius: 10, fontWeight: 600, zIndex: 9999, animation: 'fadeIn 0.3s ease' }}>
            ✓ Invite sent successfully!
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Members table */}
          <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${COLORS.border}` }}>
              <h2 style={{ fontSize: 17, fontWeight: 600 }}>Members</h2>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  {['Member', 'Email', 'Role', 'Status', 'Last Active'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: COLORS.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MEMBERS.map((m, i) => (
                  <tr key={i} style={{ borderBottom: i < MEMBERS.length - 1 ? `1px solid ${COLORS.border}` : 'none' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: COLORS.accentGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>{m.name.charAt(0)}</div>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: COLORS.textMuted }}>{m.email}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 12, background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '3px 10px', color: COLORS.textSecondary }}>{m.role}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_DOT[m.status] }} />
                        <span style={{ fontSize: 12, color: COLORS.textMuted, textTransform: 'capitalize' }}>{m.status}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: COLORS.textMuted }}>{m.last}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Projects grid */}
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 14 }}>Projects</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
              {PROJECTS.map((p, i) => (
                <div key={i} style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 18 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{p.name}</div>
                  <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 14 }}>{p.desc}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 11, color: COLORS.textMuted }}>Updated {p.updated}</div>
                      <div style={{ fontSize: 11, color: COLORS.textMuted }}>{p.contributors} contributors</div>
                    </div>
                    <button style={{ background: COLORS.accentGradient, border: 'none', borderRadius: 7, color: '#fff', padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Open</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Invite section */}
          <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 16 }}>Invite Member</h2>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                type="email"
                style={{ flex: 1, minWidth: 220, background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textPrimary, padding: '9px 12px', fontSize: 13 }}
              />
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
                style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textPrimary, padding: '9px 12px', fontSize: 13 }}
              >
                {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button onClick={sendInvite} style={{ background: COLORS.accentGradient, border: 'none', borderRadius: 8, color: '#fff', padding: '9px 22px', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Send Invite</button>
            </div>
          </div>

          {/* Comments section */}
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 14 }}>Comments</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {COMMENTS.map((c, i) => (
                <div key={i} style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: COLORS.accentGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{c.user}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</span>
                        <span style={{ fontSize: 11, color: COLORS.textMuted }}>{c.time}</span>
                      </div>
                      <p style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.6, marginBottom: 10 }}>{c.text}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.textMuted, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Reply</button>
                        {c.replies > 0 && <span style={{ fontSize: 12, color: COLORS.textMuted }}>{c.replies} {c.replies === 1 ? 'reply' : 'replies'}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Workspace settings */}
          <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 18 }}>Workspace Settings</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 480 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: COLORS.textSecondary, display: 'block', marginBottom: 6 }}>Name</label>
                <input value={wsName} onChange={e => setWsName(e.target.value)} style={{ width: '100%', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textPrimary, padding: '9px 12px', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: COLORS.textSecondary, display: 'block', marginBottom: 6 }}>Description</label>
                <textarea value={wsDesc} onChange={e => setWsDesc(e.target.value)} rows={3} style={{ width: '100%', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textPrimary, padding: '9px 12px', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: COLORS.textSecondary, display: 'block', marginBottom: 8 }}>Visibility</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[false, true].map(pub => (
                    <button
                      key={String(pub)}
                      onClick={() => setIsPublic(pub)}
                      style={{ padding: '8px 18px', borderRadius: 8, border: `1px solid ${isPublic === pub ? COLORS.accent : COLORS.border}`, background: isPublic === pub ? 'rgba(99,102,241,0.15)' : 'transparent', color: isPublic === pub ? COLORS.accent : COLORS.textSecondary, cursor: 'pointer', fontWeight: isPublic === pub ? 600 : 400, fontSize: 13 }}
                    >
                      {pub ? '🌐 Public' : '🔒 Private'}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => window.alert('Settings saved!')} style={{ background: COLORS.accentGradient, border: 'none', borderRadius: 8, color: '#fff', padding: '10px 22px', fontWeight: 600, cursor: 'pointer', fontSize: 14, alignSelf: 'flex-start' }}>Save Settings</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
