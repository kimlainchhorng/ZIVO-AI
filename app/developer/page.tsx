'use client';

import React, { useState, useCallback } from 'react';
import type { AgentType, FileOutput } from '../../lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'chat' | 'files' | 'agents' | 'database' | 'errors' | 'deploy' | 'workflows';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  files?: FileOutput[];
  agent?: AgentType;
  timestamp: Date;
}

interface Project {
  id: string;
  name: string;
  description: string;
  version: string;
  phase: string;
  tech_stack: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

async function apiFetch(path: string, body: Record<string, unknown>) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FileCard({ file }: { file: FileOutput }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden mb-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-zinc-50 dark:bg-zinc-800 text-left text-sm font-mono hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
      >
        <span className="text-blue-600 dark:text-blue-400 truncate">{file.path}</span>
        <span className="text-xs text-zinc-500 ml-2 flex-shrink-0">
          {file.action} {file.language ? `• ${file.language}` : ''}
          {expanded ? ' ▲' : ' ▼'}
        </span>
      </button>
      {expanded && (
        <pre className="text-xs p-3 overflow-auto max-h-64 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">
          <code>{file.content}</code>
        </pre>
      )}
    </div>
  );
}

function AgentBadge({ agent }: { agent: AgentType }) {
  const colors: Record<AgentType, string> = {
    architect: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    ui: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
    backend: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    qa: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    devops: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  };
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${colors[agent]}`}>
      {agent.toUpperCase()} Agent
    </span>
  );
}

function ChatMessage({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isUser ? 'bg-blue-500 text-white' : 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900'}`}>
        {isUser ? 'U' : 'AI'}
      </div>
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {msg.agent && <AgentBadge agent={msg.agent} />}
        <div className={`rounded-2xl px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${isUser ? 'bg-blue-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'}`}>
          {msg.content}
        </div>
        {msg.files && msg.files.length > 0 && (
          <div className="w-full mt-1">
            <p className="text-xs text-zinc-500 mb-1">{msg.files.length} file(s) generated:</p>
            {msg.files.map((f, i) => <FileCard key={i} file={f} />)}
          </div>
        )}
        <span className="text-xs text-zinc-400">{msg.timestamp.toLocaleTimeString()}</span>
      </div>
    </div>
  );
}

// ─── Main Platform Component ──────────────────────────────────────────────────

