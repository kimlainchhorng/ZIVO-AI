'use client';

import { useState } from 'react';
import { GitBranch, Database, Brain, UserCheck, Webhook, Clock } from 'lucide-react';
import NavBar from '../components/NavBar';

const COLORS = {
  bg: "#0a0b14",
  bgPanel: "#0f1120",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  borderHover: "rgba(255,255,255,0.16)",
  accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#475569",
};

type StepType = "Generate Code" | "Ask AI" | "Transform" | "Summarize" | "Scrape URL" | "Deploy" | "Security Scan" | "Test Generation" | "API Mock" | "Database Schema" | "CI/CD Pipeline" | "Performance Audit" | "ML Training" | "Data Validation" | "Notification" | "Caching Layer" | "Rate Limiter" | "Auth Middleware" | "File Processing" | "Image Processing";
type StepStatus = "pending" | "running" | "done" | "error";

interface WorkflowStep {
  id: string;
  type: StepType;
  input: string;
  status: StepStatus;
  output?: string;
  error?: string;
}

interface SavedWorkflow {
  id: string;
  name: string;
  steps: Omit<WorkflowStep, "status" | "output" | "error">[];
  savedAt: number;
}

interface RunStats {
  completed: number;
  failed: number;
  elapsed: number;
}

interface RunHistoryEntry {
  id: string;
  name: string;
  ranAt: number;
  completed: number;
  failed: number;
  elapsed: number;
}

const STEP_TYPES: StepType[] = [
  "Generate Code", "Ask AI", "Transform", "Summarize",
  "Scrape URL", "Deploy", "Security Scan",
  "Test Generation", "API Mock", "Database Schema",
  "CI/CD Pipeline", "Performance Audit",
  "ML Training", "Data Validation", "Notification",
  "Caching Layer", "Rate Limiter", "Auth Middleware",
  "File Processing", "Image Processing",
];
const WORKFLOWS_KEY = "zivo_workflows";
const RUN_HISTORY_KEY = "zivo_workflow_runs";

function genId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function loadWorkflows(): SavedWorkflow[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(WORKFLOWS_KEY) ?? "[]"); } catch { return []; }
}

function saveWorkflows(wfs: SavedWorkflow[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(wfs));
}

function loadRunHistory(): RunHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(RUN_HISTORY_KEY) ?? "[]"); } catch { return []; }
}

function saveRunHistory(entries: RunHistoryEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(RUN_HISTORY_KEY, JSON.stringify(entries.slice(0, 5)));
}

const STEP_COLORS: Record<StepType, string> = {
  "Generate Code": "#6366f1",
  "Ask AI": "#8b5cf6",
  "Transform": "#06b6d4",
  "Summarize": "#10b981",
  "Scrape URL": "#f59e0b",
  "Deploy": "#ef4444",
  "Security Scan": "#f97316",
  "Test Generation": "#3b82f6",
  "API Mock": "#a78bfa",
  "Database Schema": "#22c55e",
  "CI/CD Pipeline": "#0ea5e9",
  "Performance Audit": "#fb923c",
  "ML Training": "#ec4899",
  "Data Validation": "#14b8a6",
  "Notification": "#f59e0b",
  "Caching Layer": "#84cc16",
  "Rate Limiter": "#f97316",
  "Auth Middleware": "#a855f7",
  "File Processing": "#06b6d4",
  "Image Processing": "#e11d48",
};

function StepIcon({ type }: { type: StepType }) {
  const color = STEP_COLORS[type];
  const s: React.CSSProperties = { display: "inline-block", flexShrink: 0 };
  if (type === "Generate Code")
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
  if (type === "Ask AI")
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 8v4l3 3"/><circle cx="18" cy="6" r="3" fill={color} stroke="none"/></svg>;
  if (type === "Transform")
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>;
  if (type === "Summarize")
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>;
  if (type === "Scrape URL")
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
  if (type === "Deploy")
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>;
  // Security Scan — shield icon (default fallback for unknown types too)
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
}

