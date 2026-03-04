'use client';

import { useState, useEffect, useRef } from 'react';
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

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  id: number;
  ts: string;
  level: LogLevel;
  source: string;
  message: string;
  stack?: string;
}

const INITIAL_LOGS: LogEntry[] = [
  { id: 1,  ts: '2026-03-15 09:00:01', level: 'info',  source: 'api',     message: 'Server started on port 3000' },
  { id: 2,  ts: '2026-03-15 09:00:05', level: 'info',  source: 'db',      message: 'Connected to PostgreSQL (pool size: 20)' },
  { id: 3,  ts: '2026-03-15 09:00:12', level: 'info',  source: 'auth',    message: 'JWT secret loaded from environment' },
  { id: 4,  ts: '2026-03-15 09:01:03', level: 'warn',  source: 'cache',   message: 'Redis connection timeout, retrying (1/3)' },
  { id: 5,  ts: '2026-03-15 09:01:10', level: 'info',  source: 'cache',   message: 'Redis reconnected successfully' },
  { id: 6,  ts: '2026-03-15 09:02:15', level: 'error', source: 'db',      message: 'Query timeout after 30s on table "sessions"',
    stack: 'Error: Query timeout\n  at Pool.query (/app/db/pool.ts:84)\n  at SessionService.getAll (/app/services/session.ts:42)\n  at GET /api/sessions (handler.ts:17)' },
  { id: 7,  ts: '2026-03-15 09:03:01', level: 'info',  source: 'worker',  message: 'Background job queue initialized (workers: 4)' },
  { id: 8,  ts: '2026-03-15 09:04:20', level: 'warn',  source: 'api',     message: 'Rate limit approaching for IP 192.168.1.42 (58/60 req/min)' },
  { id: 9,  ts: '2026-03-15 09:05:00', level: 'info',  source: 'auth',    message: 'User login successful: user_id=u_8f2a3c' },
  { id: 10, ts: '2026-03-15 09:05:45', level: 'error', source: 'api',     message: 'Unhandled exception in /api/ai/chat endpoint',
    stack: 'TypeError: Cannot read properties of undefined (reading "content")\n  at buildPrompt (/app/engine/chat.ts:112)\n  at POST /api/ai/chat (route.ts:38)' },
  { id: 11, ts: '2026-03-15 09:06:10', level: 'warn',  source: 'monitor', message: 'AI Service response time elevated: 820ms (threshold: 500ms)' },
  { id: 12, ts: '2026-03-15 09:07:30', level: 'info',  source: 'worker',  message: 'Processed 120 pending email notifications' },
  { id: 13, ts: '2026-03-15 09:08:00', level: 'debug', source: 'api',     message: 'Request headers: { content-type: application/json, x-request-id: req_9c12 }' },
  { id: 14, ts: '2026-03-15 09:09:15', level: 'info',  source: 'db',      message: 'Schema migration v2.4.1 applied successfully' },
  { id: 15, ts: '2026-03-15 09:10:02', level: 'error', source: 'auth',    message: 'Failed login attempt: invalid credentials for user admin@example.com',
    stack: 'AuthError: Invalid credentials\n  at AuthService.login (/app/services/auth.ts:66)\n  at POST /api/auth/login (route.ts:22)' },
  { id: 16, ts: '2026-03-15 09:11:44', level: 'info',  source: 'monitor', message: 'All services nominal. Health check passed.' },
];

const LEVEL_COLORS: Record<LogLevel, string> = {
  info:  '#3b82f6',
  warn:  COLORS.warning,
  error: COLORS.error,
  debug: '#a78bfa',
};

