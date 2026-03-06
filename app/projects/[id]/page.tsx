'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import SidebarLayout from '@/components/layout/SidebarLayout';
import {
  ArrowLeft,
  Play,
  RefreshCw,
  FileCode2,
  MessageSquare,
  History,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  LogIn,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ShieldCheck,
  Rocket,
  Download,
  Github,
  Server,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProjectFile {
  id: string;
  path: string;
  sha: string | null;
  generated_by: string | null;
  updated_at: string;
}

interface ProjectBuild {
  id: string;
  project_id: string;
  build_number: number;
  summary: string | null;
  snapshot_path: string | null;
  created_at: string;
}

interface ConversationMessage {
  id: string;
  project_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
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

interface ChangedFile {
  action: string;
  path: string;
}

interface SSEDoneData {
  projectId?: string;
  buildId?: string;
  buildNumber?: number;
  changedFiles?: ChangedFile[];
}

// ─── Deploy settings types ─────────────────────────────────────────────────────

interface DeploySettings {
  deploy_repo_url: string | null;
  deploy_branch: string;
  docker_deploy_endpoint: string | null;
  last_pushed_commit_sha: string | null;
  last_pushed_at: string | null;
  last_deployed_commit_sha: string | null;
  last_deployed_at: string | null;
  last_deploy_status: string | null;
}

// ─── Quality Pass types ────────────────────────────────────────────────────────

interface CheckResult {
  check: 'build' | 'lint' | 'typecheck';
  passed: boolean;
  output: string;
  durationMs: number;
}

type QualityRunStatus = 'queued' | 'running' | 'passed' | 'failed';

interface QualityRun {
  id: string;
  status: QualityRunStatus;
  logs: string;
  checks: CheckResult[] | null;
  fix_attempts: number;
  max_retries: number;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('zivo_supabase_token');
}

function qualityStatusColor(status: QualityRunStatus): string {
  switch (status) {
    case 'passed': return '#10b981';
    case 'failed': return '#ef4444';
    case 'running': return '#f59e0b';
    default: return '#6366f1';
  }
}

function qualityStatusLabel(status: QualityRunStatus): string {
  switch (status) {
    case 'passed': return 'Passed ✓';
    case 'failed': return 'Failed ✗';
    case 'running': return 'Running…';
    default: return 'Queued';
  }
}

// ─── Quality sub-components ──────────────────────────────────────────────────

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
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{result.durationMs}ms</span>
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

function QualityRunCard({ run, isActive }: { run: QualityRun; isActive: boolean }) {
  const [showLogs, setShowLogs] = useState(false);
  return (
    <div
      style={{
        borderRadius: '10px',
        border: isActive
          ? `1px solid ${qualityStatusColor(run.status)}40`
          : '1px solid rgba(99,102,241,0.1)',
        background: isActive ? `${qualityStatusColor(run.status)}08` : 'rgba(15,15,26,0.6)',
        padding: '1rem',
        marginBottom: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        {run.status === 'running' || run.status === 'queued'
          ? <Loader2 size={16} color={qualityStatusColor(run.status)} style={{ animation: 'spin 1s linear infinite' }} />
          : run.status === 'passed'
          ? <CheckCircle2 size={16} color="#10b981" />
          : <XCircle size={16} color="#ef4444" />}
        <span style={{ fontWeight: 600, color: qualityStatusColor(run.status) }}>
          {qualityStatusLabel(run.status)}
        </span>
        {run.fix_attempts > 0 && (
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>(auto-fixed {run.fix_attempts}×)</span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#475569' }}>
          {new Date(run.created_at).toLocaleString()}
        </span>
      </div>

      {run.checks && run.checks.length > 0 && (
        <div style={{ marginBottom: '0.5rem' }}>
          {run.checks.map((c) => (
            <CheckBadge key={c.check} result={c} />
          ))}
        </div>
      )}

      {run.logs && (
        <button
          onClick={() => setShowLogs((v) => !v)}
          style={{
            background: 'transparent', border: 'none', color: '#6366f1',
            cursor: 'pointer', fontSize: '0.8rem', padding: '0.25rem 0',
            display: 'flex', alignItems: 'center', gap: '0.25rem',
          }}
        >
          {showLogs ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {showLogs ? 'Hide logs' : 'Show full logs'}
        </button>
      )}
      {showLogs && run.logs && (
        <pre
          style={{
            marginTop: '0.5rem', fontSize: '0.72rem', color: '#64748b',
            whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            background: '#07070f', borderRadius: '6px', padding: '0.75rem',
            maxHeight: '400px', overflow: 'auto',
          }}
        >
          {run.logs}
        </pre>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

type Tab = 'conversation' | 'files' | 'builds' | 'quality' | 'publish';

export default function ProjectWorkspacePage() {
  const params = useParams();
  const projectId = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';

  const token = getStoredToken();

  // Project data
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [builds, setBuilds] = useState<ProjectBuild[]>([]);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Continue Build state
  const [instruction, setInstruction] = useState('');
  const [building, setBuilding] = useState(false);
  const [streamLog, setStreamLog] = useState<string[]>([]);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [lastChangedFiles, setLastChangedFiles] = useState<ChangedFile[]>([]);
  const [lastBuildId, setLastBuildId] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);

  // Quality Pass state
  const [qualityRuns, setQualityRuns] = useState<QualityRun[]>([]);
  const [activeQualityRunId, setActiveQualityRunId] = useState<string | null>(null);
  const [qualityStarting, setQualityStarting] = useState(false);
  const qualityPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Publish / Deploy state
  const [deploySettings, setDeploySettings] = useState<DeploySettings | null>(null);
  // GitHub push form
  const [ghPat, setGhPat] = useState('');
  const [ghRepo, setGhRepo] = useState('');
  const [ghBranch, setGhBranch] = useState('main');
  const [ghCreateRepo, setGhCreateRepo] = useState(false);
  const [ghPrivate, setGhPrivate] = useState(false);
  const [ghPushing, setGhPushing] = useState(false);
  const [ghError, setGhError] = useState<string | null>(null);
  const [ghSuccess, setGhSuccess] = useState<{ repoUrl: string; branch: string; commitSha: string } | null>(null);
  // Docker deploy form
  const [dockerEndpoint, setDockerEndpoint] = useState('');
  const [dockerToken, setDockerToken] = useState('');
  const [dockerDeploying, setDockerDeploying] = useState(false);
  const [dockerError, setDockerError] = useState<string | null>(null);
  const [dockerSuccess, setDockerSuccess] = useState<{ status: string; log: string; deployedAt: string } | null>(null);

  // UI
  const [activeTab, setActiveTab] = useState<Tab>('conversation');
  const streamEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Restore state
  const [restoringBuildId, setRestoringBuildId] = useState<string | null>(null);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  // ─── Data loading ──────────────────────────────────────────────────────────

  const fetchProject = useCallback(async () => {
    if (!token || !projectId) return;
    const res = await fetch(`/api/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to load project');
    const data = await res.json();
    setProject(data.project ?? data);
  }, [token, projectId]);

  const fetchFiles = useCallback(async () => {
    if (!token || !projectId) return;
    const res = await fetch(`/api/projects/${projectId}/files`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    setFiles(data.files ?? []);
  }, [token, projectId]);

  const fetchBuilds = useCallback(async () => {
    if (!token || !projectId) return;
    const res = await fetch(`/api/projects/${projectId}/builds`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    setBuilds(data.builds ?? []);
  }, [token, projectId]);

  const fetchMessages = useCallback(async () => {
    if (!token || !projectId) return;
    const res = await fetch(`/api/projects/${projectId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages ?? []);
  }, [token, projectId]);

  const fetchQualityRuns = useCallback(async () => {
    if (!token || !projectId) return;
    const res = await fetch(`/api/projects/${projectId}/quality/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    setQualityRuns(data.runs ?? []);
  }, [token, projectId]);

  const fetchDeploySettings = useCallback(async () => {
    if (!token || !projectId) return;
    const res = await fetch(`/api/projects/${projectId}/deploy-settings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    const s = data.settings as DeploySettings | null;
    if (s) {
      setDeploySettings(s);
      setGhBranch(s.deploy_branch ?? 'main');
      if (s.deploy_repo_url) setGhRepo(s.deploy_repo_url.replace('https://github.com/', ''));
      if (s.docker_deploy_endpoint) setDockerEndpoint(s.docker_deploy_endpoint);
    }
  }, [token, projectId]);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    Promise.all([fetchProject(), fetchFiles(), fetchBuilds(), fetchMessages(), fetchQualityRuns(), fetchDeploySettings()])
      .catch((err: unknown) => setError((err as Error).message ?? 'Failed to load workspace'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, token]);

  // Auto-scroll stream log
  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [streamLog]);

  // ─── Quality Pass polling ──────────────────────────────────────────────────

  const pollQualityRun = useCallback(async (runId: string) => {
    if (!token) return;
    const res = await fetch(
      `/api/projects/${projectId}/quality/status?runId=${runId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return;
    const data = await res.json();
    if (data.run) {
      setQualityRuns((prev) => {
        const idx = prev.findIndex((r) => r.id === runId);
        if (idx === -1) return [data.run as QualityRun, ...prev];
        const next = [...prev];
        next[idx] = data.run as QualityRun;
        return next;
      });
      const status = (data.run as QualityRun).status;
      if (status === 'passed' || status === 'failed') {
        setActiveQualityRunId(null);
      }
    }
  }, [token, projectId]);

  useEffect(() => {
    if (!activeQualityRunId) {
      if (qualityPollRef.current) { clearInterval(qualityPollRef.current); qualityPollRef.current = null; }
      return;
    }
    qualityPollRef.current = setInterval(() => pollQualityRun(activeQualityRunId), 3000);
    return () => {
      if (qualityPollRef.current) { clearInterval(qualityPollRef.current); qualityPollRef.current = null; }
    };
  }, [activeQualityRunId, pollQualityRun]);

  async function handleStartQuality(maxRetries: number) {
    if (!token || qualityStarting) return;
    setQualityStarting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/quality/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxRetries }),
      });
      const data = await res.json();
      if (res.ok && data.runId) {
        setActiveQualityRunId(data.runId as string);
        setQualityRuns((prev) => [{
          id: data.runId as string,
          status: 'queued',
          logs: '',
          checks: null,
          fix_attempts: 0,
          max_retries: maxRetries,
          started_at: null,
          finished_at: null,
          created_at: new Date().toISOString(),
        }, ...prev]);
      }
    } finally {
      setQualityStarting(false);
    }
  }

  // ─── Continue Build ────────────────────────────────────────────────────────

  async function handleContinueBuild() {
    if (!token || !instruction.trim() || building) return;

    setBuildError(null);
    setLastChangedFiles([]);
    setLastBuildId(null);
    setBuilding(true);
    setStreamLog([]);
    setActiveTab('conversation');

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    // Optimistically add user message to local thread
    const tempUserMsg: ConversationMessage = {
      id: `temp-${Date.now()}`,
      project_id: projectId,
      role: 'user',
      content: instruction.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    const currentInstruction = instruction.trim();
    setInstruction('');

    try {
      const res = await fetch(`/api/projects/${projectId}/continue`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instruction: currentInstruction }),
        signal: ctrl.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({})) as { error?: string };
        if (res.status === 401) throw new Error('Unauthorized — please log in again.');
        if (res.status === 404) throw new Error('Project not found.');
        throw new Error(errData.error ?? `Build failed (${res.status})`);
      }

      if (!res.body) throw new Error('No response body from build service.');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith(': ')) continue; // heartbeat comment
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === '[DONE]') continue;

          let evt: { type: string; stage?: string; message?: string; progress?: number; data?: SSEDoneData };
          try { evt = JSON.parse(raw); } catch { continue; }

          if (evt.type === 'error') {
            throw new Error(evt.message ?? 'Build error');
          }

          if (evt.type === 'stage' && evt.message) {
            const progress = evt.progress != null ? ` [${evt.progress}%]` : '';
            setStreamLog((prev) => [...prev, `${evt.stage ?? 'INFO'}${progress}: ${evt.message}`]);

            if (evt.stage === 'DONE' && evt.data) {
              const doneData = evt.data as SSEDoneData;
              if (doneData.changedFiles) setLastChangedFiles(doneData.changedFiles);
              if (doneData.buildId) setLastBuildId(doneData.buildId);
            }
          }
        }
      }

      // Refresh files + builds + messages after build
      await Promise.all([fetchFiles(), fetchBuilds(), fetchMessages()]);

    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') {
        setStreamLog((prev) => [...prev, 'Build cancelled.']);
      } else {
        setBuildError((err as Error).message ?? 'Unknown error');
        // Remove the optimistic user message
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
        setInstruction(currentInstruction);
      }
    } finally {
      setBuilding(false);
      abortRef.current = null;
    }
  }

  function handleCancelBuild() {
    abortRef.current?.abort();
  }

  async function handleRestoreBuild(buildId: string) {
    if (!token || !projectId) return;
    setRestoringBuildId(buildId);
    setRestoreMessage(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/restore`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ buildId }),
      });
      const data = await res.json();
      if (res.ok) {
        setRestoreMessage('Build restored successfully ✓');
        await fetchFiles();
      } else {
        setRestoreMessage(data.error ?? 'Restore failed');
      }
    } catch {
      setRestoreMessage('Network error');
    }
    setRestoringBuildId(null);
    setTimeout(() => setRestoreMessage(null), 4000);
  }

  function handleExportZip() {
    if (!token || !projectId) return;
    const url = `/api/projects/${projectId}/export.zip`;
    const a = document.createElement('a');
    a.href = url;
    // Pass token via a temporary fetch to get the blob
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error('Export failed');
        return res.blob();
      })
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        a.href = blobUrl;
        a.download = `${(project?.title ?? 'project').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.zip`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
      })
      .catch((err: unknown) => alert((err as Error).message ?? 'Export failed'));
  }

  async function handleGithubPush() {
    if (!token || !projectId || ghPushing) return;
    if (!ghPat.trim()) { setGhError('Personal Access Token is required.'); return; }
    if (!ghCreateRepo && !ghRepo.trim()) { setGhError('Repository name (owner/repo) is required.'); return; }
    setGhPushing(true);
    setGhError(null);
    setGhSuccess(null);
    try {
      const body: Record<string, unknown> = {
        pat: ghPat.trim(),
        branch: ghBranch.trim() || 'main',
        createRepo: ghCreateRepo,
        private: ghPrivate,
      };
      if (!ghCreateRepo) body.repoFullName = ghRepo.trim();
      const res = await fetch(`/api/projects/${projectId}/publish/github`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setGhError(data.error ?? 'GitHub push failed'); return; }
      const result = data as { repoUrl: string; branch: string; commitSha: string };
      setGhSuccess(result);
      setDeploySettings((prev) => ({
        ...(prev ?? { deploy_branch: 'main', docker_deploy_endpoint: null, last_deployed_commit_sha: null, last_deployed_at: null, last_deploy_status: null }),
        deploy_repo_url: result.repoUrl,
        deploy_branch: result.branch,
        last_pushed_commit_sha: result.commitSha,
        last_pushed_at: new Date().toISOString(),
      } as DeploySettings));
      if (!ghCreateRepo) {
        // Save endpoint/repo settings
        await fetch(`/api/projects/${projectId}/deploy-settings`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ deploy_repo_url: result.repoUrl, deploy_branch: result.branch }),
        });
      }
    } finally {
      setGhPushing(false);
    }
  }

  async function handleDockerDeploy() {
    if (!token || !projectId || dockerDeploying) return;
    if (!dockerToken.trim()) { setDockerError('Docker deploy token is required.'); return; }
    setDockerDeploying(true);
    setDockerError(null);
    setDockerSuccess(null);
    try {
      const body: Record<string, unknown> = { dockerDeployToken: dockerToken.trim() };
      if (dockerEndpoint.trim()) body.endpoint = dockerEndpoint.trim();
      const res = await fetch(`/api/projects/${projectId}/publish/docker`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setDockerError(data.error ?? 'Docker deploy failed'); return; }
      const result = data as { status: string; log: string; deployedAt: string };
      setDockerSuccess(result);
      setDeploySettings((prev) => prev ? {
        ...prev,
        docker_deploy_endpoint: dockerEndpoint.trim() || prev.docker_deploy_endpoint,
        last_deployed_commit_sha: prev.last_pushed_commit_sha,
        last_deployed_at: result.deployedAt,
        last_deploy_status: result.status,
      } : null);
      if (dockerEndpoint.trim()) {
        await fetch(`/api/projects/${projectId}/deploy-settings`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ docker_deploy_endpoint: dockerEndpoint.trim() }),
        });
      }
    } finally {
      setDockerDeploying(false);
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const s = styles;

  if (!token) {
    return (
      <SidebarLayout>
        <div style={s.page}>
          <div style={s.emptyState}>
            <LogIn size={48} style={{ color: '#6366f1', marginBottom: '1rem' }} />
            <h2 style={s.emptyTitle}>Authentication Required</h2>
            <p style={s.emptyDesc}>You need to be logged in to access the project workspace.</p>
            <Link href="/auth" style={s.ctaBtn}>Log in to continue</Link>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (loading) {
    return (
      <SidebarLayout>
        <div style={s.page}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8', padding: '4rem' }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
            Loading workspace…
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (error) {
    return (
      <SidebarLayout>
        <div style={s.page}>
          <div style={s.emptyState}>
            <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
            <h2 style={{ ...s.emptyTitle, color: '#ef4444' }}>Error</h2>
            <p style={s.emptyDesc}>{error}</p>
            <Link href="/projects" style={s.ctaBtn}>Back to Projects</Link>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  const activeQualityRun = qualityRuns.find((r) => r.id === activeQualityRunId);
  const isQualityRunning = activeQualityRun?.status === 'running' || activeQualityRun?.status === 'queued';
  const latestQualityRun = qualityRuns[0];
  const canAutoFix = latestQualityRun?.status === 'failed' && !isQualityRunning;

  return (
    <SidebarLayout>
      <div style={s.page}>
        {/* ── Header ── */}
        <div style={s.header}>
          <Link href="/projects" style={s.backBtn}>
            <ArrowLeft size={16} /> Projects
          </Link>
          <div style={{ flex: 1 }}>
            <h1 style={s.title}>{project?.title ?? 'Project Workspace'}</h1>
            <div style={s.meta}>
              <span style={s.badge}>{project?.mode}</span>
              <span style={{ ...s.badge, background: project?.visibility === 'public' ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)', color: project?.visibility === 'public' ? '#10b981' : '#818cf8' }}>
                {project?.visibility}
              </span>
            </div>
          </div>
        </div>

        {/* ── Continue Build Panel ── */}
        <div style={s.buildPanel}>
          <h2 style={s.panelTitle}>Continue Build</h2>
          <p style={s.panelDesc}>
            Describe your changes — the AI will update the project files using the current saved state as the base.
          </p>

          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="e.g. Add a dark mode toggle to the navbar and update the color scheme…"
            disabled={building}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleContinueBuild();
            }}
            style={s.textarea}
          />

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={building ? handleCancelBuild : handleContinueBuild}
              disabled={!building && !instruction.trim()}
              style={{
                ...s.primaryBtn,
                background: building
                  ? 'rgba(239,68,68,0.15)'
                  : 'linear-gradient(135deg,#6366f1,#4f46e5)',
                color: building ? '#ef4444' : '#fff',
                border: building ? '1px solid rgba(239,68,68,0.3)' : 'none',
                opacity: (!building && !instruction.trim()) ? 0.5 : 1,
                cursor: (!building && !instruction.trim()) ? 'not-allowed' : 'pointer',
              }}
            >
              {building ? (
                <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Cancel Build</>
              ) : (
                <><Play size={16} fill="currentColor" /> Continue Build</>
              )}
            </button>
            <span style={{ fontSize: '0.75rem', color: '#475569' }}>
              {building ? 'Building in progress…' : 'Tip: Ctrl+Enter / ⌘+Enter to run'}
            </span>
          </div>

          {/* Stream log */}
          {(streamLog.length > 0 || building) && (
            <div style={s.streamLog}>
              {streamLog.map((line, i) => (
                <div key={i} style={{ color: line.startsWith('DONE') ? '#10b981' : '#94a3b8', marginBottom: '2px' }}>
                  {line}
                </div>
              ))}
              {building && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6366f1' }}>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Running…
                </div>
              )}
              <div ref={streamEndRef} />
            </div>
          )}

          {/* Build error */}
          {buildError && (
            <div style={s.errorBox}>
              <AlertCircle size={16} />
              {buildError}
            </div>
          )}

          {/* Changed files summary */}
          {lastChangedFiles.length > 0 && (
            <div style={s.changedFilesBox}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#10b981' }}>
                <CheckCircle2 size={16} /> Build complete — changed files:
              </div>
              {lastChangedFiles.map((f) => (
                <div key={f.path} style={{ fontSize: '0.8rem', color: '#94a3b8', paddingLeft: '1.5rem' }}>
                  <span style={{
                    display: 'inline-block', marginRight: '0.5rem',
                    color: f.action === 'delete' ? '#ef4444' : f.action === 'create' ? '#10b981' : '#818cf8',
                    fontWeight: 600, minWidth: '56px',
                  }}>
                    {f.action}
                  </span>
                  {f.path}
                </div>
              ))}
              {lastBuildId && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#475569' }}>
                  Build ID: <code style={{ color: '#818cf8' }}>{lastBuildId}</code>
                  <button
                    onClick={() => setIframeKey((k) => k + 1)}
                    style={{ marginLeft: '1rem', ...s.outlineBtn }}
                  >
                    <RotateCcw size={12} /> Reload preview
                  </button>
                  <button
                    onClick={() => setActiveTab('builds')}
                    style={{ marginLeft: '0.5rem', ...s.outlineBtn }}
                  >
                    <History size={12} /> Build history
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div style={s.tabs}>
          {(['conversation', 'files', 'builds', 'quality', 'publish'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ ...s.tabBtn, ...(activeTab === tab ? s.tabBtnActive : {}) }}
            >
              {tab === 'conversation' && <MessageSquare size={14} />}
              {tab === 'files' && <FileCode2 size={14} />}
              {tab === 'builds' && <History size={14} />}
              {tab === 'quality' && <ShieldCheck size={14} />}
              {tab === 'publish' && <Rocket size={14} />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'files' && files.length > 0 && (
                <span style={s.badge}>{files.length}</span>
              )}
              {tab === 'builds' && builds.length > 0 && (
                <span style={s.badge}>{builds.length}</span>
              )}
              {tab === 'quality' && latestQualityRun && (
                <span style={{
                  ...s.badge,
                  background: latestQualityRun.status === 'passed' ? 'rgba(16,185,129,0.2)' : latestQualityRun.status === 'failed' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                  color: latestQualityRun.status === 'passed' ? '#10b981' : latestQualityRun.status === 'failed' ? '#ef4444' : '#f59e0b',
                }}>
                  {latestQualityRun.status}
                </span>
              )}
              {tab === 'publish' && deploySettings?.last_deploy_status && (
                <span style={{
                  ...s.badge,
                  background: deploySettings.last_deploy_status === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                  color: deploySettings.last_deploy_status === 'success' ? '#10b981' : '#ef4444',
                }}>
                  {deploySettings.last_deploy_status}
                </span>
              )}
            </button>
          ))}
          <button
            onClick={() => { fetchFiles(); fetchBuilds(); fetchMessages(); fetchQualityRuns(); fetchDeploySettings(); }}
            title="Refresh"
            style={{ ...s.outlineBtn, marginLeft: 'auto' }}
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {/* ── Tab content ── */}
        <div style={s.tabContent}>

          {/* Conversation */}
          {activeTab === 'conversation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.length === 0 && (
                <div style={s.emptyTab}>
                  <MessageSquare size={32} style={{ color: '#475569', marginBottom: '0.75rem' }} />
                  <p>No messages yet. Use Continue Build to start the conversation.</p>
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    ...s.msgBubble,
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    background: msg.role === 'user'
                      ? 'rgba(99,102,241,0.15)'
                      : msg.role === 'assistant'
                        ? 'rgba(15,23,42,0.8)'
                        : 'rgba(248,113,113,0.08)',
                    borderColor: msg.role === 'user'
                      ? 'rgba(99,102,241,0.3)'
                      : msg.role === 'assistant'
                        ? 'rgba(51,65,85,0.5)'
                        : 'rgba(248,113,113,0.2)',
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color: '#475569', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {msg.role} · {new Date(msg.created_at).toLocaleString()}
                  </div>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.875rem', color: '#e2e8f0', lineHeight: 1.6 }}>
                    {msg.content}
                  </pre>
                </div>
              ))}
            </div>
          )}

          {/* Files */}
          {activeTab === 'files' && (
            <div>
              {files.length === 0 ? (
                <div style={s.emptyTab}>
                  <FileCode2 size={32} style={{ color: '#475569', marginBottom: '0.75rem' }} />
                  <p>No files yet. Run Continue Build to generate project files.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {files.map((f) => (
                    <div key={f.id} style={s.fileRow}>
                      <FileCode2 size={14} style={{ color: '#6366f1', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.85rem', color: '#e2e8f0', flex: 1, fontFamily: 'monospace' }}>{f.path}</span>
                      <span style={{ fontSize: '0.75rem', color: '#475569' }}>
                        {new Date(f.updated_at).toLocaleDateString()}
                      </span>
                      {f.generated_by && (
                        <span style={{ ...s.badge, fontSize: '0.7rem' }}>{f.generated_by}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Builds */}
          {activeTab === 'builds' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {restoreMessage && (
                <div style={{
                  padding: '0.625rem 0.875rem',
                  borderRadius: '8px',
                  background: restoreMessage.includes('✓') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${restoreMessage.includes('✓') ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                  color: restoreMessage.includes('✓') ? '#10b981' : '#ef4444',
                  fontSize: '0.875rem',
                }}>
                  {restoreMessage}
                </div>
              )}
              {builds.length === 0 ? (
                <div style={s.emptyTab}>
                  <History size={32} style={{ color: '#475569', marginBottom: '0.75rem' }} />
                  <p>No build history yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[...builds].reverse().map((b) => (
                    <div key={b.id} style={{ ...s.buildRow, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ ...s.badge, background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>
                            #{b.build_number}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#475569' }}>
                            {new Date(b.created_at).toLocaleString()}
                          </span>
                          {b.snapshot_path && (
                            <span style={{ ...s.badge, background: 'rgba(16,185,129,0.12)', color: '#10b981', fontSize: '0.7rem' }}>
                              snapshot
                            </span>
                          )}
                        </div>
                        {b.summary && (
                          <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: '#94a3b8', whiteSpace: 'pre-wrap' }}>
                            {b.summary}
                          </p>
                        )}
                      </div>
                      {b.snapshot_path && (
                        <button
                          onClick={() => handleRestoreBuild(b.id)}
                          disabled={restoringBuildId === b.id}
                          style={{
                            ...s.outlineBtn,
                            opacity: restoringBuildId === b.id ? 0.7 : 1,
                            flexShrink: 0,
                          }}
                        >
                          {restoringBuildId === b.id ? (
                            <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <RotateCcw size={12} />
                          )}
                          {restoringBuildId === b.id ? 'Restoring…' : 'Restore'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quality Pass */}
          {activeTab === 'quality' && (
            <div>
              {/* Panel header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                    build · lint · typecheck — strict gate, up to 3 auto-fix retries
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {canAutoFix && (
                    <button
                      onClick={() => handleStartQuality(3)}
                      disabled={qualityStarting}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.5rem 1rem', borderRadius: '8px',
                        background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                        border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer',
                        fontWeight: 600, fontSize: '0.85rem',
                        opacity: qualityStarting ? 0.6 : 1,
                      }}
                    >
                      <RotateCcw size={14} /> Auto-fix &amp; re-run
                    </button>
                  )}
                  <button
                    onClick={() => handleStartQuality(0)}
                    disabled={qualityStarting || isQualityRunning}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.5rem 1.25rem', borderRadius: '8px',
                      background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                      color: '#fff', border: 'none', cursor: 'pointer',
                      fontWeight: 600, fontSize: '0.85rem',
                      opacity: qualityStarting || isQualityRunning ? 0.6 : 1,
                    }}
                  >
                    {isQualityRunning
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
                  borderRadius: '8px', padding: '0.6rem 0.75rem', marginBottom: '1rem',
                  fontSize: '0.78rem', color: '#f59e0b',
                }}
              >
                <AlertTriangle size={14} style={{ marginTop: '1px', flexShrink: 0 }} />
                <span>
                  <strong>Security note:</strong> Checks run inside the app container by executing
                  project files as child processes. Only use with trusted code.
                </span>
              </div>

              {/* Runs */}
              {qualityRuns.length === 0 ? (
                <div style={s.emptyTab}>
                  <ShieldCheck size={32} style={{ color: '#334155', marginBottom: '0.75rem' }} />
                  <p>No quality runs yet. Click <strong style={{ color: '#818cf8' }}>Run checks</strong> to start.</p>
                </div>
              ) : (
                qualityRuns.map((run) => (
                  <QualityRunCard key={run.id} run={run} isActive={run.id === activeQualityRunId} />
                ))
              )}
            </div>
          )}
          {/* Publish */}
          {activeTab === 'publish' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* ── Export ZIP ── */}
              <section style={{ background: 'rgba(15,15,26,0.6)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Download size={16} color="#818cf8" />
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0' }}>Export ZIP</h3>
                </div>
                <p style={{ margin: '0 0 0.875rem', fontSize: '0.82rem', color: '#64748b' }}>
                  Download all current project files as a ZIP archive.
                </p>
                <button
                  onClick={handleExportZip}
                  disabled={files.length === 0}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.5rem 1.1rem', borderRadius: '8px',
                    background: files.length === 0 ? 'rgba(51,65,85,0.4)' : 'rgba(99,102,241,0.15)',
                    color: files.length === 0 ? '#475569' : '#818cf8',
                    border: '1px solid rgba(99,102,241,0.25)',
                    cursor: files.length === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem', fontWeight: 600,
                  }}
                >
                  <Download size={14} /> Download ZIP
                </button>
                {files.length === 0 && (
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', color: '#ef4444' }}>No files to export. Run Continue Build first.</p>
                )}
              </section>

              {/* ── Push to GitHub ── */}
              <section style={{ background: 'rgba(15,15,26,0.6)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Github size={16} color="#818cf8" />
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0' }}>Push to GitHub</h3>
                </div>
                <p style={{ margin: '0 0 0.875rem', fontSize: '0.82rem', color: '#64748b' }}>
                  Commit all project files to a GitHub repository using a Personal Access Token (PAT).
                </p>

                {/* Last push status */}
                {deploySettings?.last_pushed_commit_sha && (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.875rem', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.78rem', color: '#10b981' }}>
                    <CheckCircle2 size={13} />
                    <span>Last push: <code style={{ fontFamily: 'monospace' }}>{deploySettings.last_pushed_commit_sha.slice(0, 8)}</code>
                      {deploySettings.deploy_repo_url && <> → <a href={deploySettings.deploy_repo_url} target="_blank" rel="noreferrer" style={{ color: '#818cf8' }}>{deploySettings.deploy_repo_url.replace('https://github.com/', '')}</a></>}
                      {deploySettings.last_pushed_at && <> · {new Date(deploySettings.last_pushed_at).toLocaleString()}</>}
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  <label style={s.formLabel}>
                    GitHub PAT <span style={{ color: '#ef4444' }}>*</span>
                    <input
                      type="password"
                      value={ghPat}
                      onChange={(e) => setGhPat(e.target.value)}
                      placeholder="ghp_…"
                      style={s.formInput}
                      autoComplete="off"
                    />
                  </label>

                  <div style={{ display: 'flex', gap: '0.625rem' }}>
                    <label style={{ ...s.formLabel, flex: 1 }}>
                      Repository <span style={{ color: '#475569', fontSize: '0.72rem' }}>{ghCreateRepo ? '(auto-created)' : 'owner/repo'}</span>
                      <input
                        type="text"
                        value={ghRepo}
                        onChange={(e) => setGhRepo(e.target.value)}
                        placeholder="owner/my-repo"
                        disabled={ghCreateRepo}
                        style={{ ...s.formInput, opacity: ghCreateRepo ? 0.5 : 1 }}
                      />
                    </label>
                    <label style={{ ...s.formLabel, width: '120px' }}>
                      Branch
                      <input
                        type="text"
                        value={ghBranch}
                        onChange={(e) => setGhBranch(e.target.value)}
                        placeholder="main"
                        style={s.formInput}
                      />
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', fontSize: '0.82rem', color: '#94a3b8' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={ghCreateRepo} onChange={(e) => setGhCreateRepo(e.target.checked)} />
                      Auto-create repo
                    </label>
                    {ghCreateRepo && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={ghPrivate} onChange={(e) => setGhPrivate(e.target.checked)} />
                        Private repo
                      </label>
                    )}
                  </div>

                  {ghError && (
                    <div style={{ ...s.errorBox, marginTop: 0 }}>
                      <AlertCircle size={14} /> {ghError}
                    </div>
                  )}

                  {ghSuccess && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '0.625rem 0.875rem', fontSize: '0.8rem', color: '#10b981' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <CheckCircle2 size={14} /> Pushed successfully!
                      </div>
                      <div>Commit: <code style={{ fontFamily: 'monospace' }}>{ghSuccess.commitSha.slice(0, 12)}</code></div>
                      <div>Repo: <a href={ghSuccess.repoUrl} target="_blank" rel="noreferrer" style={{ color: '#818cf8' }}>{ghSuccess.repoUrl}</a></div>
                    </div>
                  )}

                  <button
                    onClick={handleGithubPush}
                    disabled={ghPushing || files.length === 0}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.55rem 1.25rem', borderRadius: '8px',
                      background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                      color: '#fff', border: 'none', cursor: 'pointer',
                      fontWeight: 600, fontSize: '0.85rem',
                      opacity: (ghPushing || files.length === 0) ? 0.6 : 1,
                      alignSelf: 'flex-start',
                    }}
                  >
                    {ghPushing ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Pushing…</> : <><Github size={14} /> Push to GitHub</>}
                  </button>
                  {files.length === 0 && <p style={{ margin: 0, fontSize: '0.78rem', color: '#ef4444' }}>No files to push. Run Continue Build first.</p>}
                </div>
              </section>

              {/* ── Deploy to Docker ── */}
              <section style={{ background: 'rgba(15,15,26,0.6)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Server size={16} color="#818cf8" />
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0' }}>Deploy to Docker</h3>
                </div>
                <p style={{ margin: '0 0 0.875rem', fontSize: '0.82rem', color: '#64748b' }}>
                  Trigger your Docker server to pull the latest commit from GitHub and run{' '}
                  <code style={{ fontFamily: 'monospace', color: '#94a3b8' }}>docker compose up -d</code>.
                  Push to GitHub first to get a commit SHA.
                </p>

                {/* Last deploy status */}
                {deploySettings?.last_deploy_status && (
                  <div style={{
                    display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.875rem',
                    background: deploySettings.last_deploy_status === 'success' ? 'rgba(16,185,129,0.07)' : 'rgba(239,68,68,0.07)',
                    border: `1px solid ${deploySettings.last_deploy_status === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                    borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.78rem',
                    color: deploySettings.last_deploy_status === 'success' ? '#10b981' : '#ef4444',
                  }}>
                    {deploySettings.last_deploy_status === 'success' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    <span>Last deploy: <strong>{deploySettings.last_deploy_status}</strong>
                      {deploySettings.last_deployed_commit_sha && <> · commit <code style={{ fontFamily: 'monospace' }}>{deploySettings.last_deployed_commit_sha.slice(0, 8)}</code></>}
                      {deploySettings.last_deployed_at && <> · {new Date(deploySettings.last_deployed_at).toLocaleString()}</>}
                    </span>
                  </div>
                )}

                {!deploySettings?.last_pushed_commit_sha && (
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', padding: '0.5rem 0.75rem', marginBottom: '0.875rem', fontSize: '0.78rem', color: '#f59e0b' }}>
                    <AlertTriangle size={13} style={{ marginTop: '1px', flexShrink: 0 }} />
                    No commit SHA found. Push to GitHub first.
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  <label style={s.formLabel}>
                    Webhook Endpoint <span style={{ color: '#ef4444' }}>*</span>
                    <input
                      type="url"
                      value={dockerEndpoint}
                      onChange={(e) => setDockerEndpoint(e.target.value)}
                      placeholder="https://my-server.example.com/deploy"
                      style={s.formInput}
                    />
                  </label>
                  <label style={s.formLabel}>
                    Deploy Token <span style={{ color: '#ef4444' }}>*</span>
                    <span style={{ fontWeight: 400, color: '#475569', fontSize: '0.72rem', marginLeft: '0.25rem' }}>(not stored — paste each time)</span>
                    <input
                      type="password"
                      value={dockerToken}
                      onChange={(e) => setDockerToken(e.target.value)}
                      placeholder="your-deploy-secret"
                      style={s.formInput}
                      autoComplete="off"
                    />
                  </label>

                  {dockerError && (
                    <div style={{ ...s.errorBox, marginTop: 0 }}>
                      <AlertCircle size={14} /> {dockerError}
                    </div>
                  )}

                  {dockerSuccess && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '0.625rem 0.875rem', fontSize: '0.8rem', color: '#10b981' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <CheckCircle2 size={14} /> Deploy triggered — status: <strong>{dockerSuccess.status}</strong>
                      </div>
                      {dockerSuccess.log && (
                        <pre style={{ margin: '0.35rem 0 0', fontSize: '0.72rem', whiteSpace: 'pre-wrap', color: '#94a3b8', background: '#07070f', borderRadius: '6px', padding: '0.5rem', maxHeight: '200px', overflow: 'auto' }}>
                          {dockerSuccess.log}
                        </pre>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleDockerDeploy}
                    disabled={dockerDeploying || !deploySettings?.last_pushed_commit_sha}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.55rem 1.25rem', borderRadius: '8px',
                      background: 'linear-gradient(135deg,#0ea5e9,#0284c7)',
                      color: '#fff', border: 'none', cursor: 'pointer',
                      fontWeight: 600, fontSize: '0.85rem',
                      opacity: (dockerDeploying || !deploySettings?.last_pushed_commit_sha) ? 0.6 : 1,
                      alignSelf: 'flex-start',
                    }}
                  >
                    {dockerDeploying ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Deploying…</> : <><Rocket size={14} /> Deploy</>}
                  </button>
                </div>
              </section>
            </div>
          )}
        </div>
        <iframe key={iframeKey} src="about:blank" style={{ display: 'none' }} title="preview-cache-bust" />
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </SidebarLayout>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  page: {
    padding: '2rem',
    minHeight: '100vh',
    background: '#0a0a0f',
    color: '#f1f5f9',
    maxWidth: '900px',
  } as React.CSSProperties,

  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    marginBottom: '1.5rem',
  } as React.CSSProperties,

  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    color: '#64748b',
    textDecoration: 'none',
    fontSize: '0.85rem',
    paddingTop: '0.25rem',
  } as React.CSSProperties,

  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#f1f5f9',
    margin: 0,
  } as React.CSSProperties,

  meta: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.375rem',
  } as React.CSSProperties,

  badge: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    background: 'rgba(99,102,241,0.1)',
    color: '#818cf8',
  } as React.CSSProperties,

  buildPanel: {
    background: 'rgba(15,15,26,0.9)',
    border: '1px solid rgba(99,102,241,0.2)',
    borderRadius: '14px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.875rem',
  } as React.CSSProperties,

  panelTitle: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: '#f1f5f9',
    margin: 0,
  } as React.CSSProperties,

  panelDesc: {
    fontSize: '0.85rem',
    color: '#64748b',
    margin: 0,
  } as React.CSSProperties,

  textarea: {
    width: '100%',
    minHeight: '100px',
    padding: '0.75rem',
    borderRadius: '8px',
    background: 'rgba(99,102,241,0.05)',
    border: '1px solid rgba(99,102,241,0.2)',
    color: '#f1f5f9',
    fontSize: '0.9rem',
    resize: 'vertical',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  } as React.CSSProperties,

  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1.25rem',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '0.9rem',
    border: 'none',
  } as React.CSSProperties,

  outlineBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    padding: '0.3rem 0.75rem',
    borderRadius: '6px',
    background: 'transparent',
    border: '1px solid rgba(99,102,241,0.25)',
    color: '#818cf8',
    cursor: 'pointer',
    fontSize: '0.8rem',
  } as React.CSSProperties,

  streamLog: {
    background: 'rgba(0,0,0,0.4)',
    border: '1px solid rgba(99,102,241,0.15)',
    borderRadius: '8px',
    padding: '0.75rem',
    maxHeight: '180px',
    overflowY: 'auto',
    fontSize: '0.8rem',
    fontFamily: 'monospace',
    lineHeight: 1.5,
  } as React.CSSProperties,

  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem',
    borderRadius: '8px',
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.25)',
    color: '#ef4444',
    fontSize: '0.875rem',
  } as React.CSSProperties,

  changedFilesBox: {
    padding: '0.875rem',
    borderRadius: '8px',
    background: 'rgba(16,185,129,0.05)',
    border: '1px solid rgba(16,185,129,0.2)',
  } as React.CSSProperties,

  tabs: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    borderBottom: '1px solid rgba(99,102,241,0.15)',
    marginBottom: '1.25rem',
  } as React.CSSProperties,

  tabBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.5rem 0.875rem',
    borderRadius: '8px 8px 0 0',
    background: 'transparent',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500,
  } as React.CSSProperties,

  tabBtnActive: {
    color: '#818cf8',
    borderBottom: '2px solid #6366f1',
  } as React.CSSProperties,

  tabContent: {
    minHeight: '200px',
  } as React.CSSProperties,

  msgBubble: {
    maxWidth: '80%',
    padding: '0.75rem 1rem',
    borderRadius: '12px',
    border: '1px solid',
    wordBreak: 'break-word',
  } as React.CSSProperties,

  fileRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    background: 'rgba(15,23,42,0.6)',
    border: '1px solid rgba(51,65,85,0.4)',
  } as React.CSSProperties,

  buildRow: {
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    background: 'rgba(15,23,42,0.6)',
    border: '1px solid rgba(51,65,85,0.4)',
  } as React.CSSProperties,

  emptyTab: {
    textAlign: 'center',
    padding: '3rem 2rem',
    color: '#475569',
    fontSize: '0.9rem',
  } as React.CSSProperties,

  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6rem 2rem',
    textAlign: 'center',
  } as React.CSSProperties,

  emptyTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#f1f5f9',
    marginBottom: '0.5rem',
  } as React.CSSProperties,

  emptyDesc: {
    color: '#64748b',
    marginBottom: '1.5rem',
    maxWidth: '400px',
  } as React.CSSProperties,

  ctaBtn: {
    padding: '0.625rem 1.5rem',
    borderRadius: '8px',
    background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
    color: '#fff',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '0.9rem',
  } as React.CSSProperties,

  formLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    fontSize: '0.82rem',
    fontWeight: 600,
    color: '#94a3b8',
  } as React.CSSProperties,

  formInput: {
    padding: '0.5rem 0.75rem',
    borderRadius: '7px',
    background: 'rgba(15,23,42,0.8)',
    border: '1px solid rgba(99,102,241,0.2)',
    color: '#e2e8f0',
    fontSize: '0.875rem',
    width: '100%',
    boxSizing: 'border-box' as const,
    outline: 'none',
  } as React.CSSProperties,
};