export default function DeveloperPlatform() {
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentType | 'auto'>('auto');
  const [project, setProject] = useState<Project | null>(null);
  const [output, setOutput] = useState('');

  // ── Project creation ──
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');

  const createProject = useCallback(async () => {
    if (!projectName.trim()) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/projects', {
        name: projectName,
        description: projectDesc,
        tech_stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Supabase'],
      });
      if (res.project) {
        setProject(res.project);
      }
    } finally {
      setLoading(false);
    }
  }, [projectName, projectDesc]);

  // ── Chat ──
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      let data;

      if (activeTab === 'chat') {
        if (selectedAgent === 'auto') {
          // Use regular chat API
          data = await apiFetch('/api/chat', { prompt: text });
          const assistantMsg: Message = {
            id: generateId(),
            role: 'assistant',
            content: data.result ?? data.error ?? 'No response',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, assistantMsg]);
        } else {
          // Use agent API
          data = await apiFetch('/api/agents', {
            agent: selectedAgent,
            prompt: text,
            context: project ? { project } : undefined,
          });
          const result = data.result;
          const assistantMsg: Message = {
            id: generateId(),
            role: 'assistant',
            content: result?.content ?? data.error ?? 'No response',
            files: result?.files,
            agent: selectedAgent as AgentType,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, assistantMsg]);
        }
      } else if (activeTab === 'files') {
        data = await apiFetch('/api/files', {
          prompt: text,
          projectId: project?.id,
          context: project,
        });
        const assistantMsg: Message = {
          id: generateId(),
          role: 'assistant',
          content: data.output ? `Generated ${data.output.files?.length ?? 0} file(s):\n${data.output.action_items?.join('\n') ?? ''}` : data.error ?? 'No response',
          files: data.output?.files,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else if (activeTab === 'database') {
        data = await apiFetch('/api/database-builder', {
          description: text,
          projectId: project?.id,
        });
        setOutput(data.sql ?? data.result ?? data.error ?? '');
        const assistantMsg: Message = {
          id: generateId(),
          role: 'assistant',
          content: 'Database schema generated. See output panel.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else if (activeTab === 'errors') {
        data = await apiFetch('/api/error-fix', {
          logs: text,
          projectContext: project,
        });
        setOutput(data.analysis ?? data.error ?? '');
        const assistantMsg: Message = {
          id: generateId(),
          role: 'assistant',
          content: `Found ${data.error_count ?? 0} error(s). Analysis ready.`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else if (activeTab === 'workflows') {
        data = await apiFetch('/api/workflows', {
          description: text,
          projectId: project?.id,
        });
        setOutput(data.result ?? data.error ?? '');
        const assistantMsg: Message = {
          id: generateId(),
          role: 'assistant',
          content: 'Workflow generated. See output panel.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMsg]);
      }
    } catch (err) {
      const errMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: `Error: ${err instanceof Error ? err.message : 'Request failed'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, activeTab, selectedAgent, project]);

  // ── Deploy ──
  const [deployAction, setDeployAction] = useState<'prepare' | 'verify' | 'changelog'>('prepare');
  const [deployLogs, setDeployLogs] = useState('');
  const [deployResult, setDeployResult] = useState('');

  const runDeploy = useCallback(async () => {
    if (!project) return;
    setLoading(true);
    try {
      const data = await apiFetch('/api/deploy', {
        projectId: project.id,
        action: deployAction,
        buildLogs: deployLogs || undefined,
        context: project,
      });
      setDeployResult(
        data.checklist ?? data.verification ?? data.changelog ?? data.error ?? 'Done'
      );
    } finally {
      setLoading(false);
    }
  }, [project, deployAction, deployLogs]);

  const TABS: { id: Tab; label: string; emoji: string }[] = [
    { id: 'chat', label: 'Chat', emoji: '💬' },
    { id: 'files', label: 'File Gen', emoji: '📁' },
    { id: 'agents', label: 'Agents', emoji: '🤖' },
    { id: 'database', label: 'Database', emoji: '🗄️' },
    { id: 'errors', label: 'Error Fix', emoji: '🔧' },
    { id: 'workflows', label: 'Workflows', emoji: '⚡' },
    { id: 'deploy', label: 'Deploy', emoji: '🚀' },
  ];

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
      {/* ── Sidebar ── */}
      <aside className="w-64 flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            ⚡ ZIVO AI
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">Developer Platform</p>
        </div>

        {/* Project */}
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          {project ? (
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wide font-semibold">Active Project</p>
              <p className="text-sm font-semibold mt-1 truncate">{project.name}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                  v{project.version}
                </span>
                <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded">
                  {project.phase}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wide font-semibold">New Project</p>
              <input
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                placeholder="Project name"
                className="w-full text-xs px-2 py-1.5 border border-zinc-200 dark:border-zinc-700 rounded bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                value={projectDesc}
                onChange={e => setProjectDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full text-xs px-2 py-1.5 border border-zinc-200 dark:border-zinc-700 rounded bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={createProject}
                disabled={loading || !projectName.trim()}
                className="w-full text-xs bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white rounded px-3 py-1.5 transition-colors"
              >
                Create Project
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Status */}
        <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <span className="text-xs text-zinc-500">Platform Ready</span>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
              {TABS.find(t => t.id === activeTab)?.emoji}{' '}
              {TABS.find(t => t.id === activeTab)?.label}
            </h2>
            {activeTab === 'chat' && (
              <p className="text-xs text-zinc-500 mt-0.5">AI-powered developer assistant</p>
            )}
          </div>
          {activeTab === 'chat' && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-500">Agent:</label>
              <select
                value={selectedAgent}
                onChange={e => setSelectedAgent(e.target.value as AgentType | 'auto')}
                className="text-xs border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="auto">Auto (Chat)</option>
                <option value="architect">🏗️ Architect</option>
                <option value="ui">🎨 UI</option>
                <option value="backend">⚙️ Backend</option>
                <option value="qa">🧪 QA</option>
                <option value="devops">🔧 DevOps</option>
              </select>
            </div>
          )}
        </header>

        {/* ── Chat / Files / Database / Errors / Workflows tabs ── */}
        {(activeTab === 'chat' || activeTab === 'files' || activeTab === 'database' || activeTab === 'errors' || activeTab === 'workflows') && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-zinc-400">
                  <div className="text-4xl mb-3">
                    {activeTab === 'files' ? '📁' : activeTab === 'database' ? '🗄️' : activeTab === 'errors' ? '🔧' : activeTab === 'workflows' ? '⚡' : '💬'}
                  </div>
                  <p className="text-lg font-medium text-zinc-600 dark:text-zinc-400">
                    {activeTab === 'files' && 'Generate complete files with code'}
                    {activeTab === 'database' && 'Design your database schema'}
                    {activeTab === 'errors' && 'Paste error logs to get fixes'}
                    {activeTab === 'workflows' && 'Build automated workflows'}
                    {activeTab === 'chat' && 'Ask anything – I\'m your AI developer'}
                  </p>
                  <p className="text-sm mt-1 text-zinc-400">
                    {activeTab === 'chat' && 'Select an agent or use auto-mode'}
                    {activeTab === 'files' && 'Describe the files you need'}
                    {activeTab === 'database' && 'Describe your data model'}
                    {activeTab === 'errors' && 'Paste your Vercel/build logs'}
                    {activeTab === 'workflows' && 'Describe your business logic'}
                  </p>
                </div>
              )}
              {messages.map(msg => (
                <ChatMessage key={msg.id} msg={msg} />
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:0ms]"></span>
                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:150ms]"></span>
                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:300ms]"></span>
                  </div>
                  <span>Thinking...</span>
                </div>
              )}
            </div>

            {/* Output panel for database/errors/workflows */}
            {output && (activeTab === 'database' || activeTab === 'errors' || activeTab === 'workflows') && (
              <div className="mx-6 mb-2 border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  <span>Output</span>
                  <button onClick={() => setOutput('')} className="text-zinc-400 hover:text-zinc-600">✕</button>
                </div>
                <pre className="text-xs p-3 overflow-auto max-h-48 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">
                  {output}
                </pre>
              </div>
            )}

            {/* Input */}
            <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={
                    activeTab === 'files' ? 'Describe the files to generate...' :
                    activeTab === 'database' ? 'Describe your database schema...' :
                    activeTab === 'errors' ? 'Paste error logs here...' :
                    activeTab === 'workflows' ? 'Describe your workflow...' :
                    'Ask your AI developer anything... (Shift+Enter for newline)'
                  }
                  rows={2}
                  className="flex-1 resize-none text-sm px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white rounded-xl font-medium text-sm transition-colors"
                >
                  {loading ? '...' : '→'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Agents tab ── */}
        {activeTab === 'agents' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto space-y-4">
              <p className="text-sm text-zinc-500">
                Select and run individual agents. Each agent is specialized for a different aspect of development.
              </p>
              {(['architect', 'ui', 'backend', 'qa', 'devops'] as AgentType[]).map(agent => (
                <AgentCard key={agent} agent={agent} project={project} />
              ))}
            </div>
          </div>
        )}

        {/* ── Deploy tab ── */}
        {activeTab === 'deploy' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-4">
              {!project ? (
                <div className="text-center py-12 text-zinc-400">
                  <div className="text-4xl mb-3">🚀</div>
                  <p>Create a project first to use the deploy system.</p>
                </div>
              ) : (
                <>
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Deployment Manager</h3>
                    <p className="text-sm text-zinc-500">Project: <strong>{project.name}</strong> • v{project.version}</p>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Action</label>
                      <div className="flex gap-2">
                        {(['prepare', 'verify', 'changelog'] as const).map(a => (
                          <button
                            key={a}
                            onClick={() => setDeployAction(a)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                              deployAction === a
                                ? 'bg-blue-500 text-white'
                                : 'border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                            }`}
                          >
                            {a === 'prepare' ? '✓ Prepare' : a === 'verify' ? '🔍 Verify' : '📝 Changelog'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {deployAction === 'verify' && (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Build Logs</label>
                        <textarea
                          value={deployLogs}
                          onChange={e => setDeployLogs(e.target.value)}
                          placeholder="Paste Vercel/build logs..."
                          rows={4}
                          className="w-full text-xs font-mono px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                        />
                      </div>
                    )}

                    <button
                      onClick={runDeploy}
                      disabled={loading}
                      className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                    >
                      {loading ? 'Running...' : `Run ${deployAction}`}
                    </button>
                  </div>

                  {deployResult && (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                      <h4 className="font-semibold text-sm mb-2 text-zinc-900 dark:text-zinc-100">Result</h4>
                      <pre className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{deployResult}</pre>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Agent Card component ─────────────────────────────────────────────────────

function AgentCard({ agent, project }: { agent: AgentType; project: Project | null }) {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [files, setFiles] = useState<FileOutput[]>([]);
  const [loading, setLoading] = useState(false);

  const agentInfo: Record<AgentType, { emoji: string; desc: string; placeholder: string }> = {
    architect: { emoji: '🏗️', desc: 'Plans architecture, structure, and technical decisions', placeholder: 'Plan a REST API for a task management app...' },
    ui: { emoji: '🎨', desc: 'Generates React components, pages, and UI patterns', placeholder: 'Generate a dashboard with sidebar navigation...' },
    backend: { emoji: '⚙️', desc: 'Creates API routes, DB schemas, and server logic', placeholder: 'Generate a Supabase schema for user profiles...' },
    qa: { emoji: '🧪', desc: 'Writes tests, checks coverage, finds edge cases', placeholder: 'Generate unit tests for the Auth service...' },
    devops: { emoji: '🔧', desc: 'Sets up CI/CD, deployment configs, and monitoring', placeholder: 'Create a GitHub Actions workflow for Next.js...' },
  };

  const info = agentInfo[agent];

  const run = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setResult('');
    setFiles([]);
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent,
          prompt,
          context: project ? { project } : undefined,
        }),
      });
      const data = await res.json();
      setResult(data.result?.content ?? data.error ?? 'No response');
      setFiles(data.result?.files ?? []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{info.emoji}</span>
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 capitalize">{agent} Agent</h3>
          <p className="text-xs text-zinc-500">{info.desc}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && run()}
          placeholder={info.placeholder}
          className="flex-1 text-sm px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={run}
          disabled={loading || !prompt.trim()}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? '...' : 'Run'}
        </button>
      </div>

      {result && (
        <div className="space-y-2">
          <pre className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 max-h-48 overflow-y-auto">
            {result}
          </pre>
          {files.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 mb-1">{files.length} file(s):</p>
              {files.map((f, i) => <FileCard key={i} file={f} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
