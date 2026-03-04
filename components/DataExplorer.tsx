'use client';

import { useState } from 'react';

const COLORS = {
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  accent: "#6366f1",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
};

const TABLES: Record<string, Record<string, string | number>[]> = {
  users: [
    { id: 1, email: 'alice@example.com', name: 'Alice Chen', role: 'admin', created_at: '2025-01-01' },
    { id: 2, email: 'bob@example.com', name: 'Bob Kim', role: 'developer', created_at: '2025-01-05' },
    { id: 3, email: 'carol@example.com', name: 'Carol Davis', role: 'viewer', created_at: '2025-01-10' },
    { id: 4, email: 'dave@example.com', name: 'Dave Wilson', role: 'developer', created_at: '2025-02-01' },
    { id: 5, email: 'eve@example.com', name: 'Eve Martinez', role: 'admin', created_at: '2025-02-15' },
    { id: 6, email: 'frank@example.com', name: 'Frank Lee', role: 'viewer', created_at: '2025-03-01' },
  ],
  projects: [
    { id: 1, name: 'SaaS Landing', status: 'deployed', files: 12, owner_id: 1 },
    { id: 2, name: 'E-Commerce Store', status: 'building', files: 8, owner_id: 2 },
    { id: 3, name: 'Portfolio Site', status: 'deployed', files: 5, owner_id: 3 },
    { id: 4, name: 'Admin Dashboard', status: 'draft', files: 20, owner_id: 1 },
    { id: 5, name: 'Mobile App', status: 'building', files: 15, owner_id: 2 },
  ],
  prompts: [
    { id: 1, title: 'React Component Generator', category: 'Code', uses: 245, created_at: '2025-01-01' },
    { id: 2, title: 'API Documentation Writer', category: 'Code', uses: 189, created_at: '2025-01-05' },
    { id: 3, title: 'Landing Page Copy', category: 'Design', uses: 312, created_at: '2025-01-10' },
    { id: 4, title: 'Data Analysis Summary', category: 'Data', uses: 98, created_at: '2025-02-01' },
  ],
  sessions: [
    { id: 1, user_id: 1, started_at: '2026-03-04T10:00:00Z', ended_at: '2026-03-04T10:45:00Z', tokens: 8420 },
    { id: 2, user_id: 2, started_at: '2026-03-04T11:00:00Z', ended_at: '2026-03-04T11:30:00Z', tokens: 4200 },
    { id: 3, user_id: 1, started_at: '2026-03-04T14:00:00Z', ended_at: null, tokens: 1250 },
  ],
  logs: [
    { id: 1, level: 'info', message: 'Server started', source: 'server', timestamp: '2026-03-04T10:00:00Z' },
    { id: 2, level: 'warn', message: 'High memory usage', source: 'monitor', timestamp: '2026-03-04T10:05:00Z' },
    { id: 3, level: 'error', message: 'DB connection failed', source: 'db', timestamp: '2026-03-04T10:10:00Z' },
    { id: 4, level: 'info', message: 'Request processed', source: 'api', timestamp: '2026-03-04T10:15:00Z' },
    { id: 5, level: 'info', message: 'Cache hit', source: 'cache', timestamp: '2026-03-04T10:20:00Z' },
    { id: 6, level: 'error', message: 'Invalid API key', source: 'auth', timestamp: '2026-03-04T10:25:00Z' },
  ],
};

const PAGE_SIZE = 5;

export default function DataExplorer() {
  const [table, setTable] = useState<string>('users');
  const [page, setPage] = useState(0);

  const rows = TABLES[table] || [];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleTableChange = (t: string) => { setTable(t); setPage(0); };

  const cellColor = (col: string, val: string | number) => {
    if (col === 'level') {
      if (val === 'error') return '#ef4444';
      if (val === 'warn') return '#f59e0b';
      return '#22c55e';
    }
    if (col === 'status') {
      if (val === 'deployed') return '#22c55e';
      if (val === 'building') return '#f59e0b';
      return '#94a3b8';
    }
    return COLORS.textPrimary;
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {Object.keys(TABLES).map((t) => (
          <button
            key={t}
            onClick={() => handleTableChange(t)}
            style={{
              padding: '0.25rem 0.75rem',
              background: table === t ? 'rgba(99,102,241,0.2)' : COLORS.bgCard,
              border: `1px solid ${table === t ? 'rgba(99,102,241,0.5)' : COLORS.border}`,
              borderRadius: '6px',
              color: table === t ? '#6366f1' : COLORS.textSecondary,
              cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500,
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              {columns.map((col) => (
                <th key={col} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: COLORS.textMuted, fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, ri) => (
              <tr key={ri} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                {columns.map((col) => {
                  const val = row[col];
                  const displayVal = val === null || val === undefined ? '—' : String(val).length > 30 ? String(val).slice(0, 30) + '…' : String(val);
                  return (
                    <td key={col} style={{ padding: '0.5rem 0.75rem', color: cellColor(col, val as string), verticalAlign: 'middle' }} title={String(val)}>
                      {displayVal}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem' }}>
        <span style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>{rows.length} rows · page {page + 1}/{totalPages || 1}</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} style={{ padding: '0.25rem 0.625rem', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: '5px', color: COLORS.textSecondary, cursor: 'pointer', fontSize: '0.75rem', opacity: page === 0 ? 0.4 : 1 }}>← Prev</button>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} style={{ padding: '0.25rem 0.625rem', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: '5px', color: COLORS.textSecondary, cursor: 'pointer', fontSize: '0.75rem', opacity: page >= totalPages - 1 ? 0.4 : 1 }}>Next →</button>
        </div>
      </div>
    </div>
  );
}
