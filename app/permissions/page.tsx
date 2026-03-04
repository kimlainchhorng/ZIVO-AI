'use client';

import { useState } from 'react';
import NavBar from '../../components/NavBar';

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

type Tab = 'Roles' | 'Users' | 'Matrix' | 'Audit Log';

type UserRole = 'Admin' | 'Developer' | 'Viewer';

interface Role {
  name: UserRole;
  description: string;
  userCount: number;
  color: string;
}

const ROLES: Role[] = [
  { name: 'Admin',     description: 'Full access to all resources, settings and billing.',              userCount: 2,  color: COLORS.error   },
  { name: 'Developer', description: 'Can read, write, and deploy. No admin or billing access.',         userCount: 8,  color: COLORS.accent  },
  { name: 'Viewer',    description: 'Read-only access to dashboards and logs.',                         userCount: 15, color: COLORS.textMuted },
];

interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  lastActive: string;
  active: boolean;
}

const INITIAL_USERS: User[] = [
  { id: 1, name: 'Alice Chen',    email: 'alice@zivo.ai',   role: 'Admin',     lastActive: '5 min ago',   active: true  },
  { id: 2, name: 'Bob Martinez',  email: 'bob@zivo.ai',     role: 'Developer', lastActive: '1 hour ago',  active: true  },
  { id: 3, name: 'Carol Davies',  email: 'carol@zivo.ai',   role: 'Developer', lastActive: '3 hours ago', active: true  },
  { id: 4, name: 'Dan Kim',       email: 'dan@example.com', role: 'Viewer',    lastActive: '2 days ago',  active: false },
  { id: 5, name: 'Eva Schneider', email: 'eva@zivo.ai',     role: 'Developer', lastActive: 'just now',    active: true  },
];

type Permission = 'Read' | 'Write' | 'Delete' | 'Deploy' | 'Admin' | 'Billing';

const PERMISSIONS: Permission[] = ['Read', 'Write', 'Delete', 'Deploy', 'Admin', 'Billing'];

type Matrix = Record<UserRole, Record<Permission, boolean>>;

const INITIAL_MATRIX: Matrix = {
  Admin:     { Read: true,  Write: true,  Delete: true,  Deploy: true,  Admin: true,  Billing: true  },
  Developer: { Read: true,  Write: true,  Delete: false, Deploy: true,  Admin: false, Billing: false },
  Viewer:    { Read: true,  Write: false, Delete: false, Deploy: false, Admin: false, Billing: false },
};

const AUDIT_ENTRIES = [
  { ts: '2026-03-15 09:14:02', user: 'alice@zivo.ai',   action: 'Granted Deploy',    resource: 'Developer role', ip: '10.0.0.4'   },
  { ts: '2026-03-14 17:22:45', user: 'alice@zivo.ai',   action: 'Invited user',      resource: 'eva@zivo.ai',    ip: '10.0.0.4'   },
  { ts: '2026-03-14 12:05:10', user: 'bob@zivo.ai',     action: 'Role changed',      resource: 'dan@example.com: Viewer → Viewer', ip: '10.0.0.12' },
  { ts: '2026-03-13 16:48:33', user: 'alice@zivo.ai',   action: 'Revoked Billing',   resource: 'Developer role', ip: '10.0.0.4'   },
  { ts: '2026-03-12 10:30:00', user: 'system',          action: 'Created role',      resource: 'Viewer',         ip: '127.0.0.1'  },
  { ts: '2026-03-11 08:11:55', user: 'carol@zivo.ai',   action: 'Updated profile',   resource: 'carol@zivo.ai',  ip: '10.0.0.19'  },
];

