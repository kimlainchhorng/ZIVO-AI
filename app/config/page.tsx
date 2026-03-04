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

type Env = 'Development' | 'Staging' | 'Production';

const CONFIGS: Record<Env, string> = {
  Development: JSON.stringify({
    api_base_url: "http://localhost:3000",
    debug: true,
    log_level: "debug",
    database: { host: "localhost", port: 5432, name: "zivo_dev", pool_size: 5 },
    ai: { model: "gpt-4o", max_tokens: 4096, temperature: 0.7 },
    cache: { driver: "memory", ttl: 60 },
    cors: { origins: ["http://localhost:3000", "http://localhost:5173"] },
  }, null, 2),
  Staging: JSON.stringify({
    api_base_url: "https://staging-api.zivo.ai",
    debug: false,
    log_level: "info",
    database: { host: "staging-db.internal", port: 5432, name: "zivo_staging", pool_size: 15 },
    ai: { model: "gpt-4o", max_tokens: 8192, temperature: 0.7 },
    cache: { driver: "redis", ttl: 300 },
    cors: { origins: ["https://staging.zivo.ai"] },
  }, null, 2),
  Production: JSON.stringify({
    api_base_url: "https://api.zivo.ai",
    debug: false,
    log_level: "warn",
    database: { host: "prod-db.internal", port: 5432, name: "zivo_prod", pool_size: 30 },
    ai: { model: "gpt-4o", max_tokens: 16384, temperature: 0.5 },
    cache: { driver: "redis", ttl: 900 },
    cors: { origins: ["https://app.zivo.ai", "https://zivo.ai"] },
  }, null, 2),
};

interface Flag {
  id: number;
  name: string;
  description: string;
  enabled: boolean;
}

const INITIAL_FLAGS: Flag[] = [
  { id: 1, name: 'dark_mode',             description: 'Enable dark theme UI across all panels',    enabled: true  },
  { id: 2, name: 'ai_streaming',          description: 'Stream AI responses token-by-token',        enabled: true  },
  { id: 3, name: 'new_dashboard',         description: 'Enable redesigned analytics dashboard',     enabled: false },
  { id: 4, name: 'beta_features',         description: 'Unlock beta-stage features for testers',   enabled: false },
  { id: 5, name: 'experimental_models',   description: 'Allow selection of experimental AI models', enabled: true  },
  { id: 6, name: 'rate_limiting',         description: 'Enforce per-user request rate limits',      enabled: true  },
];

const AUDIT_LOG = [
  { ts: '2026-03-15 10:12:05', user: 'alice@zivo.ai',   change: 'Toggled ai_streaming ON',           env: 'Production'   },
  { ts: '2026-03-14 16:43:22', user: 'bob@zivo.ai',     change: 'Updated database.pool_size to 30',  env: 'Production'   },
  { ts: '2026-03-14 11:09:41', user: 'alice@zivo.ai',   change: 'Toggled new_dashboard OFF',         env: 'Staging'      },
  { ts: '2026-03-13 14:30:00', user: 'carol@zivo.ai',   change: 'Added flag: beta_features',         env: 'Development'  },
  { ts: '2026-03-12 09:55:17', user: 'bob@zivo.ai',     change: 'Updated ai.max_tokens to 16384',    env: 'Production'   },
];

