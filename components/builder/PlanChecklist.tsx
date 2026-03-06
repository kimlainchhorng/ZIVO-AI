'use client';

/**
 * components/builder/PlanChecklist.tsx
 *
 * Right-side drawer panel showing the current change plan and providing
 * controls to approve, reject, apply, and verify.
 *
 * Usage:
 *   <PlanChecklist projectId={id} token={token} />
 */

import { useState, useCallback, useEffect } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Play,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileCode2,
  ListChecks,
  Zap,
  RefreshCw,
} from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────

/** Delay (ms) before refreshing plan status after triggering a verify run. */
const VERIFY_REFRESH_DELAY_MS = 3000;

// ─── Types ─────────────────────────────────────────────────────────────────────

export type PlanStatus =
  | 'draft'
  | 'awaiting_approval'
  | 'approved'
  | 'rejected'
  | 'applied'
  | 'verified'
  | 'failed';

export interface PlanJson {
  steps: string[];
  planned_files: string[];
  checklist: string[];
  risks: string[];
}

export interface ChangePlan {
  id: string;
  project_id: string;
  created_at: string;
  updated_at: string;
  status: PlanStatus;
  plan_json: PlanJson;
  approved_at: string | null;
  approved_by_user_id: string | null;
  apply_attempts: number;
  max_apply_attempts: number;
  verification_run_id: string | null;
  result_json: unknown | null;
}