export default function PermissionsPage() {
  const [tab, setTab] = useState<Tab>('Roles');
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [matrix, setMatrix] = useState<Matrix>(INITIAL_MATRIX);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('Viewer');

  const changeRole = (userId: number, role: UserRole) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
  };

  const togglePerm = (role: UserRole, perm: Permission) => {
    setMatrix(prev => ({
      ...prev,
      [role]: { ...prev[role], [perm]: !prev[role][perm] },
    }));
  };

  const handleInvite = () => {
    if (!inviteEmail) return;
    setUsers(prev => [...prev, {
      id: Date.now(), name: inviteEmail.split('@')[0], email: inviteEmail,
      role: inviteRole, lastActive: 'never', active: false,
    }]);
    setInviteEmail(''); setShowInvite(false);
  };

  const tabs: Tab[] = ['Roles', 'Users', 'Matrix', 'Audit Log'];

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', color: COLORS.textPrimary }}>
      <style>{fadeInCSS}</style>
      <NavBar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 24px' }}>Permissions &amp; Roles</h1>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 0 }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '10px 20px', background: 'none', border: 'none',
              borderBottom: tab === t ? `2px solid ${COLORS.accent}` : '2px solid transparent',
              color: tab === t ? COLORS.textPrimary : COLORS.textSecondary,
              cursor: 'pointer', fontSize: 14, fontWeight: tab === t ? 600 : 400,
              marginBottom: -1, transition: 'all 0.15s',
            }}>{t}</button>
          ))}
        </div>

        {/* ROLES TAB */}
        {tab === 'Roles' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: COLORS.accentGradient, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>+ Create Role</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              {ROLES.map(role => (
                <div key={role.name} style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: role.color }} />
                    <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.textPrimary }}>{role.name}</span>
                  </div>
                  <p style={{ fontSize: 13, color: COLORS.textMuted, margin: '0 0 14px', lineHeight: 1.5 }}>{role.description}</p>
                  <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 16 }}>
                    {role.userCount} user{role.userCount !== 1 ? 's' : ''}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${COLORS.border}`, background: 'transparent', color: COLORS.textSecondary, cursor: 'pointer', fontSize: 12 }}>Edit</button>
                    <button style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${COLORS.border}`, background: 'transparent', color: COLORS.error, cursor: 'pointer', fontSize: 12 }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {tab === 'Users' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button onClick={() => setShowInvite(p => !p)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: COLORS.accentGradient, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>+ Invite User</button>
            </div>

            {showInvite && (
              <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.accent}`, borderRadius: 10, padding: 18, marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ fontSize: 12, color: COLORS.textMuted, display: 'block', marginBottom: 5 }}>Email</label>
                  <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="user@example.com"
                    style={{ padding: '8px 12px', borderRadius: 7, border: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, color: COLORS.textPrimary, fontSize: 13, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: COLORS.textMuted, display: 'block', marginBottom: 5 }}>Role</label>
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value as UserRole)}
                    style={{ padding: '8px 12px', borderRadius: 7, border: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, color: COLORS.textPrimary, fontSize: 13, outline: 'none', cursor: 'pointer' }}>
                    <option>Admin</option><option>Developer</option><option>Viewer</option>
                  </select>
                </div>
                <button onClick={handleInvite} style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: COLORS.accent, color: '#fff', cursor: 'pointer', fontSize: 13 }}>Send Invite</button>
                <button onClick={() => setShowInvite(false)} style={{ padding: '8px 14px', borderRadius: 7, border: `1px solid ${COLORS.border}`, background: 'transparent', color: COLORS.textSecondary, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              </div>
            )}

            <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1.2fr 1.2fr 1fr', padding: '11px 16px', borderBottom: `1px solid ${COLORS.border}`, fontSize: 12, color: COLORS.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <span>Name</span><span>Email</span><span>Role</span><span>Last Active</span><span>Status</span>
              </div>
              {users.map((user, i) => (
                <div key={user.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1.2fr 1.2fr 1fr', padding: '13px 16px', borderBottom: i < users.length - 1 ? `1px solid ${COLORS.border}` : 'none', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary }}>{user.name}</span>
                  <span style={{ fontSize: 13, color: COLORS.textSecondary }}>{user.email}</span>
                  <select value={user.role} onChange={e => changeRole(user.id, e.target.value as UserRole)}
                    style={{ padding: '5px 8px', borderRadius: 6, border: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, color: COLORS.textPrimary, fontSize: 12, outline: 'none', cursor: 'pointer', width: 'fit-content' }}>
                    <option>Admin</option><option>Developer</option><option>Viewer</option>
                  </select>
                  <span style={{ fontSize: 12, color: COLORS.textMuted }}>{user.lastActive}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 5, display: 'inline-block',
                    background: user.active ? 'rgba(34,197,94,0.12)' : 'rgba(100,116,139,0.15)',
                    color: user.active ? COLORS.success : COLORS.textMuted, textTransform: 'uppercase',
                  }}>{user.active ? 'Active' : 'Inactive'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MATRIX TAB */}
        {tab === 'Matrix' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <th style={{ padding: '14px 20px', textAlign: 'left', color: COLORS.textMuted, fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Role</th>
                    {PERMISSIONS.map(p => (
                      <th key={p} style={{ padding: '14px 18px', textAlign: 'center', color: COLORS.textMuted, fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>{p}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(['Admin', 'Developer', 'Viewer'] as UserRole[]).map((role, ri) => (
                    <tr key={role} style={{ borderBottom: ri < 2 ? `1px solid ${COLORS.border}` : 'none' }}>
                      <td style={{ padding: '14px 20px', fontWeight: 600, color: ROLES.find(r => r.name === role)?.color ?? COLORS.textPrimary }}>
                        {role}
                      </td>
                      {PERMISSIONS.map(perm => (
                        <td key={perm} style={{ padding: '14px 18px', textAlign: 'center' }}>
                          <input type="checkbox" checked={matrix[role][perm]} onChange={() => togglePerm(role, perm)}
                            style={{ width: 16, height: 16, accentColor: COLORS.accent, cursor: 'pointer' }} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AUDIT LOG TAB */}
        {tab === 'Audit Log' && (
          <div style={{ animation: 'fadeIn 0.3s ease', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  {['Timestamp', 'User', 'Action', 'Resource', 'IP'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: COLORS.textMuted, fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {AUDIT_ENTRIES.map((entry, i) => (
                  <tr key={i} style={{ borderBottom: i < AUDIT_ENTRIES.length - 1 ? `1px solid ${COLORS.border}` : 'none' }}>
                    <td style={{ padding: '12px 16px', color: COLORS.textMuted, fontFamily: 'monospace', fontSize: 12 }}>{entry.ts}</td>
                    <td style={{ padding: '12px 16px', color: COLORS.textSecondary }}>{entry.user}</td>
                    <td style={{ padding: '12px 16px', color: COLORS.textPrimary, fontWeight: 500 }}>{entry.action}</td>
                    <td style={{ padding: '12px 16px', color: COLORS.textSecondary }}>{entry.resource}</td>
                    <td style={{ padding: '12px 16px', color: COLORS.textMuted, fontFamily: 'monospace' }}>{entry.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
