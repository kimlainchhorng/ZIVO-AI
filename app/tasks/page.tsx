'use client';
import NavBar from '../components/NavBar';
import { useState } from 'react';
import AIProjectPlanner from '@/components/AIProjectPlanner';

const COLORS = {
  bg: "#0a0b14", bgPanel: "#0f1120", bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)", accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  textPrimary: "#f1f5f9", textSecondary: "#94a3b8", textMuted: "#64748b",
  success: "#22c55e", warning: "#f59e0b", error: "#ef4444",
};

const fadeInCSS = '@keyframes fadeIn { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }';

type Priority = 'high' | 'medium' | 'low';
type ColumnKey = 'todo' | 'inProgress' | 'done';

interface Task {
  id: string;
  title: string;
  priority: Priority;
  assignee: string;
  dueDate: string;
}

interface Column {
  key: ColumnKey;
  label: string;
  color: string;
}

const PRIORITY_CONFIG: Record<Priority, { bg: string; color: string }> = {
  high:   { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
  medium: { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b' },
  low:    { bg: 'rgba(34,197,94,0.12)',   color: '#22c55e' },
};

const COLUMNS: Column[] = [
  { key: 'todo',       label: 'To Do',       color: '#6366f1' },
  { key: 'inProgress', label: 'In Progress', color: '#f59e0b' },
  { key: 'done',       label: 'Done',        color: '#22c55e' },
];

const INITIAL_TASKS: Record<ColumnKey, Task[]> = {
  todo: [
    { id: 't1', title: 'Set up CI/CD',           priority: 'high',   assignee: 'A', dueDate: '2026-04-10' },
    { id: 't2', title: 'Write unit tests',        priority: 'medium', assignee: 'B', dueDate: '2026-04-15' },
    { id: 't3', title: 'Design UI mockups',       priority: 'low',    assignee: 'C', dueDate: '2026-04-18' },
    { id: 't4', title: 'Update documentation',   priority: 'low',    assignee: 'D', dueDate: '2026-04-20' },
  ],
  inProgress: [
    { id: 't5', title: 'Build auth system',       priority: 'high',   assignee: 'A', dueDate: '2026-04-08' },
    { id: 't6', title: 'API development',         priority: 'high',   assignee: 'B', dueDate: '2026-04-09' },
    { id: 't7', title: 'Database schema',         priority: 'medium', assignee: 'D', dueDate: '2026-04-11' },
  ],
  done: [
    { id: 't8', title: 'Project setup',           priority: 'medium', assignee: 'A', dueDate: '2026-03-25' },
    { id: 't9', title: 'Requirements gathering',  priority: 'low',    assignee: 'C', dueDate: '2026-03-28' },
  ],
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Record<ColumnKey, Task[]>>(INITIAL_TASKS);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');

  function addTask() {
    if (!newTitle.trim()) return;
    const task: Task = {
      id: 't' + Date.now(),
      title: newTitle.trim(),
      priority: newPriority,
      assignee: 'Me',
      dueDate: '2026-04-30',
    };
    setTasks(prev => ({ ...prev, todo: [...prev.todo, task] }));
    setNewTitle('');
    setShowAddForm(false);
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', color: COLORS.textPrimary }}>
      <style>{fadeInCSS}</style>
      <NavBar />
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Tasks</h1>
        <p style={{ color: COLORS.textSecondary, marginBottom: 28 }}>Kanban board for project task management</p>

        {/* Kanban board */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 36 }}>
          {COLUMNS.map(col => (
            <div key={col.key} style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: 'hidden' }}>
              {/* Column header */}
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `3px solid ${col.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{col.label}</span>
                  <span style={{ fontSize: 12, background: COLORS.bgCard, borderRadius: 999, padding: '2px 8px', color: COLORS.textMuted }}>{tasks[col.key].length}</span>
                </div>
                {col.key === 'todo' && (
                  <button onClick={() => setShowAddForm(!showAddForm)} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.accent, padding: '3px 10px', cursor: 'pointer', fontSize: 13 }}>+ Add</button>
                )}
              </div>

              {/* Inline add form */}
              {col.key === 'todo' && showAddForm && (
                <div style={{ padding: 12, borderBottom: `1px solid ${COLORS.border}`, background: 'rgba(99,102,241,0.05)' }}>
                  <input
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Task title…"
                    autoFocus
                    style={{ width: '100%', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.textPrimary, padding: '7px 10px', fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    {(['high', 'medium', 'low'] as Priority[]).map(p => (
                      <button key={p} onClick={() => setNewPriority(p)} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${newPriority === p ? PRIORITY_CONFIG[p].color : COLORS.border}`, background: newPriority === p ? PRIORITY_CONFIG[p].bg : 'transparent', color: newPriority === p ? PRIORITY_CONFIG[p].color : COLORS.textMuted, cursor: 'pointer', fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>{p}</button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={addTask} style={{ background: COLORS.accentGradient, border: 'none', borderRadius: 6, color: '#fff', padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Add</button>
                    <button onClick={() => setShowAddForm(false)} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.textMuted, padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
                  </div>
                </div>
              )}

              {/* Task cards */}
              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tasks[col.key].map(task => {
                  const pcfg = PRIORITY_CONFIG[task.priority];
                  return (
                    <div key={task.id} style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10, lineHeight: 1.4 }}>{task.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: pcfg.bg, color: pcfg.color, textTransform: 'uppercase' }}>{task.priority}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11, color: COLORS.textMuted }}>{task.dueDate}</span>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: COLORS.accentGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{task.assignee.charAt(0)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* AI Project Planner */}
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>AI Project Planner</h2>
          <AIProjectPlanner />
        </div>
      </div>
    </div>
  );
}
