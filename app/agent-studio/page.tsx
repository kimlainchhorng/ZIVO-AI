'use client';

import NavBar from '../components/NavBar';
import { useState } from 'react';

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

type AgentTab = 'Graph' | 'Tasks' | 'Memory' | 'Tools' | 'Skills' | 'Training' | 'Sandbox';

interface AgentNode {
  id: string;
  name: string;
  model: string;
  tools: string[];
  lastRun: string;
  color: string;
  x: string;
  y: number;
}

const AGENT_NODES: AgentNode[] = [
  { id: 'orchestrator', name: 'Orchestrator', model: 'GPT-4o', tools: ['Task Planner', 'Agent Dispatcher', 'Memory Read'], lastRun: '2 min ago', color: '#6366f1', x: '45%', y: 20 },
  { id: 'researcher', name: 'Researcher', model: 'GPT-4.1', tools: ['Web Search', 'Document Reader', 'Summarizer'], lastRun: '5 min ago', color: '#3b82f6', x: '10%', y: 160 },
  { id: 'coder', name: 'Coder', model: 'o3', tools: ['Code Execution', 'File Read', 'GitHub API'], lastRun: '3 min ago', color: '#22c55e', x: '70%', y: 160 },
  { id: 'reviewer', name: 'Reviewer', model: 'Claude-3.5-Sonnet', tools: ['Code Review', 'Quality Gate', 'Report Writer'], lastRun: '8 min ago', color: '#f59e0b', x: '45%', y: 280 },
];

interface Task {
  id: number;
  name: string;
  agent: string;
  status: 'running' | 'completed' | 'queued' | 'failed';
  priority: 'high' | 'medium' | 'low';
}

const INITIAL_TASKS: Task[] = [
  { id: 1, name: 'Analyze user feedback data', agent: 'Researcher', status: 'completed', priority: 'high' },
  { id: 2, name: 'Generate API client code', agent: 'Coder', status: 'running', priority: 'high' },
  { id: 3, name: 'Review PR #142', agent: 'Reviewer', status: 'queued', priority: 'medium' },
  { id: 4, name: 'Research competitor pricing', agent: 'Researcher', status: 'completed', priority: 'low' },
  { id: 5, name: 'Orchestrate deployment pipeline', agent: 'Orchestrator', status: 'failed', priority: 'high' },
];

interface Tool {
  id: number;
  name: string;
  icon: string;
  enabled: boolean;
  description: string;
}

const INITIAL_TOOLS: Tool[] = [
  { id: 1, name: 'Web Search', icon: '🌐', enabled: true, description: 'Search the web using Tavily API' },
  { id: 2, name: 'Code Execution', icon: '⚙️', enabled: true, description: 'Run Python/JS in sandboxed env' },
  { id: 3, name: 'File Read', icon: '📂', enabled: true, description: 'Read files from workspace' },
  { id: 4, name: 'API Call', icon: '🔗', enabled: false, description: 'Make HTTP requests to external APIs' },
  { id: 5, name: 'Database Query', icon: '🗄️', enabled: false, description: 'Execute SQL against connected DBs' },
  { id: 6, name: 'Calculator', icon: '🔢', enabled: true, description: 'Perform arithmetic calculations' },
];

const AGENT_MEMORY: Record<string, { key: string; value: string }[]> = {
  Orchestrator: [
    { key: 'last_task_id', value: 'task_892' },
    { key: 'active_agents', value: 'researcher, coder' },
    { key: 'session_goal', value: 'Complete sprint #14 deliverables' },
  ],
  Researcher: [
    { key: 'last_query', value: 'competitor pricing analysis 2026' },
    { key: 'sources_checked', value: '12' },
  ],
  Coder: [
    { key: 'current_file', value: 'src/api/client.ts' },
    { key: 'language', value: 'TypeScript' },
  ],
  Reviewer: [
    { key: 'last_pr', value: '#141' },
    { key: 'approval_rate', value: '87%' },
  ],
};

const statusColor = (s: Task['status']) => {
  if (s === 'completed') return COLORS.success;
  if (s === 'running') return COLORS.accent;
  if (s === 'failed') return COLORS.error;
  return COLORS.warning;
};

const priorityColor = (p: Task['priority']) => ({
  high: COLORS.error, medium: COLORS.warning, low: COLORS.success,
}[p]);

