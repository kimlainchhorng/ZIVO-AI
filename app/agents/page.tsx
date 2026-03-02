"use client";

import { useState } from "react";

type AgentRole =
  | "architect"
  | "ui"
  | "backend"
  | "database"
  | "security"
  | "performance"
  | "devops"
  | "code-review";

interface ReasoningStep {
  id: string;
  agentRole: AgentRole;
  thought: string;
  status: "pending" | "running" | "completed" | "failed";
  startedAt?: string;
  completedAt?: string;
  dependencies: string[];
  action?: { name: string; arguments: Record<string, unknown> };
}

interface AgentResult {
  agentRole: AgentRole;
  reasoning: string;
  output: Record<string, unknown>;
  nextSteps?: string[];
}

const AGENT_COLORS: Record<AgentRole, string> = {
  architect: "bg-purple-100 text-purple-800 border-purple-300",
  ui: "bg-blue-100 text-blue-800 border-blue-300",
  backend: "bg-green-100 text-green-800 border-green-300",
  database: "bg-yellow-100 text-yellow-800 border-yellow-300",
  security: "bg-red-100 text-red-800 border-red-300",
  performance: "bg-orange-100 text-orange-800 border-orange-300",
  devops: "bg-teal-100 text-teal-800 border-teal-300",
  "code-review": "bg-gray-100 text-gray-800 border-gray-300",
};

const AGENT_ICONS: Record<AgentRole, string> = {
  architect: "🏛️",
  ui: "🎨",
  backend: "⚙️",
  database: "🗄️",
  security: "🔒",
  performance: "⚡",
  devops: "🚀",
  "code-review": "🔍",
};

const STATUS_COLORS = {
  pending: "bg-gray-200 text-gray-600",
  running: "bg-blue-200 text-blue-700 animate-pulse",
  completed: "bg-green-200 text-green-700",
  failed: "bg-red-200 text-red-700",
};

const ALL_AGENTS: AgentRole[] = [
  "architect",
  "ui",
  "backend",
  "database",
  "security",
  "performance",
  "devops",
  "code-review",
];