export default function ConfigPage() {
  const [env, setEnv] = useState<Env>('Development');
  const [configs, setConfigs] = useState<Record<Env, string>>(CONFIGS);
  const [flags, setFlags] = useState<Flag[]>(INITIAL_FLAGS);
  const [showAddFlag, setShowAddFlag] = useState(false);
  const [newFlagName, setNewFlagName] = useState('');
  const [newFlagDesc, setNewFlagDesc] = useState('');
  const [jsonError, setJsonError] = useState('');

  const handleConfigChange = (val: string) => {
    setConfigs(prev => ({ ...prev, [env]: val }));
    try { JSON.parse(val); setJsonError(''); } catch { setJsonError('Invalid JSON'); }
  };

  const toggleFlag = (id: number) => {
    setFlags(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
  };

  const addFlag = () => {
    if (!newFlagName) return;
    setFlags(prev => [...prev, {
      id: Date.now(), name: newFlagName.toLowerCase().replace(/\s+/g, '_'),
      description: newFlagDesc || 'No description', enabled: false,
    }]);
    setNewFlagName(''); setNewFlagDesc(''); setShowAddFlag(false);
  };

  const envs: Env[] = ['Development', 'Staging', 'Production'];

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', color: COLORS.textPrimary }}>
      <style>{fadeInCSS}</style>
      <NavBar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Configuration</h1>
          <div style={{ display: 'flex', gap: 6 }}>
            {envs.map(e => (
              <button key={e} onClick={() => { setEnv(e); setJsonError(''); }} style={{
                padding: '7px 18px', borderRadius: 8,
                border: `1px solid ${env === e ? COLORS.accent : COLORS.border}`,
                background: env === e ? 'rgba(99,102,241,0.2)' : 'transparent',
                color: env === e ? COLORS.textPrimary : COLORS.textSecondary,
                cursor: 'pointer', fontSize: 14, fontWeight: env === e ? 600 : 400, transition: 'all 0.15s',
              }}>{e}</button>
            ))}
          </div>
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

          {/* JSON Editor */}
          <div style={{ background: COLORS.bgCard, border: `1px solid ${jsonError ? COLORS.error : COLORS.border}`, borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>JSON Config — {env}</h2>
              {jsonError && <span style={{ fontSize: 12, color: COLORS.error }}>{jsonError}</span>}
            </div>
            <textarea
              value={configs[env]}
              onChange={e => handleConfigChange(e.target.value)}
              spellCheck={false}
              style={{
                width: '100%', minHeight: 400, padding: '12px', borderRadius: 8,
                border: `1px solid ${COLORS.border}`, background: COLORS.bgPanel,
                color: '#a78bfa', fontFamily: 'monospace', fontSize: 13,
                lineHeight: 1.6, outline: 'none', resize: 'vertical', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Feature Flags */}
          <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Feature Flags</h2>
              <button onClick={() => setShowAddFlag(p => !p)} style={{
                padding: '6px 14px', borderRadius: 8, border: `1px solid ${COLORS.border}`,
                background: 'transparent', color: COLORS.accent, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}>+ Add Flag</button>
            </div>

            {showAddFlag && (
              <div style={{ background: COLORS.bgPanel, borderRadius: 8, padding: 14, marginBottom: 16, border: `1px solid ${COLORS.accent}` }}>
                <input placeholder="Flag name (e.g. my_feature)" value={newFlagName} onChange={e => setNewFlagName(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${COLORS.border}`, background: COLORS.bgCard, color: COLORS.textPrimary, fontSize: 13, outline: 'none', marginBottom: 8, boxSizing: 'border-box' }} />
                <input placeholder="Description (optional)" value={newFlagDesc} onChange={e => setNewFlagDesc(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${COLORS.border}`, background: COLORS.bgCard, color: COLORS.textPrimary, fontSize: 13, outline: 'none', marginBottom: 10, boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={addFlag} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: COLORS.accent, color: '#fff', cursor: 'pointer', fontSize: 13 }}>Add</button>
                  <button onClick={() => { setShowAddFlag(false); setNewFlagName(''); setNewFlagDesc(''); }} style={{ padding: '6px 16px', borderRadius: 6, border: `1px solid ${COLORS.border}`, background: 'transparent', color: COLORS.textSecondary, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                </div>
              </div>
            )}

            {flags.map(flag => (
              <div key={flag.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 0', borderBottom: `1px solid ${COLORS.border}`,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary, fontFamily: 'monospace', marginBottom: 3 }}>{flag.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted }}>{flag.description}</div>
                </div>
                <div onClick={() => toggleFlag(flag.id)} style={{
                  width: 40, height: 22, borderRadius: 11, background: flag.enabled ? COLORS.accent : 'rgba(255,255,255,0.1)',
                  position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0, marginLeft: 12,
                }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 3, left: flag.enabled ? 21 : 3, transition: 'left 0.2s',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Log */}
        <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>Audit Log</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  {['Timestamp', 'User', 'Change', 'Environment'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: COLORS.textMuted, fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {AUDIT_LOG.map((row, i) => (
                  <tr key={i} style={{ borderBottom: i < AUDIT_LOG.length - 1 ? `1px solid ${COLORS.border}` : 'none' }}>
                    <td style={{ padding: '10px 12px', color: COLORS.textMuted, fontFamily: 'monospace', fontSize: 12 }}>{row.ts}</td>
                    <td style={{ padding: '10px 12px', color: COLORS.textSecondary }}>{row.user}</td>
                    <td style={{ padding: '10px 12px', color: COLORS.textPrimary }}>{row.change}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600,
                        background: row.env === 'Production' ? 'rgba(239,68,68,0.12)' : row.env === 'Staging' ? 'rgba(245,158,11,0.12)' : 'rgba(99,102,241,0.12)',
                        color: row.env === 'Production' ? COLORS.error : row.env === 'Staging' ? COLORS.warning : COLORS.accent,
                      }}>{row.env}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
