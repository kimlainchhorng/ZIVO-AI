'use client';

import { useState, useEffect } from 'react';
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

type StepType = "Generate Code" | "Ask AI" | "Transform" | "Summarize" | "Scrape URL" | "Deploy";
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

const STEP_TYPES: StepType[] = ["Generate Code", "Ask AI", "Transform", "Summarize", "Scrape URL", "Deploy"];
const WORKFLOWS_KEY = "zivo_workflows";

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

const STEP_COLORS: Record<StepType, string> = {
  "Generate Code": "#6366f1",
  "Ask AI": "#8b5cf6",
  "Transform": "#06b6d4",
  "Summarize": "#10b981",
  "Scrape URL": "#f59e0b",
  "Deploy": "#ef4444",
};

export default function WorkflowPage() {
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [running, setRunning] = useState(false);
  const [workflowName, setWorkflowName] = useState("My Workflow");
  const [savedWorkflows, setSavedWorkflows] = useState<SavedWorkflow[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  useEffect(() => {
    setSavedWorkflows(loadWorkflows());
  }, []);

  function addStep(type: StepType = "Ask AI") {
    setSteps((prev) => [...prev, { id: genId(), type, input: "", status: "pending" }]);
  }

  function removeStep(id: string) {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }

  function updateStep(id: string, patch: Partial<WorkflowStep>) {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  async function runWorkflow() {
    if (steps.length === 0 || running) return;

    // Reset statuses
    setSteps((prev) => prev.map((s) => ({ ...s, status: "pending", output: undefined, error: undefined })));
    setRunning(true);

    const stepsToRun = steps.map((s) => ({ id: s.id, type: s.type, input: s.input }));

    // Set first step to running
    setSteps((prev) => prev.map((s, i) => (i === 0 ? { ...s, status: "running" } : s)));

    try {
      const res = await fetch("/api/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps: stepsToRun }),
      });
      const data = await res.json();

      if (data.results && Array.isArray(data.results)) {
        setSteps((prev) =>
          prev.map((s) => {
            const result = (data.results as Array<{ id: string; output: string; status: string; error?: string }>).find((r) => r.id === s.id);
            if (!result) return s;
            return {
              ...s,
              status: result.status as StepStatus,
              output: result.output,
              error: result.error,
            };
          })
        );
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
  }

  function deleteWorkflow(id: string) {
    const updated = savedWorkflows.filter((w) => w.id !== id);
    saveWorkflows(updated);
    setSavedWorkflows(updated);
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
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        .zwf-btn:hover { opacity: 0.85; }
        .zwf-step:hover { border-color: rgba(255,255,255,0.16) !important; }
        .zwf-remove:hover { color: #ef4444 !important; }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: COLORS.bg, color: COLORS.textPrimary, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
        <NavBar />
        <div style={{ flex: 1, display: 'flex', gap: '1.5rem', padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>

          {/* Main workflow area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.4s ease' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <input
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', fontWeight: 700, color: COLORS.textPrimary, outline: 'none', minWidth: '200px', letterSpacing: '-0.02em' }}
              />
              <div style={{ flex: 1 }} />
              <button className="zwf-btn" onClick={() => setShowSaved(!showSaved)} style={{ padding: '0.45rem 0.85rem', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: '8px', color: COLORS.textSecondary, cursor: 'pointer', fontSize: '0.8125rem', transition: 'opacity 0.15s' }}>
                {showSaved ? 'Hide Saved' : `Saved (${savedWorkflows.length})`}
              </button>
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

            {/* Saved workflows panel */}
            {showSaved && (
              <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: '12px', padding: '1rem', animation: 'fadeIn 0.3s ease' }}>
                <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 600, color: COLORS.textSecondary }}>Saved Workflows</h3>
                {savedWorkflows.length === 0 ? (
                  <p style={{ fontSize: '0.8125rem', color: COLORS.textMuted, margin: 0 }}>No saved workflows yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {savedWorkflows.map((wf) => (
                      <div key={wf.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', background: COLORS.bgPanel, borderRadius: '8px', border: `1px solid ${COLORS.border}` }}>
                        <span style={{ flex: 1, fontSize: '0.875rem', color: COLORS.textPrimary }}>{wf.name}</span>
                        <span style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>{wf.steps.length} steps</span>
                        <button onClick={() => loadWorkflow(wf)} style={{ padding: '0.25rem 0.65rem', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '6px', color: COLORS.accent, cursor: 'pointer', fontSize: '0.75rem' }}>Load</button>
                        <button onClick={() => deleteWorkflow(wf.id)} style={{ padding: '0.25rem 0.65rem', background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: '6px', color: COLORS.error, cursor: 'pointer', fontSize: '0.75rem' }}>Delete</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Steps */}
            {steps.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', textAlign: 'center', color: COLORS.textMuted, border: `2px dashed ${COLORS.border}`, borderRadius: '16px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
                <p style={{ fontSize: '1rem', marginBottom: '0.5rem', color: COLORS.textSecondary }}>No steps yet</p>
                <p style={{ fontSize: '0.875rem' }}>Add steps below to build your workflow</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {steps.map((step, index) => (
                  <div key={step.id}>
                    {index > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'center', margin: '0.25rem 0' }}>
                        <div style={{ width: '2px', height: '20px', background: COLORS.border }} />
                      </div>
                    )}
                    <div
                      className="zwf-step"
                      style={{ background: COLORS.bgCard, border: `1px solid ${step.status === 'running' ? COLORS.warning : step.status === 'done' ? 'rgba(16,185,129,0.3)' : step.status === 'error' ? 'rgba(239,68,68,0.3)' : COLORS.border}`, borderRadius: '12px', overflow: 'hidden', transition: 'border-color 0.2s' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', cursor: 'pointer' }} onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${STEP_COLORS[step.type]}22`, border: `1px solid ${STEP_COLORS[step.type]}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: STEP_COLORS[step.type], flexShrink: 0 }}>{index + 1}</div>
                        <select
                          value={step.type}
                          onChange={(e) => { e.stopPropagation(); updateStep(step.id, { type: e.target.value as StepType }); }}
                          onClick={(e) => e.stopPropagation()}
                          style={{ background: 'transparent', border: 'none', color: COLORS.textPrimary, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
                        >
                          {STEP_TYPES.map((t) => <option key={t} value={t} style={{ background: COLORS.bgPanel }}>{t}</option>)}
                        </select>
                        <div style={{ flex: 1 }} />
                        <span style={{ fontSize: '0.875rem', color: statusColor[step.status], fontWeight: step.status === 'running' ? 700 : 400, animation: step.status === 'running' ? 'spin 1s linear infinite' : 'none', display: 'inline-block' }}>{statusIcon[step.status]}</span>
                        <button className="zwf-remove" onClick={(e) => { e.stopPropagation(); removeStep(step.id); }} style={{ background: 'transparent', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: '1.1rem', transition: 'color 0.15s' }}>×</button>
                      </div>
                      {expandedStep === step.id && (
                        <div style={{ padding: '0 1rem 0.75rem', borderTop: `1px solid ${COLORS.border}` }}>
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
                              <div style={{ background: COLORS.bgPanel, border: `1px solid rgba(16,185,129,0.2)`, borderRadius: '8px', padding: '0.6rem 0.75rem', fontSize: '0.8125rem', color: COLORS.textPrimary, maxHeight: '200px', overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{step.output}</div>
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

            {/* Add step */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {STEP_TYPES.map((type) => (
                <button
                  key={type}
                  className="zwf-btn"
                  onClick={() => addStep(type)}
                  style={{ padding: '0.4rem 0.85rem', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: '20px', color: COLORS.textSecondary, cursor: 'pointer', fontSize: '0.8125rem', transition: 'opacity 0.15s', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <span style={{ color: STEP_COLORS[type], fontSize: '0.7rem' }}>●</span> + {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
