'use client';

/**
 * /projects/[id] — Project workspace with Quality Pass panel.
 *
 * Shows project metadata and a Quality section where users can:
 *  - Trigger a Quality Pass (build + lint + typecheck)
 *  - Poll for results
 *  - Auto-fix & re-run on failure
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import SidebarLayout from '@/components/layout/SidebarLayout';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Play,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CheckResult {
  check: 'build' | 'lint' | 'typecheck';
  passed: boolean;
  output: string;
  durationMs: number;
}

type RunStatus = 'queued' | 'running' | 'passed' | 'failed';

interface QualityRun {
  id: string;
  status: RunStatus;
  logs: string;
  checks: CheckResult[] | null;
  fix_attempts: number;
  max_retries: number;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

interface Project {
  id: string;
  title: string;
  mode: string;
  visibility: string;
  created_at: string;
  updated_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('zivo_supabase_token');
}

function statusColor(status: RunStatus): string {
  switch (status) {
    case 'passed': return '#10b981';
    case 'failed': return '#ef4444';
    case 'running': return '#f59e0b';
    default: return '#6366f1';
  }
}

function statusLabel(status: RunStatus): string {
  switch (status) {
    case 'passed': return 'Passed ✓';
    case 'failed': return 'Failed ✗';
    case 'running': return 'Running…';
    default: return 'Queued';
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CheckBadge({ result }: { result: CheckResult }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      style={{
        borderRadius: '8px',
        border: `1px solid ${result.passed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
        background: result.passed ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
        padding: '0.75rem 1rem',
        marginBottom: '0.5rem',
      }}
    >
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
        onClick={() => setExpanded((v) => !v)}
      >
        {result.passed
          ? <CheckCircle2 size={16} color="#10b981" />
          : <XCircle size={16} color="#ef4444" />}
        <span style={{ fontWeight: 600, color: '#f1f5f9', flex: 1 }}>{result.check}</span>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
          {result.durationMs}ms
        </span>
        {result.output
          ? (expanded ? <ChevronUp size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" />)
          : null}
      </div>
      {expanded && result.output && (
        <pre
          style={{
            marginTop: '0.75rem',
            fontSize: '0.75rem',
            color: '#94a3b8',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            background: '#0a0a0f',
            borderRadius: '6px',
            padding: '0.75rem',
            maxHeight: '300px',
            overflow: 'auto',
          }}
        >
          {result.output}
        </pre>
      )}
    </div>
  );
}

function RunCard({ run, isActive }: { run: QualityRun; isActive: boolean }) {
  const [showLogs, setShowLogs] = useState(false);
  return (
    <div
      style={{
        borderRadius: '10px',
        border: isActive
          ? `1px solid ${statusColor(run.status)}40`
          : '1px solid rgba(99,102,241,0.1)',
        background: isActive ? `${statusColor(run.status)}08` : 'rgba(15,15,26,0.6)',
        padding: '1rem',
        marginBottom: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        {run.status === 'running' || run.status === 'queued'
          ? <Loader2 size={16} color={statusColor(run.status)} style={{ animation: 'spin 1s linear infinite' }} />
          : run.status === 'passed'
          ? <CheckCircle2 size={16} color="#10b981" />
          : <XCircle size={16} color="#ef4444" />}
        <span style={{ fontWeight: 600, color: statusColor(run.status) }}>
          {statusLabel(run.status)}
        </span>
        {run.fix_attempts > 0 && (
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            (auto-fixed {run.fix_attempts}×)
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#475569' }}>
          {new Date(run.created_at).toLocaleString()}
        </span>
      </div>

      {/* Per-check results */}
      {run.checks && run.checks.length > 0 && (
        <div style={{ marginBottom: '0.5rem' }}>
          {run.checks.map((c) => (
            <CheckBadge key={c.check} result={c} />
          ))}
        </div>
      )}

      {/* Full logs toggle */}
      {run.logs && (
        <button
          onClick={() => setShowLogs((v) => !v)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#6366f1',
            cursor: 'pointer',
            fontSize: '0.8rem',
            padding: '0.25rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          {showLogs ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {showLogs ? 'Hide logs' : 'Show full logs'}
        </button>
      )}
      {showLogs && run.logs && (
        <pre
          style={{
            marginTop: '0.5rem',
            fontSize: '0.72rem',
            color: '#64748b',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            background: '#07070f',
            borderRadius: '6px',
            padding: '0.75rem',
            maxHeight: '400px',
            overflow: 'auto',
          }}
        >
          {run.logs}
        </pre>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const token = getToken();

  const [project, setProject] = useState<Project | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);

  const [runs, setRuns] = useState<QualityRun[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [pollTimer, setPollTimer] = useState<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch project metadata ──────────────────────────────────────────────────
  useEffect(() => {
    if (!token || !projectId) return;
    fetch(`/api/projects/${projectId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.project) setProject(d.project);
        else setProjectError(d.error ?? 'Failed to load project');
      })
      .catch(() => setProjectError('Network error'));
  }, [token, projectId]);

  // ── Load existing runs ──────────────────────────────────────────────────────
  const loadRuns = useCallback(async () => {
    if (!token || !projectId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/quality/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (res.ok) setRuns(d.runs ?? []);
    } catch {
      // silent
    }
  }, [token, projectId]);

  useEffect(() => { loadRuns(); }, [loadRuns]);

  // ── Poll active run ─────────────────────────────────────────────────────────
  const pollRun = useCallback(async (runId: string) => {
    if (!token) return;
    try {
      const res = await fetch(
        `/api/projects/${projectId}/quality/status?runId=${runId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const d = await res.json();
      if (res.ok && d.run) {
        setRuns((prev) => {
          const idx = prev.findIndex((r) => r.id === runId);
          if (idx === -1) return [d.run, ...prev];
          const next = [...prev];
          next[idx] = d.run;
          return next;
        });
        if (d.run.status === 'passed' || d.run.status === 'failed') {
          setActiveRunId(null);
        }
      }
    } catch {
      // silent
    }
  }, [token, projectId]);

  useEffect(() => {
    if (!activeRunId) {
      if (pollTimer) { clearInterval(pollTimer); setPollTimer(null); }
      return;
    }
    const t = setInterval(() => pollRun(activeRunId), 3000);
    setPollTimer(t);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRunId]);

  // ── Start quality run ───────────────────────────────────────────────────────
  async function handleStart(maxRetries = 3) {
    if (!token || starting) return;
    setStarting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/quality/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxRetries }),
      });
      const d = await res.json();
      if (res.ok && d.runId) {
        setActiveRunId(d.runId);
        // Optimistically insert queued run
        setRuns((prev) => [{
          id: d.runId,
          status: 'queued',
          logs: '',
          checks: null,
          fix_attempts: 0,
          max_retries: maxRetries,
          started_at: null,
          finished_at: null,
          created_at: new Date().toISOString(),
        } as QualityRun, ...prev]);
      }
    } finally {
      setStarting(false);
    }
  }

  const activeRun = runs.find((r) => r.id === activeRunId);
  const isRunning = activeRun?.status === 'running' || activeRun?.status === 'queued';
  const latestRun = runs[0];
  const canAutoFix = latestRun?.status === 'failed' && !isRunning;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <SidebarLayout>
      <div style={{ padding: '2rem', minHeight: '100vh', background: '#0a0a0f', color: '#f1f5f9' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <Link
            href="/projects"
            style={{ color: '#6366f1', fontSize: '0.85rem', textDecoration: 'none', marginBottom: '0.5rem', display: 'inline-block' }}
          >
            ← Projects
          </Link>
          {projectError ? (
            <p style={{ color: '#ef4444' }}>{projectError}</p>
          ) : project ? (
            <>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.25rem' }}>
                {project.title}
              </h1>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                  {project.mode}
                </span>
                <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', background: project.visibility === 'public' ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)', color: project.visibility === 'public' ? '#10b981' : '#818cf8' }}>
                  {project.visibility}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#475569' }}>
                  Updated {new Date(project.updated_at).toLocaleString()}
                </span>
              </div>
            </>
          ) : (
            <div style={{ color: '#475569' }}>Loading…</div>
          )}
        </div>

        {/* Quality Panel */}
        <div
          style={{
            borderRadius: '14px',
            border: '1px solid rgba(99,102,241,0.2)',
            background: 'rgba(15,15,26,0.8)',
            padding: '1.5rem',
            maxWidth: '860px',
          }}
        >
          {/* Panel header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.2rem' }}>
                Quality Pass
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                build · lint · typecheck — strict gate, up to 3 auto-fix retries
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {/* Auto-fix & re-run (only shown on failure) */}
              {canAutoFix && (
                <button
                  onClick={() => handleStart(3)}
                  disabled={starting}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.5rem 1rem', borderRadius: '8px',
                    background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                    border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer',
                    fontWeight: 600, fontSize: '0.85rem',
                    opacity: starting ? 0.6 : 1,
                  }}
                >
                  <RotateCcw size={14} /> Auto-fix &amp; re-run
                </button>
              )}
              {/* Run checks */}
              <button
                onClick={() => handleStart(0)}
                disabled={starting || isRunning}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.5rem 1.25rem', borderRadius: '8px',
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  color: '#fff', border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.85rem',
                  opacity: starting || isRunning ? 0.6 : 1,
                }}
              >
                {isRunning
                  ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Running…</>
                  : <><Play size={14} /> Run checks</>}
              </button>
            </div>
          </div>

          {/* Security note */}
          <div
            style={{
              display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
              background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: '8px', padding: '0.6rem 0.75rem', marginBottom: '1.25rem',
              fontSize: '0.78rem', color: '#f59e0b',
            }}
          >
            <AlertTriangle size={14} style={{ marginTop: '1px', flexShrink: 0 }} />
            <span>
              <strong>Security note:</strong> Checks run inside the app container by executing your
              project files as child processes. Only use with trusted code. See{' '}
              <code style={{ fontSize: '0.75rem' }}>lib/quality-runner.ts</code> for details.
            </span>
          </div>

          {/* Runs list */}
          {runs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 0', color: '#475569' }}>
              No quality runs yet. Click <strong style={{ color: '#818cf8' }}>Run checks</strong> to start.
            </div>
          ) : (
            runs.map((run) => (
              <RunCard key={run.id} run={run} isActive={run.id === activeRunId} />
            ))
          )}
        </div>

        {/* CSS keyframe for spinner */}
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </SidebarLayout>
  );
}