export default function AgentsPage() {
  const [selectedAgents, setSelectedAgents] = useState<AgentRole[]>(["architect", "ui", "backend"]);
  const [task, setTask] = useState("");
  const [projectId, setProjectId] = useState("my-project");
  const [steps, setSteps] = useState<ReasoningStep[]>([]);
  const [results, setResults] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"chain" | "single" | "jobs">("chain");

  // Single agent state
  const [singleAgent, setSingleAgent] = useState<AgentRole>("architect");
  const [singleMessage, setSingleMessage] = useState("");
  const [singleResult, setSingleResult] = useState<AgentResult | null>(null);
  const [singleLoading, setSingleLoading] = useState(false);

  // Jobs state
  const [jobs, setJobs] = useState<Array<{ jobId: string; status: string; progress: number; updatedAt: string }>>([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  function toggleAgent(agent: AgentRole) {
    setSelectedAgents((prev) =>
      prev.includes(agent) ? prev.filter((a) => a !== agent) : [...prev, agent]
    );
  }

  async function runReasoningChain() {
    if (!task.trim()) return;
    setLoading(true);
    setError("");
    setSteps([]);
    setResults({});

    try {
      const res = await fetch("/api/reasoning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, projectId, agents: selectedAgents }),
      });
      const data = await res.json() as {
        ok?: boolean;
        error?: string;
        graph?: { steps: ReasoningStep[] };
        results?: Record<string, unknown>;
      };

      if (!data.ok) throw new Error(data.error ?? "Unknown error");
      setSteps(data.graph?.steps ?? []);
      setResults(data.results ?? {});
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function runSingleAgent() {
    if (!singleMessage.trim()) return;
    setSingleLoading(true);
    setError("");
    setSingleResult(null);

    try {
      const res = await fetch(`/api/agents/${singleAgent}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: singleMessage, projectId }),
      });
      const data = await res.json() as { ok?: boolean; error?: string; response?: AgentResult };
      if (!data.ok) throw new Error(data.error ?? "Unknown error");
      setSingleResult(data.response ?? null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSingleLoading(false);
    }
  }

  async function loadJobs() {
    setJobsLoading(true);
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json() as { jobs?: Array<{ jobId: string; status: string; progress: number; updatedAt: string }> };
      setJobs(data.jobs ?? []);
    } catch {
      // ignore
    } finally {
      setJobsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ZIVO AI — Agent Monitor</h1>
          <p className="text-gray-600 mt-1">Multi-agent reasoning system with tool-calling and memory</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {(["chain", "single", "jobs"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
              setActiveTab(tab);
              if (tab === "jobs") loadJobs();
            }}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab
                  ? "bg-white border border-b-white border-gray-200 text-blue-600 -mb-px"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "chain" ? "🔗 Reasoning Chain" : tab === "single" ? "🤖 Single Agent" : "📋 Background Jobs"}
            </button>
          ))}
        </div>

        {/* Project ID */}
        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 w-24">Project ID</label>
          <input
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="flex-1 max-w-xs px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            placeholder="my-project"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Chain Tab */}
        {activeTab === "chain" && (
          <div className="space-y-6">
            {/* Agent selector */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-800 mb-3">Select Agents</h2>
              <div className="flex flex-wrap gap-2">
                {ALL_AGENTS.map((agent) => (
                  <button
                    key={agent}
                    onClick={() => toggleAgent(agent)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                      selectedAgents.includes(agent)
                        ? AGENT_COLORS[agent]
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <span>{AGENT_ICONS[agent]}</span>
                    <span className="capitalize">{agent}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Task input */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-800 mb-3">Task</h2>
              <textarea
                value={task}
                onChange={(e) => setTask(e.target.value)}
                rows={3}
                placeholder="e.g. Build a SaaS project management app with Supabase auth, teams, and Stripe billing"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={runReasoningChain}
                disabled={loading || !task.trim() || selectedAgents.length === 0}
                className="mt-3 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Running agents…" : "▶ Run Reasoning Chain"}
              </button>
            </div>

            {/* Reasoning steps */}
            {steps.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="font-semibold text-gray-800 mb-4">Reasoning Graph</h2>
                <div className="space-y-3">
                  {steps.map((step, i) => (
                    <div key={step.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${AGENT_COLORS[step.agentRole]}`}>
                          {i + 1}
                        </div>
                        {i < steps.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                      </div>
                      <div className="flex-1 pb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm capitalize">{AGENT_ICONS[step.agentRole]} {step.agentRole}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[step.status]}`}>
                            {step.status}
                          </span>
                          {step.dependencies.length > 0 && (
                            <span className="text-xs text-gray-400">depends on: {step.dependencies.join(", ")}</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{step.thought}</p>
                        {step.action && (
                          <div className="mt-1 text-xs text-blue-600">
                            🔧 Called: <code>{step.action.name}</code>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results */}
            {Object.keys(results).length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="font-semibold text-gray-800 mb-4">Agent Results</h2>
                <div className="space-y-4">
                  {Object.entries(results).map(([agent, result]) => (
                    <div key={agent} className={`rounded-lg border p-4 ${AGENT_COLORS[agent as AgentRole] ?? "bg-gray-50"}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span>{AGENT_ICONS[agent as AgentRole]}</span>
                        <span className="font-medium capitalize">{agent} Agent</span>
                      </div>
                      <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-48 bg-white/60 rounded p-2">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Single Agent Tab */}
        {activeTab === "single" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-800 mb-4">Single Agent</h2>

              <div className="flex flex-wrap gap-2 mb-4">
                {ALL_AGENTS.map((agent) => (
                  <button
                    key={agent}
                    onClick={() => setSingleAgent(agent)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                      singleAgent === agent
                        ? AGENT_COLORS[agent]
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <span>{AGENT_ICONS[agent]}</span>
                    <span className="capitalize">{agent}</span>
                  </button>
                ))}
              </div>

              <textarea
                value={singleMessage}
                onChange={(e) => setSingleMessage(e.target.value)}
                rows={4}
                placeholder={`Ask the ${singleAgent} agent…`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={runSingleAgent}
                disabled={singleLoading || !singleMessage.trim()}
                className="mt-3 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {singleLoading ? "Running…" : `▶ Run ${AGENT_ICONS[singleAgent]} ${singleAgent} Agent`}
              </button>
            </div>

            {singleResult && (
              <div className={`rounded-xl border p-5 ${AGENT_COLORS[singleResult.agentRole]}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{AGENT_ICONS[singleResult.agentRole]}</span>
                  <h3 className="font-semibold capitalize">{singleResult.agentRole} Agent Response</h3>
                </div>
                {singleResult.reasoning && (
                  <div className="mb-3">
                    <div className="text-xs font-semibold uppercase tracking-wide mb-1 opacity-70">Reasoning</div>
                    <p className="text-sm">{singleResult.reasoning}</p>
                  </div>
                )}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide mb-1 opacity-70">Output</div>
                  <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-64 bg-white/60 rounded p-2">
                    {JSON.stringify(singleResult.output, null, 2)}
                  </pre>
                </div>
                {singleResult.nextSteps && singleResult.nextSteps.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs font-semibold uppercase tracking-wide mb-1 opacity-70">Next Steps</div>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {singleResult.nextSteps.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === "jobs" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800">Background Jobs</h2>
                <button
                  onClick={loadJobs}
                  disabled={jobsLoading}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  {jobsLoading ? "Loading…" : "↻ Refresh"}
                </button>
              </div>

              {jobs.length === 0 ? (
                <p className="text-gray-500 text-sm">No jobs yet. Start a background job via the API: POST /api/jobs</p>
              ) : (
                <div className="space-y-2">
                  {jobs.map((job) => (
                    <div key={job.jobId} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <code className="text-xs text-gray-500">{job.jobId}</code>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{job.progress}%</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[job.status as keyof typeof STATUS_COLORS] ?? "bg-gray-100"}`}>
                        {job.status}
                      </span>
                      <span className="text-xs text-gray-400">{new Date(job.updatedAt).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* API Reference */}
        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-3">API Reference</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {[
              ["POST /api/agents/{agent}", "Run a specific agent (architect, ui, backend, database, security, performance, devops, code-review)"],
              ["POST /api/reasoning", "Run multi-step reasoning chain with dependency graph"],
              ["POST /api/tools", "Execute a tool (generate_component, modify_file, create_file, etc.)"],
              ["GET /api/tools", "List all available tools"],
              ["GET /api/memory?projectId=x", "Get project memory (short & long term)"],
              ["POST /api/memory", "Update project memory (init, set_architecture, set_task, clear_short_term)"],
              ["POST /api/jobs", "Start a background job (agent_task, multi_agent_pipeline)"],
              ["GET /api/jobs?jobId=x", "Check job status"],
              ["POST /api/generate-site", "Generate site with structured JSON output"],
              ["POST /api/chat", "Simple chat endpoint"],
            ].map(([endpoint, desc]) => (
              <div key={endpoint} className="flex flex-col gap-0.5 p-3 bg-gray-50 rounded-lg">
                <code className="text-blue-600 font-mono text-xs">{endpoint}</code>
                <span className="text-gray-600 text-xs">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