let nextId = 17;

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        const msgs = [
          'Health check passed on /api/ping',
          'Cache hit ratio: 72.4%',
          'Background sync completed (12 records)',
          'Model response received in 380ms',
          'Session token refreshed for user u_4b9d1e',
        ];
        setLogs(prev => [{
          id: nextId++,
          ts: new Date().toISOString().replace('T', ' ').slice(0, 19),
          level: 'info',
          source: ['api', 'cache', 'worker', 'monitor'][Math.floor(Math.random() * 4)],
          message: msgs[Math.floor(Math.random() * msgs.length)],
        }, ...prev]);
      }, 3000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh]);

  const counts: Record<string, number> = { all: logs.length, info: 0, warn: 0, error: 0, debug: 0 };
  logs.forEach(l => { counts[l.level] = (counts[l.level] || 0) + 1; });

  const filtered = logs.filter(l =>
    (levelFilter === 'all' || l.level === levelFilter) &&
    (search === '' || l.message.toLowerCase().includes(search.toLowerCase()) || l.source.includes(search.toLowerCase()))
  );

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', color: COLORS.textPrimary }}>
      <style>{fadeInCSS}</style>
      <NavBar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Log Explorer</h1>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: COLORS.textSecondary, cursor: 'pointer' }}>
              <div onClick={() => setAutoRefresh(p => !p)} style={{
                width: 40, height: 22, borderRadius: 11, background: autoRefresh ? COLORS.accent : 'rgba(255,255,255,0.1)',
                position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
              }}>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 3, left: autoRefresh ? 21 : 3, transition: 'left 0.2s',
                }} />
              </div>
              Auto-refresh
            </label>
            <button onClick={() => window.alert('Exported 16 logs as CSV')} style={{
              padding: '7px 16px', borderRadius: 8, border: `1px solid ${COLORS.border}`,
              background: 'transparent', color: COLORS.textSecondary, cursor: 'pointer', fontSize: 13,
            }}>Export CSV</button>
            <button onClick={() => window.alert('Exported 16 logs as JSON')} style={{
              padding: '7px 16px', borderRadius: 8, border: `1px solid ${COLORS.border}`,
              background: 'transparent', color: COLORS.textSecondary, cursor: 'pointer', fontSize: 13,
            }}>Export JSON</button>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            placeholder="Search logs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: 200, padding: '8px 14px', borderRadius: 8,
              border: `1px solid ${COLORS.border}`, background: COLORS.bgCard,
              color: COLORS.textPrimary, fontSize: 14, outline: 'none',
            }}
          />
          {(['all', 'info', 'warn', 'error', 'debug'] as const).map(lv => (
            <button key={lv} onClick={() => setLevelFilter(lv)} style={{
              padding: '7px 14px', borderRadius: 8,
              border: `1px solid ${levelFilter === lv ? LEVEL_COLORS[lv as LogLevel] ?? COLORS.accent : COLORS.border}`,
              background: levelFilter === lv ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: lv === 'all' ? COLORS.textSecondary : LEVEL_COLORS[lv as LogLevel],
              cursor: 'pointer', fontSize: 13, fontWeight: levelFilter === lv ? 600 : 400, display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {lv.charAt(0).toUpperCase() + lv.slice(1)}
              <span style={{
                background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '1px 7px', fontSize: 11,
              }}>{counts[lv] ?? 0}</span>
            </button>
          ))}
        </div>

        {/* Log List */}
        <div style={{
          background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12,
          maxHeight: 500, overflowY: 'auto',
        }}>
          {filtered.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: COLORS.textMuted }}>No logs match your filters.</div>
          )}
          {filtered.map((log, i) => (
            <div key={log.id} style={{
              borderBottom: i < filtered.length - 1 ? `1px solid ${COLORS.border}` : 'none',
              padding: '12px 16px', animation: 'fadeIn 0.3s ease',
            }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 12, color: COLORS.textMuted, whiteSpace: 'nowrap', marginTop: 1, minWidth: 140 }}>{log.ts}</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 5,
                  background: `${LEVEL_COLORS[log.level]}22`, color: LEVEL_COLORS[log.level], textTransform: 'uppercase', whiteSpace: 'nowrap',
                }}>{log.level}</span>
                <span style={{
                  fontSize: 12, padding: '2px 8px', borderRadius: 5,
                  background: 'rgba(255,255,255,0.05)', color: COLORS.textMuted, whiteSpace: 'nowrap',
                }}>{log.source}</span>
                <span style={{ fontSize: 13, color: COLORS.textSecondary, flex: 1 }}>{log.message}</span>
                {log.stack && (
                  <button onClick={() => toggleExpand(log.id)} style={{
                    background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: 13,
                    padding: '0 4px',
                  }}>{expanded.has(log.id) ? '▲' : '▼'}</button>
                )}
              </div>
              {log.stack && expanded.has(log.id) && (
                <pre style={{
                  marginTop: 10, padding: 12, background: 'rgba(239,68,68,0.07)', border: `1px solid rgba(239,68,68,0.2)`,
                  borderRadius: 8, fontSize: 12, color: COLORS.error, whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: '10px 0 0 0',
                }}>{log.stack}</pre>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12, fontSize: 13, color: COLORS.textMuted }}>
          Showing {filtered.length} of {logs.length} log entries
        </div>
      </div>
    </div>
  );
}
