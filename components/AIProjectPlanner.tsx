'use client';

import { useState } from 'react';

const COLORS = {
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  accent: "#6366f1",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
};

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo';
}

const PRIORITY_COLORS = { high: COLORS.error, medium: COLORS.warning, low: COLORS.success };

export default function AIProjectPlanner() {
  const [input, setInput] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const generateTasks = () => {
    if (!input.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setTasks([
        { id: '1', title: 'Set up project structure', description: 'Initialize repo, install deps, configure TypeScript', priority: 'high', status: 'todo' },
        { id: '2', title: 'Design database schema', description: 'Create ERD, define tables, set up migrations', priority: 'high', status: 'todo' },
        { id: '3', title: 'Build authentication system', description: 'Implement login, registration, JWT tokens', priority: 'high', status: 'todo' },
        { id: '4', title: 'Create API endpoints', description: 'REST API for core features with validation', priority: 'medium', status: 'todo' },
        { id: '5', title: 'Build UI components', description: 'Reusable component library with design system', priority: 'medium', status: 'todo' },
        { id: '6', title: 'Write unit tests', description: 'Coverage for all business logic and API routes', priority: 'medium', status: 'todo' },
        { id: '7', title: 'Set up CI/CD pipeline', description: 'GitHub Actions for automated testing and deploy', priority: 'low', status: 'todo' },
        { id: '8', title: 'Write documentation', description: 'API docs, README, deployment guide', priority: 'low', status: 'todo' },
      ]);
      setLoading(false);
    }, 1500);
  };

  const moveTask = (id: string, dir: -1 | 1) => {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
  };

  const exportKanban = () => {
    setToast('Exported to Kanban! ✓');
    setTimeout(() => setToast(''), 2500);
  };

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', background: '#22c55e', color: '#fff', padding: '0.625rem 1.25rem', borderRadius: '8px', fontWeight: 600, zIndex: 9000, boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>{toast}</div>
      )}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your project (e.g. 'SaaS analytics platform with real-time charts')"
          onKeyDown={(e) => e.key === 'Enter' && generateTasks()}
          style={{ flex: 1, background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: '8px', padding: '0.625rem 0.875rem', color: COLORS.textPrimary, fontSize: '0.875rem', outline: 'none' }}
        />
        <button
          onClick={generateTasks}
          disabled={loading || !input.trim()}
          style={{ padding: '0.625rem 1.25rem', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', opacity: loading || !input.trim() ? 0.6 : 1 }}
        >
          {loading ? '⏳ Generating…' : '✨ Generate Tasks'}
        </button>
      </div>
      {tasks.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.875rem', color: COLORS.textSecondary }}>{tasks.length} tasks generated</span>
            <button onClick={exportKanban} style={{ padding: '0.375rem 0.875rem', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: '6px', color: COLORS.accent, cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500 }}>📤 Export to Kanban</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {tasks.map((task, i) => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.875rem', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: '8px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: COLORS.textPrimary }}>{task.title}</span>
                    <span style={{ fontSize: '0.6875rem', padding: '1px 6px', borderRadius: '4px', background: PRIORITY_COLORS[task.priority] + '22', color: PRIORITY_COLORS[task.priority], fontWeight: 600 }}>{task.priority}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: COLORS.textSecondary }}>{task.description}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <button onClick={() => moveTask(task.id, -1)} disabled={i === 0} style={{ padding: '2px 6px', background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: '4px', color: COLORS.textMuted, cursor: 'pointer', fontSize: '0.6875rem', opacity: i === 0 ? 0.3 : 1 }}>▲</button>
                  <button onClick={() => moveTask(task.id, 1)} disabled={i === tasks.length - 1} style={{ padding: '2px 6px', background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: '4px', color: COLORS.textMuted, cursor: 'pointer', fontSize: '0.6875rem', opacity: i === tasks.length - 1 ? 0.3 : 1 }}>▼</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