const WORKFLOW_TEMPLATES = [
  {
    id: "ci_cd",
    name: "CI/CD Pipeline",
    description: "Validate → Build → Test → Deploy",
    icon: GitBranch,
    steps: [
      { type: "Security Scan" as StepType, input: "Validate source code for syntax errors and lint issues" },
      { type: "Generate Code" as StepType, input: "Build the project and compile TypeScript to JavaScript" },
      { type: "Ask AI" as StepType, input: "Run unit and integration tests, report results" },
      { type: "Deploy" as StepType, input: "Deploy the built artifact to production on Vercel" },
    ],
  },
  {
    id: "data_pipeline",
    name: "Data Pipeline",
    description: "Scrape → Transform → Store → Notify",
    icon: Database,
    steps: [
      { type: "Scrape URL" as StepType, input: "https://news.ycombinator.com" },
      { type: "Transform" as StepType, input: "Extract titles, scores, and links from scraped HTML into structured JSON" },
      { type: "Ask AI" as StepType, input: "Summarize the transformed data and store it as a daily report" },
      { type: "Ask AI" as StepType, input: "Send a Slack notification that the pipeline completed successfully" },
    ],
  },
  {
    id: "ai_research",
    name: "AI Research Chain",
    description: "Fetch articles → Summarize each → Compile report",
    icon: Brain,
    steps: [
      { type: "Scrape URL" as StepType, input: "https://arxiv.org/list/cs.AI/recent" },
      { type: "Ask AI" as StepType, input: "Summarize each article abstract in 2-3 sentences" },
      { type: "Summarize" as StepType, input: "Compile all summaries into a structured weekly AI research digest" },
    ],
  },
  {
    id: "user_onboarding",
    name: "User Onboarding",
    description: "Create account → Send welcome email → Notify team",
    icon: UserCheck,
    steps: [
      { type: "Generate Code" as StepType, input: "Create user account in the database with hashed password and profile defaults" },
      { type: "Ask AI" as StepType, input: "Send a personalized welcome email with getting-started guide" },
      { type: "Ask AI" as StepType, input: "Notify the growth team Slack channel about the new user signup" },
    ],
  },
  {
    id: "webhook_processor",
    name: "Webhook Processor",
    description: "Receive → Validate → Process → Respond",
    icon: Webhook,
    steps: [
      { type: "Ask AI" as StepType, input: "Receive and parse the incoming webhook payload" },
      { type: "Security Scan" as StepType, input: "Validate the webhook signature and payload schema" },
      { type: "Transform" as StepType, input: "Process the event and update the relevant database records" },
      { type: "Ask AI" as StepType, input: "Send a 200 OK response with processing confirmation" },
    ],
  },
  {
    id: "scheduled_report",
    name: "Scheduled Report",
    description: "Query DB → Generate report with AI → Email stakeholders",
    icon: Clock,
    steps: [
      { type: "Ask AI" as StepType, input: "Query the database for last 7 days of key business metrics" },
      { type: "Summarize" as StepType, input: "Generate a comprehensive weekly business report with insights and trends using AI" },
      { type: "Ask AI" as StepType, input: "Email the generated report to all stakeholders and leadership team" },
    ],
  },
  {
    id: "ml_training",
    name: "ML Training Pipeline",
    description: "Preprocess → Train → Evaluate → Deploy Model",
    icon: Brain,
    steps: [
      { type: "Data Validation" as StepType, input: "Validate dataset schema, check for nulls and class imbalance" },
      { type: "Transform" as StepType, input: "Normalize features, encode categoricals, split train/val/test" },
      { type: "ML Training" as StepType, input: "Train a gradient-boosted classifier with cross-validation" },
      { type: "Performance Audit" as StepType, input: "Evaluate model accuracy, precision, recall, F1 and AUC-ROC" },
      { type: "Deploy" as StepType, input: "Package model as a REST inference endpoint and deploy to production" },
    ],
  },
  {
    id: "file_processing",
    name: "File Processing Pipeline",
    description: "Upload → Parse → Validate → Store",
    icon: Database,
    steps: [
      { type: "File Processing" as StepType, input: "Accept CSV/XLSX/PDF file upload, parse into structured rows" },
      { type: "Data Validation" as StepType, input: "Validate column types, required fields, and row count limits" },
      { type: "Transform" as StepType, input: "Normalize values, deduplicate rows, enrich with lookup data" },
      { type: "Ask AI" as StepType, input: "Generate a human-readable summary of the uploaded dataset" },
      { type: "Deploy" as StepType, input: "Store processed data in the database and emit a completion event" },
    ],
  },
  {
    id: "auth_security",
    name: "Auth & Security Pipeline",
    description: "Authenticate → Authorize → Audit → Alert",
    icon: UserCheck,
    steps: [
      { type: "Auth Middleware" as StepType, input: "Validate JWT token, refresh if expiring, reject blacklisted tokens" },
      { type: "Security Scan" as StepType, input: "Check request payload for injection attacks and forbidden patterns" },
      { type: "Rate Limiter" as StepType, input: "Apply per-user sliding-window rate limit of 100 req/min" },
      { type: "Ask AI" as StepType, input: "Log the audit trail entry and summarise the security event" },
      { type: "Notification" as StepType, input: "Send security alert email/Slack if anomaly threshold is exceeded" },
    ],
  },
  {
    id: "notification_broadcast",
    name: "Notification Broadcast",
    description: "Trigger → Personalise → Dispatch → Track",
    icon: Webhook,
    steps: [
      { type: "Ask AI" as StepType, input: "Personalise notification content based on user preferences and history" },
      { type: "Caching Layer" as StepType, input: "Check notification dedup cache to avoid sending duplicates" },
      { type: "Notification" as StepType, input: "Dispatch via email, push notification, and Slack in parallel" },
      { type: "Transform" as StepType, input: "Record delivery status and update notification_log table" },
    ],
  },
  {
    id: "image_pipeline",
    name: "Image Processing Pipeline",
    description: "Upload → Process → Optimise → Serve",
    icon: GitBranch,
    steps: [
      { type: "File Processing" as StepType, input: "Accept image upload (JPEG/PNG/WebP), validate MIME type and size" },
      { type: "Image Processing" as StepType, input: "Resize to 3 breakpoints (320/768/1280px), convert to WebP" },
      { type: "Security Scan" as StepType, input: "Scan image for NSFW content using moderation API" },
      { type: "Deploy" as StepType, input: "Upload processed variants to CDN and update asset database record" },
    ],
  },
];

