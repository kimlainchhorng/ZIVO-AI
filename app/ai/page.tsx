'use client';

import React, { useState } from 'react';
import type { AgentRole } from '../../lib/types';

type Tab = 'chat' | 'generate' | 'agents' | 'database' | 'workflows' | 'deploy' | 'errors';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'chat',      label: 'AI Chat',       icon: '💬' },
  { id: 'generate',  label: 'File Generator', icon: '📄' },
  { id: 'agents',    label: 'Multi-Agent',   icon: '🤖' },
  { id: 'database',  label: 'DB Builder',    icon: '🗄️' },
  { id: 'workflows', label: 'Workflows',     icon: '⚙️' },
  { id: 'deploy',    label: 'Deploy',        icon: '🚀' },
  { id: 'errors',    label: 'Fix Errors',    icon: '🔧' },
];

const AGENT_ROLES: AgentRole[] = ['architect', 'ui', 'backend', 'qa', 'devops'];

export default function DeveloperPlatform() {
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [prompt, setPrompt] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<AgentRole[]>(['architect', 'backend']);
  const [buildLog, setBuildLog] = useState('');

  async function callAPI(endpoint: string, body: Record<string, unknown>) {
    setLoading(true);
    setOutput('');
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setOutput(JSON.stringify(data, null, 2));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Request failed';
      setOutput(`Error: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  function toggleAgent(role: AgentRole) {
    setSelectedAgents((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-sm">Z</div>
        <h1 className="text-xl font-semibold">ZIVO AI <span className="text-indigo-400 text-sm font-normal">Developer Platform</span></h1>
        <span className="ml-auto text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">Production Grade</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav className="w-48 border-r border-gray-800 p-3 flex flex-col gap-1 shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setOutput(''); setPrompt(''); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Main content */}
        <main className="flex-1 flex flex-col p-6 gap-4 overflow-auto">
          {/* ── AI Chat ── */}
          {activeTab === 'chat' && (
            <Section title="💬 AI Chat" description="Chat with ZIVO AI – get instant answers and code assistance.">
              <textarea
                className="w-full bg-gray-800 rounded-lg p-3 text-sm resize-none border border-gray-700 focus:outline-none focus:border-indigo-500"
                rows={4}
                placeholder="Ask anything…"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <ActionButton loading={loading} onClick={() => callAPI('/api/chat', { prompt })}>
                Send
              </ActionButton>
            </Section>
          )}

          {/* ── File Generator ── */}
          {activeTab === 'generate' && (
            <Section title="📄 File Generator" description="Generate complete production-ready files (Bolt-style). Returns full code, not snippets.">
              <textarea
                className="w-full bg-gray-800 rounded-lg p-3 text-sm resize-none border border-gray-700 focus:outline-none focus:border-indigo-500"
                rows={5}
                placeholder="Describe what files you want to create…&#10;Example: Create a Next.js API route for user authentication with JWT and a login form component"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <ActionButton loading={loading} onClick={() => callAPI('/api/generate-files', { prompt, context: { tech_stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Supabase'] } })}>
                Generate Files
              </ActionButton>
            </Section>
          )}

          {/* ── Multi-Agent ── */}
          {activeTab === 'agents' && (
            <Section title="🤖 Multi-Agent System" description="Coordinate specialist agents: Architect, UI, Backend, QA, and DevOps.">
              <div className="flex flex-wrap gap-2 mb-3">
                {AGENT_ROLES.map((role) => (
                  <button
                    key={role}
                    onClick={() => toggleAgent(role)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      selectedAgents.includes(role)
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'border-gray-600 text-gray-400 hover:border-gray-400'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
              <textarea
                className="w-full bg-gray-800 rounded-lg p-3 text-sm resize-none border border-gray-700 focus:outline-none focus:border-indigo-500"
                rows={4}
                placeholder="Describe the task for the agents…&#10;Example: Build a SaaS billing system with Stripe integration"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <ActionButton
                loading={loading}
                onClick={() => callAPI('/api/agents', { task: prompt, agents: selectedAgents })}
              >
                Run Agents
              </ActionButton>
            </Section>
          )}

          {/* ── Database Builder ── */}
          {activeTab === 'database' && (
            <Section title="🗄️ Database Builder" description="Generate Supabase tables with columns, indexes, RLS policies, and migrations.">
              <textarea
                className="w-full bg-gray-800 rounded-lg p-3 text-sm resize-none border border-gray-700 focus:outline-none focus:border-indigo-500"
                rows={4}
                placeholder="Describe your database needs…&#10;Example: E-commerce platform with products, orders, customers, and reviews"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <ActionButton loading={loading} onClick={() => callAPI('/api/database-builder', { description: prompt })}>
                Generate Schema
              </ActionButton>
            </Section>
          )}

          {/* ── Workflows ── */}
          {activeTab === 'workflows' && (
            <Section title="⚙️ Workflow Builder" description="Build business logic automation with state machines, error handling, and retry logic.">
              <textarea
                className="w-full bg-gray-800 rounded-lg p-3 text-sm resize-none border border-gray-700 focus:outline-none focus:border-indigo-500"
                rows={4}
                placeholder="Describe the workflow…&#10;Example: User onboarding flow: sign up → email verify → profile setup → welcome email → trial activation"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <ActionButton loading={loading} onClick={() => callAPI('/api/workflow-builder', { description: prompt })}>
                Build Workflow
              </ActionButton>
            </Section>
          )}

          {/* ── Deploy ── */}
          {activeTab === 'deploy' && (
            <Section title="🚀 One-Click Deploy" description="Automatic versioning (V1, V2, V3…), changelog, and rollback support.">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Project ID</label>
                  <input
                    className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-indigo-500"
                    placeholder="project-id"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Environment</label>
                  <select className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-indigo-500">
                    <option value="preview">Preview</option>
                    <option value="production">Production</option>
                  </select>
                </div>
              </div>
              <ActionButton loading={loading} onClick={() => callAPI('/api/deploy', { project_id: prompt, environment: 'preview', changelog: 'Deployed via ZIVO AI' })}>
                Deploy
              </ActionButton>
            </Section>
          )}

          {/* ── Fix Errors ── */}
          {activeTab === 'errors' && (
            <Section title="🔧 Error Fix Mode" description="Paste Vercel build logs to auto-detect errors, identify root causes, and get fix proposals.">
              <textarea
                className="w-full bg-gray-800 rounded-lg p-3 text-sm font-mono resize-none border border-gray-700 focus:outline-none focus:border-indigo-500"
                rows={8}
                placeholder="Paste your Vercel / Next.js build log here…"
                value={buildLog}
                onChange={(e) => setBuildLog(e.target.value)}
              />
              <ActionButton loading={loading} onClick={() => callAPI('/api/fix-errors', { build_log: buildLog })}>
                Analyse &amp; Fix
              </ActionButton>
            </Section>
          )}

          {/* Output */}
          {(output || loading) && (
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Output</h3>
                {output && (
                  <button
                    onClick={() => navigator.clipboard?.writeText(output)}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Copy
                  </button>
                )}
              </div>
              <div className="bg-gray-900 rounded-xl border border-gray-700 p-4 overflow-auto max-h-[50vh]">
                {loading ? (
                  <div className="flex items-center gap-2 text-indigo-400 text-sm">
                    <span className="animate-spin inline-block">⟳</span> Processing…
                  </div>
                ) : (
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap break-words">{output}</pre>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-gray-400 mt-0.5">{description}</p>
      </div>
      {children}
    </div>
  );
}

function ActionButton({
  loading,
  onClick,
  children,
}: {
  loading: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="self-start px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
    >
      {loading ? 'Working…' : children}
    </button>
  );
}