interface PlanChecklistProps {
  projectId: string;
  token: string;
  /** Called after changes are successfully applied so the parent can refresh files/builds. */
  onApplied?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(status: PlanStatus): string {
  switch (status) {
    case 'approved': return '#10b981';
    case 'verified': return '#10b981';
    case 'applied': return '#6366f1';
    case 'failed': return '#ef4444';
    case 'rejected': return '#ef4444';
    case 'awaiting_approval': return '#f59e0b';
    default: return '#64748b';
  }
}

function statusLabel(status: PlanStatus): string {
  switch (status) {
    case 'draft': return 'Draft';
    case 'awaiting_approval': return 'Awaiting Approval';
    case 'approved': return 'Approved ✓';
    case 'rejected': return 'Rejected';
    case 'applied': return 'Applied';
    case 'verified': return 'Verified ✓';
    case 'failed': return 'Failed ✗';
  }
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function PlanChecklist({ projectId, token, onApplied }: PlanChecklistProps) {
  const [plan, setPlan] = useState<ChangePlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);

  // Generate plan state
  const [instruction, setInstruction] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Action states
  const [approving, setApproving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [applyResult, setApplyResult] = useState<{ buildId: string; buildNumber: number } | null>(null);
  const [verifyRunId, setVerifyRunId] = useState<string | null>(null);

  // Collapse state for sections
  const [showSteps, setShowSteps] = useState(true);
  const [showFiles, setShowFiles] = useState(true);
  const [showChecklist, setShowChecklist] = useState(true);
  const [showRisks, setShowRisks] = useState(false);

  // ── Fetch latest plan ──────────────────────────────────────────────────────

  const fetchPlan = useCallback(async () => {
    if (!token || !projectId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/plan/latest`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json() as { plan: ChangePlan | null };
      setPlan(data.plan ?? null);
    } catch {
      // silently ignore
    } finally {
      setLoadingPlan(false);
    }
  }, [token, projectId]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  // ── Generate plan ──────────────────────────────────────────────────────────

  async function handleGenerate() {
    if (!token || !instruction.trim() || generating) return;
    setGenerating(true);
    setGenerateError(null);
    setActionError(null);
    setApplyResult(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/plan`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction: instruction.trim() }),
      });
      const data = await res.json() as { plan?: ChangePlan; error?: string };
      if (!res.ok) throw new Error(data.error ?? `Failed to generate plan (${res.status})`);
      setPlan(data.plan ?? null);
      setInstruction('');
    } catch (err: unknown) {
      setGenerateError((err as Error).message ?? 'Failed to generate plan');
    } finally {
      setGenerating(false);
    }
  }

  // ── Approve plan ───────────────────────────────────────────────────────────

  async function handleApprove() {
    if (!plan || approving) return;
    setApproving(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/plan/${plan.id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as { plan?: ChangePlan; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Approval failed');
      setPlan(data.plan ?? null);
    } catch (err: unknown) {
      setActionError((err as Error).message ?? 'Approval failed');
    } finally {
      setApproving(false);
    }
  }

  // ── Reject / Revise plan ──────────────────────────────────────────────────

  function handleReject() {
    // Clear current plan so the user can generate a fresh one
    setPlan(null);
    setActionError(null);
    setApplyResult(null);
  }

  // ── Apply plan ─────────────────────────────────────────────────────────────

  async function handleApply() {
    if (!plan || applying) return;
    setApplying(true);
    setActionError(null);
    setApplyResult(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/plan/${plan.id}/apply`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json() as { buildId?: string; buildNumber?: number; plan?: ChangePlan; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Apply failed');
      if (data.plan) setPlan(data.plan);
      if (data.buildId) setApplyResult({ buildId: data.buildId, buildNumber: data.buildNumber ?? 0 });
      onApplied?.();
    } catch (err: unknown) {
      setActionError((err as Error).message ?? 'Apply failed');
    } finally {
      setApplying(false);
    }
  }

  // ── Verify plan ────────────────────────────────────────────────────────────

  async function handleVerify() {
    if (!plan || verifying) return;
    setVerifying(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/plan/${plan.id}/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as { runId?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Verify failed');
      setVerifyRunId(data.runId ?? null);
      // Refresh plan status after a short delay to allow the async job to start
      setTimeout(fetchPlan, VERIFY_REFRESH_DELAY_MS);
    } catch (err: unknown) {
      setActionError((err as Error).message ?? 'Verify failed');
    } finally {
      setVerifying(false);
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loadingPlan) {
    return (
      <div style={s.panel}>
        <div style={s.panelHeader}>
          <ClipboardList size={16} color="#818cf8" />
          <span style={s.panelTitle}>Plan &amp; Checklist</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', padding: '1rem 0' }}>
          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div style={s.panel}>
      {/* ── Panel header ── */}
      <div style={s.panelHeader}>
        <ClipboardList size={16} color="#818cf8" />
        <span style={s.panelTitle}>Plan &amp; Checklist</span>
        <button onClick={fetchPlan} title="Refresh" style={s.iconBtn}>
          <RefreshCw size={12} />
        </button>
      </div>

      {/* ── Generate plan form ── */}
      {!plan && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <p style={s.desc}>
            Describe what you want to change. The AI will propose a plan for your approval before touching any files.
          </p>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="e.g. Add a dark mode toggle and update all color tokens…"
            disabled={generating}
            rows={3}
            style={s.textarea}
          />
          <button
            onClick={handleGenerate}
            disabled={generating || !instruction.trim()}
            style={{
              ...s.primaryBtn,
              opacity: generating || !instruction.trim() ? 0.5 : 1,
              cursor: generating || !instruction.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {generating
              ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
              : <><Zap size={13} /> Generate Plan</>}
          </button>
          {generateError && (
            <div style={s.errorBox}><AlertTriangle size={13} /> {generateError}</div>
          )}
        </div>
      )}

      {/* ── Plan display ── */}
      {plan && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

          {/* Status row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{
              padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
              background: `${statusColor(plan.status)}20`,
              color: statusColor(plan.status),
              border: `1px solid ${statusColor(plan.status)}40`,
            }}>
              {statusLabel(plan.status)}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#475569', marginLeft: 'auto' }}>
              {new Date(plan.created_at).toLocaleString()}
            </span>
          </div>

          {/* Approval timestamps */}
          {plan.approved_at && (
            <div style={{ fontSize: '0.73rem', color: '#475569' }}>
              Approved: {new Date(plan.approved_at).toLocaleString()}
            </div>
          )}

          {/* Apply result */}
          {applyResult && (
            <div style={s.successBox}>
              <CheckCircle2 size={13} />
              Build #{applyResult.buildNumber} complete · ID: <code style={{ color: '#818cf8', fontSize: '0.72rem' }}>{applyResult.buildId}</code>
            </div>
          )}

          {/* Verify run ID */}
          {verifyRunId && (
            <div style={{ fontSize: '0.73rem', color: '#64748b' }}>
              Verification run: <code style={{ color: '#818cf8' }}>{verifyRunId}</code>
            </div>
          )}

          {/* Action error */}
          {actionError && (
            <div style={s.errorBox}><AlertTriangle size={13} /> {actionError}</div>
          )}

          {/* ── Action buttons ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Approve */}
            {(plan.status === 'awaiting_approval' || plan.status === 'draft') && (
              <button
                onClick={handleApprove}
                disabled={approving}
                style={{ ...s.primaryBtn, opacity: approving ? 0.6 : 1, cursor: approving ? 'not-allowed' : 'pointer' }}
              >
                {approving
                  ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Approving…</>
                  : <><CheckCircle2 size={13} /> Approve Plan</>}
              </button>
            )}

            {/* Apply */}
            {plan.status === 'approved' && (
              <button
                onClick={handleApply}
                disabled={applying}
                style={{
                  ...s.primaryBtn,
                  background: 'linear-gradient(135deg,#10b981,#059669)',
                  opacity: applying ? 0.6 : 1, cursor: applying ? 'not-allowed' : 'pointer',
                }}
              >
                {applying
                  ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Applying…</>
                  : <><Play size={13} fill="currentColor" /> Apply Changes</>}
              </button>
            )}

            {/* Verify */}
            {plan.status === 'applied' && (
              <button
                onClick={handleVerify}
                disabled={verifying}
                style={{
                  ...s.primaryBtn,
                  background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                  opacity: verifying ? 0.6 : 1, cursor: verifying ? 'not-allowed' : 'pointer',
                }}
              >
                {verifying
                  ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Verifying…</>
                  : <><ShieldCheck size={13} /> Verify</>}
              </button>
            )}

            {/* Reject & Revise — available when awaiting or approved */}
            {['awaiting_approval', 'approved', 'draft', 'rejected', 'failed'].includes(plan.status) && (
              <button
                onClick={handleReject}
                style={{ ...s.outlineBtn }}
              >
                <XCircle size={13} /> Reject &amp; Revise
              </button>
            )}

            {/* New plan after applied/verified */}
            {['applied', 'verified'].includes(plan.status) && (
              <button onClick={handleReject} style={{ ...s.outlineBtn }}>
                <Zap size={13} /> New Plan
              </button>
            )}
          </div>

          {/* ── Steps ── */}
          {plan.plan_json.steps.length > 0 && (
            <div style={s.section}>
              <button onClick={() => setShowSteps((v) => !v)} style={s.sectionBtn}>
                <ListChecks size={13} color="#818cf8" />
                <span style={s.sectionTitle}>Steps ({plan.plan_json.steps.length})</span>
                {showSteps ? <ChevronUp size={12} color="#475569" /> : <ChevronDown size={12} color="#475569" />}
              </button>
              {showSteps && (
                <ol style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {plan.plan_json.steps.map((step, i) => (
                    <li key={i} style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>{step}</li>
                  ))}
                </ol>
              )}
            </div>
          )}

          {/* ── Planned files ── */}
          {plan.plan_json.planned_files.length > 0 && (
            <div style={s.section}>
              <button onClick={() => setShowFiles((v) => !v)} style={s.sectionBtn}>
                <FileCode2 size={13} color="#818cf8" />
                <span style={s.sectionTitle}>Planned Files ({plan.plan_json.planned_files.length})</span>
                {showFiles ? <ChevronUp size={12} color="#475569" /> : <ChevronDown size={12} color="#475569" />}
              </button>
              {showFiles && (
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  {plan.plan_json.planned_files.map((f, i) => (
                    <code key={i} style={{ fontSize: '0.75rem', color: '#818cf8', background: 'rgba(99,102,241,0.08)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>
                      {f}
                    </code>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Checklist ── */}
          {plan.plan_json.checklist.length > 0 && (
            <div style={s.section}>
              <button onClick={() => setShowChecklist((v) => !v)} style={s.sectionBtn}>
                <CheckCircle2 size={13} color="#10b981" />
                <span style={s.sectionTitle}>Checklist ({plan.plan_json.checklist.length})</span>
                {showChecklist ? <ChevronUp size={12} color="#475569" /> : <ChevronDown size={12} color="#475569" />}
              </button>
              {showChecklist && (
                <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {plan.plan_json.checklist.map((item, i) => (
                    <li key={i} style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ── Risks ── */}
          {plan.plan_json.risks.length > 0 && (
            <div style={s.section}>
              <button onClick={() => setShowRisks((v) => !v)} style={s.sectionBtn}>
                <AlertTriangle size={13} color="#f59e0b" />
                <span style={s.sectionTitle}>Risks ({plan.plan_json.risks.length})</span>
                {showRisks ? <ChevronUp size={12} color="#475569" /> : <ChevronDown size={12} color="#475569" />}
              </button>
              {showRisks && (
                <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {plan.plan_json.risks.map((risk, i) => (
                    <li key={i} style={{ fontSize: '0.8rem', color: '#fbbf24', lineHeight: 1.5 }}>{risk}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Apply attempts note */}
          {plan.apply_attempts > 0 && (
            <div style={{ fontSize: '0.72rem', color: '#475569' }}>
              Apply attempts: {plan.apply_attempts} / {plan.max_apply_attempts}
            </div>
          )}

        </div>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  panel: {
    background: 'rgba(15,15,26,0.95)',
    border: '1px solid rgba(99,102,241,0.2)',
    borderRadius: '14px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.875rem',
    minWidth: '280px',
    maxWidth: '360px',
    overflowY: 'auto' as const,
  },

  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },

  panelTitle: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: '#f1f5f9',
    flex: 1,
  },

  iconBtn: {
    background: 'transparent',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
  } as React.CSSProperties,

  desc: {
    fontSize: '0.8rem',
    color: '#64748b',
    margin: 0,
    lineHeight: 1.5,
  },

  textarea: {
    background: 'rgba(30,30,50,0.8)',
    border: '1px solid rgba(99,102,241,0.2)',
    borderRadius: '8px',
    color: '#f1f5f9',
    fontSize: '0.82rem',
    padding: '0.625rem 0.75rem',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  },

  primaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.82rem',
    justifyContent: 'center',
  } as React.CSSProperties,

  outlineBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    background: 'transparent',
    color: '#94a3b8',
    border: '1px solid rgba(99,102,241,0.2)',
    cursor: 'pointer',
    fontSize: '0.82rem',
    justifyContent: 'center',
  } as React.CSSProperties,

  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.375rem',
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.25)',
    color: '#ef4444',
    fontSize: '0.8rem',
    lineHeight: 1.4,
  } as React.CSSProperties,

  successBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    background: 'rgba(16,185,129,0.08)',
    border: '1px solid rgba(16,185,129,0.25)',
    color: '#10b981',
    fontSize: '0.8rem',
  } as React.CSSProperties,

  section: {
    borderTop: '1px solid rgba(99,102,241,0.1)',
    paddingTop: '0.625rem',
  },

  sectionBtn: {
    background: 'transparent',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    cursor: 'pointer',
    padding: 0,
    width: '100%',
    textAlign: 'left' as const,
  },

  sectionTitle: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#cbd5e1',
    flex: 1,
  },
};