export default function WorkflowPage() {
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [running, setRunning] = useState(false);
  const [workflowName, setWorkflowName] = useState("My Workflow");
  const [savedWorkflows, setSavedWorkflows] = useState<SavedWorkflow[]>(() => loadWorkflows());
  const [showSaved, setShowSaved] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [runStats, setRunStats] = useState<RunStats | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [progress, setProgress] = useState(0);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  function addStep(type: StepType = "Ask AI") {
    setSteps((prev) => [...prev, { id: genId(), type, input: "", status: "pending" }]);
  }

  function removeStep(id: string) {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }

  function updateStep(id: string, patch: Partial<WorkflowStep>) {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function moveStepUp(id: string) {
    setSteps((prev) => {
      const i = prev.findIndex((s) => s.id === id);
      if (i <= 0) return prev;
      const next = [...prev];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      return next;
    });
  }

  function moveStepDown(id: string) {
    setSteps((prev) => {
      const i = prev.findIndex((s) => s.id === id);
      if (i >= prev.length - 1) return prev;
      const next = [...prev];
      [next[i], next[i + 1]] = [next[i + 1], next[i]];
      return next;
    });
  }

  function duplicateStep(id: string) {
    setSteps((prev) => {
      const step = prev.find((s) => s.id === id);
      if (!step) return prev;
      const idx = prev.findIndex((s) => s.id === id);
      const clone: WorkflowStep = { ...step, id: genId(), status: "pending", output: undefined, error: undefined };
      const next = [...prev];
      next.splice(idx + 1, 0, clone);
      return next;
    });
  }

  async function runWorkflow() {
    if (steps.length === 0 || running) return;

    setSteps((prev) => prev.map((s) => ({ ...s, status: "pending", output: undefined, error: undefined })));
    setRunning(true);
    setRunStats(null);
    setProgress(0);

    const stepsToRun = steps.map((s) => ({ id: s.id, type: s.type, input: s.input }));
    setSteps((prev) => prev.map((s, i) => (i === 0 ? { ...s, status: "running" } : s)));

    const startTime = Date.now();

    try {
      const res = await fetch("/api/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps: stepsToRun }),
      });
      const data = await res.json();

      if (data.results && Array.isArray(data.results)) {
        const results = data.results as Array<{ id: string; output: string; status: string; error?: string }>;
        setSteps((prev) =>
          prev.map((s) => {
            const result = results.find((r) => r.id === s.id);
            if (!result) return s;
            return { ...s, status: result.status as StepStatus, output: result.output, error: result.error };
          })
        );
        const completed = results.filter((r) => r.status === "done").length;
        const failed = results.filter((r) => r.status === "error").length;
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        const stats: RunStats = { completed, failed, elapsed };
        setRunStats(stats);
        setProgress(100);

        // Save to run history
        const histEntry: RunHistoryEntry = { id: genId(), name: workflowName, ranAt: Date.now(), ...stats };
        const hist = loadRunHistory();
        saveRunHistory([histEntry, ...hist]);
      }
    } catch {
      setSteps((prev) => prev.map((s) => ({ ...s, status: "error", error: "Request failed" })));
    }

    setRunning(false);
  }

  function saveWorkflow() {
    const wf: SavedWorkflow = {
      id: genId(),
      name: workflowName,
      steps: steps.map((s) => ({ id: s.id, type: s.type, input: s.input })),
      savedAt: Date.now(),
    };
    const updated = [wf, ...savedWorkflows.filter((w) => w.name !== workflowName)];
    saveWorkflows(updated);
    setSavedWorkflows(updated);
  }

  function loadWorkflow(wf: SavedWorkflow) {
    setWorkflowName(wf.name);
    setSteps(wf.steps.map((s) => ({ ...s, status: "pending" })));
    setShowSaved(false);
    setRunStats(null);
  }

  function deleteWorkflow(id: string) {
    const updated = savedWorkflows.filter((w) => w.id !== id);
    saveWorkflows(updated);
    setSavedWorkflows(updated);
  }

  function loadTemplate(tpl: typeof WORKFLOW_TEMPLATES[number]) {
    setWorkflowName(tpl.name);
    setSteps(tpl.steps.map((s) => ({ id: genId(), ...s, status: "pending" as StepStatus })));
    setShowTemplates(false);
    setRunStats(null);
    setAiExplanation(null);
  }

  async function generateWithAI() {
    if (!aiPrompt.trim() || aiGenerating) return;
    setAiGenerating(true);
    setAiError(null);
    setAiExplanation(null);
    try {
      const res = await fetch('/api/workflow/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt.trim() }),
      });
      const data = await res.json() as {
        workflow?: { name?: string; steps?: Array<{ id?: string; type?: string; label?: string; config?: Record<string, unknown> }> };
        explanation?: string;
        error?: string;
      };
      if (!res.ok || data.error) {
        setAiError(data.error ?? 'Generation failed');
        return;
      }
      if (data.workflow) {
        const wf = data.workflow;
        if (wf.name) setWorkflowName(wf.name);
        if (Array.isArray(wf.steps) && wf.steps.length > 0) {
          setSteps(wf.steps.map((s) => ({
            id: genId(),
            type: (s.type ?? 'Ask AI') as StepType,
            input: s.config ? JSON.stringify(s.config) : (s.label ?? ''),
            status: 'pending' as StepStatus,
          })));
        }
        setAiExplanation(data.explanation ?? null);
        setRunStats(null);
      }
    } catch {
      setAiError('Request failed. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  }

  const statusIcon: Record<StepStatus, string> = {
    pending: "○",
    running: "⟳",
    done: "✓",
    error: "✗",
  };

  const statusColor: Record<StepStatus, string> = {
    pending: COLORS.textMuted,
    running: COLORS.warning,
    done: COLORS.success,
    error: COLORS.error,
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes progressBar { from { width: 0%; } to { width: 100%; } }
        @keyframes connectorPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        .zwf-btn:hover { opacity: 0.85; }
        .zwf-step-card { transition: box-shadow 0.2s, border-color 0.2s, transform 0.15s; }
        .zwf-step-card:hover { box-shadow: 0 4px 24px rgba(99,102,241,0.12); transform: translateY(-1px); }
        .zwf-remove:hover { color: #ef4444 !important; }
        .zwf-icon-btn:hover { background: rgba(255,255,255,0.08) !important; }
        .severity-critical { color: #ef4444; background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); }
        .severity-high { color: #f97316; background: rgba(249,115,22,0.1); border-color: rgba(249,115,22,0.3); }
        .severity-medium { color: #f59e0b; background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.3); }
        .severity-low { color: #3b82f6; background: rgba(59,130,246,0.1); border-color: rgba(59,130,246,0.3); }
        .severity-info { color: #94a3b8; background: rgba(148,163,184,0.1); border-color: rgba(148,163,184,0.3); }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: COLORS.bg, color: COLORS.textPrimary, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
        <NavBar />

        {/* Progress Bar */}
        {running && (
          <div style={{ height: '3px', background: COLORS.border, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', background: COLORS.accentGradient, transition: 'width 0.5s ease', width: `${progress}%` }} />
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', gap: 0, maxWidth: '1400px', margin: '0 auto', width: '100%' }}>

          {/* Left Sidebar */}
          <div style={{ width: '280px', flexShrink: 0, borderRight: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Add Steps */}
            <div>
              <p style={{ margin: '0 0 0.6rem', fontSize: '0.75rem', fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Add Step</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {STEP_TYPES.map((type) => (
                  <button
                    key={type}
                    className="zwf-btn"
                    onClick={() => addStep(type)}
                    style={{ padding: '0.45rem 0.75rem', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: '8px', color: COLORS.textSecondary, cursor: 'pointer', fontSize: '0.8125rem', transition: 'opacity 0.15s', display: 'flex', alignItems: 'center', gap: '0.5rem', textAlign: 'left' }}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: STEP_COLORS[type], flexShrink: 0 }} />
                    <StepIcon type={type} />
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Templates */}
            <div>
              <button
                className="zwf-btn"
                onClick={() => setShowTemplates(!showTemplates)}
                style={{ width: '100%', padding: '0.45rem 0.75rem', background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: '8px', color: COLORS.textSecondary, cursor: 'pointer', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'opacity 0.15s' }}
              >
                <span style={{ fontWeight: 600, color: COLORS.textPrimary, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Templates</span>
                <span style={{ fontSize: '0.75rem' }}>{showTemplates ? '▲' : '▼'}</span>
              </button>
              {showTemplates && (
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', animation: 'slideDown 0.2s ease' }}>
                  {WORKFLOW_TEMPLATES.map((tpl) => {
                    const Icon = tpl.icon;
                    return (
                      <button
                        key={tpl.id}
                        className="zwf-btn"
                        onClick={() => loadTemplate(tpl)}
                        style={{ padding: '0.6rem 0.75rem', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: '8px', color: COLORS.textPrimary, cursor: 'pointer', fontSize: '0.8125rem', textAlign: 'left', transition: 'opacity 0.15s' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <Icon size={14} style={{ color: COLORS.accent, flexShrink: 0 }} />
                          <span style={{ fontWeight: 600 }}>{tpl.name}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>{tpl.description}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Saved Workflows */}
            <div>
              <button
                className="zwf-btn"
                onClick={() => setShowSaved(!showSaved)}
                style={{ width: '100%', padding: '0.45rem 0.75rem', background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: '8px', color: COLORS.textSecondary, cursor: 'pointer', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'opacity 0.15s' }}
              >
                <span style={{ fontWeight: 600, color: COLORS.textPrimary, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Saved ({savedWorkflows.length})</span>
                <span style={{ fontSize: '0.75rem' }}>{showSaved ? '▲' : '▼'}</span>
              </button>
              {showSaved && (
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', animation: 'slideDown 0.2s ease' }}>
                  {savedWorkflows.length === 0 ? (
                    <p style={{ fontSize: '0.8125rem', color: COLORS.textMuted, margin: '0.35rem 0' }}>No saved workflows yet.</p>
                  ) : savedWorkflows.map((wf) => (
                    <div key={wf.id} style={{ padding: '0.5rem 0.75rem', background: COLORS.bgCard, borderRadius: '8px', border: `1px solid ${COLORS.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                        <span style={{ fontSize: '0.8125rem', color: COLORS.textPrimary, fontWeight: 500 }}>{wf.name}</span>
                        <span style={{ fontSize: '0.7rem', color: COLORS.textMuted }}>{wf.steps.length} steps</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button onClick={() => loadWorkflow(wf)} style={{ flex: 1, padding: '0.2rem 0.5rem', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '5px', color: COLORS.accent, cursor: 'pointer', fontSize: '0.75rem' }}>Load</button>
                        <button onClick={() => deleteWorkflow(wf.id)} style={{ padding: '0.2rem 0.5rem', background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: '5px', color: COLORS.error, cursor: 'pointer', fontSize: '0.75rem' }}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.5rem 2rem', gap: '1.25rem', overflowY: 'auto', animation: 'fadeIn 0.4s ease' }}>

            {/* Generate with AI */}
            <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: '14px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Generate with AI</p>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) generateWithAI(); }}
                placeholder="e.g. Fetch data from my API, summarize it with AI, then send an email notification"
                rows={3}
                style={{ width: '100%', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: '8px', color: COLORS.textPrimary, padding: '0.65rem 0.85rem', fontSize: '0.875rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  className="zwf-btn"
                  onClick={generateWithAI}
                  disabled={aiGenerating || !aiPrompt.trim()}
                  style={{ padding: '0.5rem 1.25rem', background: aiGenerating || !aiPrompt.trim() ? 'rgba(99,102,241,0.3)' : COLORS.accentGradient, border: 'none', borderRadius: '8px', color: '#fff', cursor: aiGenerating || !aiPrompt.trim() ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'opacity 0.15s' }}
                >
                  {aiGenerating ? (
                    <><span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Generating…</>
                  ) : '✦ Generate Workflow'}
                </button>
                {aiGenerating && <span style={{ fontSize: '0.8125rem', color: COLORS.textMuted }}>AI is designing your workflow…</span>}
              </div>
              {aiError && (
                <div style={{ padding: '0.6rem 0.85rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', fontSize: '0.8125rem', color: COLORS.error }}>
                  {aiError}
                </div>
              )}
              {aiExplanation && (
                <div style={{ padding: '0.6rem 0.85rem', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '8px', fontSize: '0.8125rem', color: COLORS.textSecondary, animation: 'slideDown 0.3s ease' }}>
                  ✦ {aiExplanation}
                </div>
              )}
            </div>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <input
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', fontWeight: 700, color: COLORS.textPrimary, outline: 'none', minWidth: '200px', letterSpacing: '-0.02em' }}
              />
              <div style={{ flex: 1 }} />
              <button className="zwf-btn" onClick={saveWorkflow} disabled={steps.length === 0} style={{ padding: '0.45rem 0.85rem', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: '8px', color: COLORS.textSecondary, cursor: steps.length === 0 ? 'not-allowed' : 'pointer', fontSize: '0.8125rem', opacity: steps.length === 0 ? 0.5 : 1, transition: 'opacity 0.15s' }}>
                Save
              </button>
              <button
                className="zwf-btn"
                onClick={runWorkflow}
                disabled={running || steps.length === 0}
                style={{ padding: '0.45rem 1.25rem', background: running || steps.length === 0 ? 'rgba(99,102,241,0.3)' : COLORS.accentGradient, border: 'none', borderRadius: '8px', color: '#fff', cursor: running || steps.length === 0 ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'opacity 0.15s' }}
              >
                {running ? (
                  <><span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Running…</>
                ) : '▶ Run Workflow'}
              </button>
            </div>

            {/* Stats Bar */}
            {runStats && (
              <div style={{ display: 'flex', gap: '1rem', padding: '0.65rem 1rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', animation: 'slideDown 0.3s ease', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8125rem', color: COLORS.success }}><strong>{runStats.completed}</strong> completed</span>
                {runStats.failed > 0 && <span style={{ fontSize: '0.8125rem', color: COLORS.error }}><strong>{runStats.failed}</strong> failed</span>}
                <span style={{ fontSize: '0.8125rem', color: COLORS.textMuted }}>Elapsed: <strong style={{ color: COLORS.textSecondary }}>{runStats.elapsed}s</strong></span>
              </div>
            )}

            {/* Steps */}
            {steps.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', textAlign: 'center', color: COLORS.textMuted, border: `2px dashed ${COLORS.border}`, borderRadius: '16px' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(99,102,241,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem', animation: 'pulse 2s infinite' }}><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                <p style={{ fontSize: '1rem', marginBottom: '0.5rem', color: COLORS.textSecondary }}>No steps yet</p>
                <p style={{ fontSize: '0.875rem' }}>Add steps from the left panel or pick a template to get started</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {steps.map((step, index) => (
                  <div key={step.id}>
                    {index > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'center', margin: '0', position: 'relative', height: '28px', alignItems: 'center' }}>
                        <div style={{ width: '2px', height: '28px', background: `linear-gradient(to bottom, ${STEP_COLORS[steps[index-1]?.type] ?? COLORS.border}44, ${STEP_COLORS[step.type]}44)`, position: 'relative' }}>
                          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '6px', height: '6px', borderRadius: '50%', background: STEP_COLORS[step.type], animation: 'connectorPulse 1.5s infinite' }} />
                        </div>
                      </div>
                    )}
                    <div
                      className="zwf-step-card"
                      style={{ background: COLORS.bgCard, border: `1px solid ${step.status === 'running' ? COLORS.warning : step.status === 'done' ? 'rgba(16,185,129,0.3)' : step.status === 'error' ? 'rgba(239,68,68,0.3)' : COLORS.border}`, borderRadius: '12px', overflow: 'hidden', position: 'relative' }}
                    >
                      {/* Color bar */}
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: STEP_COLORS[step.type], borderRadius: '12px 0 0 12px' }} />

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem 0.75rem 1.25rem', cursor: 'pointer' }} onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${STEP_COLORS[step.type]}22`, border: `1px solid ${STEP_COLORS[step.type]}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <StepIcon type={step.type} />
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: COLORS.textMuted, flexShrink: 0 }}>#{index + 1}</span>
                        <select
                          value={step.type}
                          onChange={(e) => { e.stopPropagation(); updateStep(step.id, { type: e.target.value as StepType }); }}
                          onClick={(e) => e.stopPropagation()}
                          style={{ background: 'transparent', border: 'none', color: COLORS.textPrimary, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
                        >
                          {STEP_TYPES.map((t) => <option key={t} value={t} style={{ background: COLORS.bgPanel }}>{t}</option>)}
                        </select>
                        <div style={{ flex: 1 }} />
                        {/* Move buttons */}
                        <button
                          className="zwf-icon-btn"
                          onClick={(e) => { e.stopPropagation(); moveStepUp(step.id); }}
                          title="Move up"
                          style={{ background: 'transparent', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: '0.75rem', padding: '0.2rem 0.3rem', borderRadius: '4px', transition: 'background 0.15s', opacity: index === 0 ? 0.3 : 1 }}
                          disabled={index === 0}
                        >▲</button>
                        <button
                          className="zwf-icon-btn"
                          onClick={(e) => { e.stopPropagation(); moveStepDown(step.id); }}
                          title="Move down"
                          style={{ background: 'transparent', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: '0.75rem', padding: '0.2rem 0.3rem', borderRadius: '4px', transition: 'background 0.15s', opacity: index === steps.length - 1 ? 0.3 : 1 }}
                          disabled={index === steps.length - 1}
                        >▼</button>
                        {/* Duplicate */}
                        <button
                          className="zwf-icon-btn"
                          onClick={(e) => { e.stopPropagation(); duplicateStep(step.id); }}
                          title="Duplicate"
                          style={{ background: 'transparent', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: '0.75rem', padding: '0.2rem 0.3rem', borderRadius: '4px', transition: 'background 0.15s' }}
                        >□</button>
                        <span style={{ fontSize: '0.875rem', color: statusColor[step.status], fontWeight: step.status === 'running' ? 700 : 400, animation: step.status === 'running' ? 'spin 1s linear infinite' : 'none', display: 'inline-block' }}>{statusIcon[step.status]}</span>
                        <button className="zwf-remove" onClick={(e) => { e.stopPropagation(); removeStep(step.id); }} style={{ background: 'transparent', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: '1.1rem', transition: 'color 0.15s' }}>×</button>
                      </div>
                      {expandedStep === step.id && (
                        <div style={{ padding: '0 1rem 0.75rem 1.25rem', borderTop: `1px solid ${COLORS.border}`, animation: 'slideDown 0.2s ease' }}>
                          <textarea
                            value={step.input}
                            onChange={(e) => updateStep(step.id, { input: e.target.value })}
                            placeholder={`Enter input for ${step.type} step...`}
                            rows={3}
                            style={{ width: '100%', background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: '8px', padding: '0.6rem 0.75rem', color: COLORS.textPrimary, fontSize: '0.8125rem', resize: 'vertical', outline: 'none', marginTop: '0.75rem' }}
                          />
                          {step.output && (
                            <div style={{ marginTop: '0.75rem' }}>
                              <p style={{ margin: '0 0 0.35rem', fontSize: '0.75rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Output</p>
                              <pre style={{ background: COLORS.bgPanel, border: `1px solid rgba(16,185,129,0.2)`, borderRadius: '8px', padding: '0.75rem', fontSize: '0.8125rem', color: COLORS.textPrimary, maxHeight: '240px', overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>{step.output}</pre>
                            </div>
                          )}
                          {step.error && (
                            <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', fontSize: '0.8125rem', color: COLORS.error }}>{step.error}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