export default function AgentStudio() {
  const [activeTab, setActiveTab] = useState<AgentTab>('Graph');
  const [selectedNode, setSelectedNode] = useState<AgentNode | null>(null);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [tools, setTools] = useState<Tool[]>(INITIAL_TOOLS);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskAgent, setNewTaskAgent] = useState('Coder');
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set(['Orchestrator']));
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const toggleTool = (id: number) => setTools(prev => prev.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t));
  const toggleAccordion = (name: string) => setExpandedAgents(prev => {
    const next = new Set(prev);
    next.has(name) ? next.delete(name) : next.add(name);
    return next;
  });
  const clearMemory = (agentName: string) => {
    showToast(`Memory cleared for ${agentName}`);
  };
  const addTask = () => {
    if (!newTaskName.trim()) return;
    setTasks(prev => [...prev, {
      id: Date.now(), name: newTaskName, agent: newTaskAgent,
      status: 'queued', priority: 'medium',
    }]);
    setNewTaskName('');
    setShowAddTask(false);
  };

  const TABS: AgentTab[] = ['Graph', 'Tasks', 'Memory', 'Tools', 'Skills', 'Training', 'Sandbox'];

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', color: COLORS.textPrimary }}>
      <style>{fadeInCSS}</style>
      <NavBar />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px', animation: 'fadeIn 0.4s ease' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>Agent Studio</h1>
        <p style={{ color: COLORS.textSecondary, margin: '0 0 24px' }}>Build, connect, and orchestrate AI agents</p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: `1px solid ${COLORS.border}`, overflowX: 'auto' }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '10px 18px', background: 'none', border: 'none',
              borderBottom: activeTab === tab ? `2px solid ${COLORS.accent}` : '2px solid transparent',
              color: activeTab === tab ? COLORS.textPrimary : COLORS.textSecondary,
              fontSize: 13, fontWeight: activeTab === tab ? 600 : 400, cursor: 'pointer',
              marginBottom: -1, whiteSpace: 'nowrap',
            }}>
              {tab}
            </button>
          ))}
        </div>

        {/* GRAPH TAB */}
        {activeTab === 'Graph' && (
          <div style={{ display: 'flex', gap: 24 }}>
            <div style={{
              flex: 1, height: 360, position: 'relative',
              background: 'rgba(0,0,0,0.2)', border: `1px solid ${COLORS.border}`,
              borderRadius: 12, overflow: 'hidden',
            }}>
              {/* SVG connections */}
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                {/* Orchestrator → Researcher */}
                <line x1="50%" y1="60" x2="17%" y2="178" stroke={COLORS.border} strokeWidth="1.5" strokeDasharray="4,4" />
                {/* Orchestrator → Coder */}
                <line x1="50%" y1="60" x2="77%" y2="178" stroke={COLORS.border} strokeWidth="1.5" strokeDasharray="4,4" />
                {/* Orchestrator → Reviewer */}
                <line x1="50%" y1="60" x2="50%" y2="298" stroke={COLORS.border} strokeWidth="1.5" strokeDasharray="4,4" />
              </svg>

              {/* Agent Nodes */}
              {AGENT_NODES.map(node => (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
                  style={{
                    position: 'absolute', left: node.x, top: node.y,
                    transform: 'translateX(-50%)',
                    background: node.color + '22', border: `2px solid ${selectedNode?.id === node.id ? node.color : node.color + '66'}`,
                    borderRadius: 12, padding: '10px 18px', cursor: 'pointer',
                    textAlign: 'center', transition: 'all 0.2s',
                    boxShadow: selectedNode?.id === node.id ? `0 0 16px ${node.color}44` : 'none',
                    minWidth: 110,
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 4 }}>
                    {node.id === 'orchestrator' ? '🎯' : node.id === 'researcher' ? '🔍' : node.id === 'coder' ? '💻' : '👁️'}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: node.color }}>{node.name}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{node.model}</div>
                </div>
              ))}
            </div>

            {/* Side panel */}
            {selectedNode && (
              <div style={{ width: 260, ...card }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 15, color: selectedNode.color }}>{selectedNode.name}</h3>
                  <button onClick={() => setSelectedNode(null)} style={{ background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer' }}>✕</button>
                </div>
                <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div><span style={{ color: COLORS.textMuted }}>Model: </span>{selectedNode.model}</div>
                  <div><span style={{ color: COLORS.textMuted }}>Last run: </span>{selectedNode.lastRun}</div>
                  <div>
                    <div style={{ color: COLORS.textMuted, marginBottom: 6 }}>Tools:</div>
                    {selectedNode.tools.map(t => (
                      <div key={t} style={{
                        padding: '4px 10px', marginBottom: 4, borderRadius: 6,
                        background: 'rgba(255,255,255,0.04)', fontSize: 12,
                      }}>🔧 {t}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TASKS TAB */}
        {activeTab === 'Tasks' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button onClick={() => setShowAddTask(x => !x)} style={btnAccent}>+ Add Task</button>
            </div>
            {showAddTask && (
              <div style={{ ...card, marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Task Name</label>
                  <input value={newTaskName} onChange={e => setNewTaskName(e.target.value)} placeholder="Describe the task..."
                    style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.textPrimary, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={labelStyle}>Agent</label>
                  <select value={newTaskAgent} onChange={e => setNewTaskAgent(e.target.value)} style={selectStyle}>
                    {AGENT_NODES.map(n => <option key={n.id}>{n.name}</option>)}
                  </select>
                </div>
                <button onClick={addTask} style={btnAccent}>Create</button>
              </div>
            )}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Task', 'Assigned Agent', 'Status', 'Priority'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 14px', color: COLORS.textMuted, fontWeight: 500, borderBottom: `1px solid ${COLORS.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(task => (
                    <tr key={task.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      <td style={{ padding: '12px 14px' }}>{task.name}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <select
                          value={task.agent}
                          onChange={e => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, agent: e.target.value } : t))}
                          style={{ ...selectStyle, width: 'auto', padding: '4px 8px' }}
                        >
                          {AGENT_NODES.map(n => <option key={n.id}>{n.name}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: statusColor(task.status) + '22', color: statusColor(task.status) }}>
                          {task.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: priorityColor(task.priority) + '22', color: priorityColor(task.priority) }}>
                          {task.priority}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MEMORY TAB */}
        {activeTab === 'Memory' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(AGENT_MEMORY).map(([agentName, entries]) => (
              <div key={agentName} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => toggleAccordion(agentName)}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{agentName}</span>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={e => { e.stopPropagation(); clearMemory(agentName); }}
                      style={btnDanger}>Clear Memory</button>
                    <span style={{ color: COLORS.textMuted }}>{expandedAgents.has(agentName) ? '▲' : '▼'}</span>
                  </div>
                </div>
                {expandedAgents.has(agentName) && (
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {entries.map(e => (
                      <div key={e.key} style={{ display: 'flex', gap: 12, fontSize: 13, padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 7 }}>
                        <code style={{ color: COLORS.accent, minWidth: 160 }}>{e.key}</code>
                        <span style={{ color: COLORS.textSecondary }}>{e.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TOOLS TAB */}
        {activeTab === 'Tools' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tools.map(tool => (
              <div key={tool.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 22 }}>{tool.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{tool.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{tool.description}</div>
                </div>
                <div onClick={() => toggleTool(tool.id)} style={{
                  width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
                  background: tool.enabled ? COLORS.accent : COLORS.border, position: 'relative', transition: 'background 0.2s',
                }}>
                  <div style={{
                    position: 'absolute', top: 3, left: tool.enabled ? 22 : 2,
                    width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PLACEHOLDER TABS */}
        {(['Skills', 'Training', 'Sandbox'] as AgentTab[]).includes(activeTab) && (
          <div style={{ ...card, textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>
              {activeTab === 'Skills' ? '🧠' : activeTab === 'Training' ? '🎓' : '🧪'}
            </div>
            <h2 style={{ margin: '0 0 10px', fontSize: 20 }}>{activeTab}</h2>
            <p style={{ color: COLORS.textSecondary, maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>
              {activeTab === 'Skills' && 'Define reusable skill templates that agents can invoke. Create chains of actions with conditional logic and retry policies.'}
              {activeTab === 'Training' && 'Fine-tune agents on your domain data. Upload training examples, configure LoRA parameters, and track loss curves over epochs.'}
              {activeTab === 'Sandbox' && 'Safely test agents in an isolated environment. Simulate multi-agent conversations, inject edge cases, and inspect message traces.'}
            </p>
            <button style={{ ...btnAccent, marginTop: 20 }} onClick={() => showToast(`${activeTab} coming soon`)}>
              Get Started
            </button>
          </div>
        )}
      </div>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, background: COLORS.accent, color: '#fff',
          padding: '12px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500, zIndex: 200,
          animation: 'fadeIn 0.3s ease',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}

const card: React.CSSProperties = {
  background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20,
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600, color: COLORS.textMuted,
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6,
};
const selectStyle: React.CSSProperties = {
  padding: '7px 10px', background: 'rgba(0,0,0,0.3)',
  border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.textPrimary, fontSize: 13,
};
const btnAccent: React.CSSProperties = {
  background: COLORS.accent, color: '#fff', border: 'none', borderRadius: 7,
  padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
};
const btnDanger: React.CSSProperties = {
  background: COLORS.error + '15', color: COLORS.error, border: `1px solid ${COLORS.error}33`,
  borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer',
};
