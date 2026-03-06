'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import SidebarLayout from '@/components/layout/SidebarLayout';
import PlanChecklist from '@/components/builder/PlanChecklist';
import DesignTokensPanel from '@/components/builder/DesignTokensPanel';
import type { ProjectDesignTokens } from '@/lib/design-tokens-schema';
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
  Globe,
  Users,
  Server,
  Copy,
  CheckCheck,
  Trash2,
  UserPlus,
  Shield,
  Rocket,
  Download,
  Github,
  Container,
  ExternalLink,
  ClipboardList,
  Palette,
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

// ─── Quality Pass types ────────────────────────────────────────────────────────

interface CheckResult {
  check: 'install' | 'build' | 'lint' | 'typecheck';
  passed: boolean;
  output: string;
  durationMs: number;
}

type QualityRunStatus = 'queued' | 'running' | 'passed' | 'failed' | 'stopped';

interface QualityRun {
  id: string;
  project_id: string;
  status: QualityRunStatus;
  type: string;
  attempt: number;
  max_attempts: number;
  result_json: { passed: boolean; checks: CheckResult[] } | null;
  logs_storage_path: string | null;
  /** Signed URL returned by the status API for log download */
  logsUrl: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

interface ProjectDomain {
  id: string;
  project_id: string;
  domain: string;
  status: 'pending_dns' | 'pending_tls' | 'active' | 'error';
  verification_token: string;
  cname_target: string;
  error_message: string | null;
  created_at: string;
}

interface ProjectDeployment {
  id: string;
  project_id: string;
  provider: string;
  deploy_url: string | null;
  status: string;
  commit_sha: string | null;
  rollback_of: string | null;
  error_message: string | null;
  deployed_at: string | null;
  created_at: string;
  finished_at: string | null;
}

interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string | null;
  role: 'owner' | 'editor' | 'viewer';
  invited_by: string;
  invited_email: string;
  status: 'pending' | 'active' | 'declined';
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
  const [fetchedLogs, setFetchedLogs] = useState<string | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const checks = run.result_json?.checks ?? [];
  const attemptLabel = run.max_attempts > 1 ? ` (attempt ${run.attempt}/${run.max_attempts})` : '';

  async function handleToggleLogs() {
    if (showLogs) { setShowLogs(false); return; }
    setShowLogs(true);
    if (!fetchedLogs && run.logsUrl) {
      setLoadingLogs(true);
      try {
        const res = await fetch(run.logsUrl);
        setFetchedLogs(res.ok ? await res.text() : 'Failed to load logs.');
      } catch {
        setFetchedLogs('Failed to load logs.');
      } finally {
        setLoadingLogs(false);
      }
    }
  }

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
          {qualityStatusLabel(run.status)}{attemptLabel}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#475569' }}>
          {new Date(run.created_at).toLocaleString()}
        </span>
      </div>

      {checks.length > 0 && (
        <div style={{ marginBottom: '0.5rem' }}>
          {checks.map((c) => (
            <CheckBadge key={c.check} result={c} />
          ))}
        </div>
      )}

      {(run.logsUrl || run.logs_storage_path) && (
        <button
          onClick={handleToggleLogs}
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
      {showLogs && (
        <pre
          style={{
            marginTop: '0.5rem', fontSize: '0.72rem', color: '#64748b',
            whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            background: '#07070f', borderRadius: '6px', padding: '0.75rem',
            maxHeight: '400px', overflow: 'auto',
          }}
        >
          {loadingLogs ? 'Loading logs…' : (fetchedLogs ?? 'No logs available.')}
        </pre>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

type Tab = 'conversation' | 'files' | 'builds' | 'quality' | 'domains' | 'deployments' | 'team' | 'publish' | 'design';

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

  // Domains state
  const [domains, setDomains] = useState<ProjectDomain[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);
  const [domainError, setDomainError] = useState<string | null>(null);
  const [verifyingDomainId, setVerifyingDomainId] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Deployments (deploy history) state
  const [deployments, setDeployments] = useState<ProjectDeployment[]>([]);
  const [rollingBackId, setRollingBackId] = useState<string | null>(null);
  const [rollbackMessage, setRollbackMessage] = useState<string | null>(null);

  // Team members state
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('viewer');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  // Publish state
  const [ghRepoName, setGhRepoName] = useState('');
  const [ghPat, setGhPat] = useState('');
  const [ghPublishing, setGhPublishing] = useState(false);
  const [ghResult, setGhResult] = useState<{ repoUrl?: string; commitSha?: string; error?: string } | null>(null);
  const [dockerEndpoint, setDockerEndpoint] = useState('');
  const [dockerToken, setDockerToken] = useState('');
  const [dockerDeploying, setDockerDeploying] = useState(false);
  const [dockerResult, setDockerResult] = useState<{ success?: boolean; status?: string; message?: string; error?: string } | null>(null);
  const [zipDownloading, setZipDownloading] = useState(false);

  // Design tokens state
  const [designTokens, setDesignTokens] = useState<ProjectDesignTokens | null>(null);

  // UI
  const [activeTab, setActiveTab] = useState<Tab>('conversation');
  const streamEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [planDrawerOpen, setPlanDrawerOpen] = useState(false);

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

  const fetchDomains = useCallback(async () => {
    if (!token || !projectId) return;
    const res = await fetch(`/api/projects/${projectId}/domains`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    setDomains(data.domains ?? []);
  }, [token, projectId]);

  const fetchDeployments = useCallback(async () => {
    if (!token || !projectId) return;
    const res = await fetch(`/api/projects/${projectId}/deployments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    setDeployments(data.deployments ?? []);
  }, [token, projectId]);

  const fetchMembers = useCallback(async () => {
    if (!token || !projectId) return;
    const res = await fetch(`/api/projects/${projectId}/members`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    setMembers(data.members ?? []);
  }, [token, projectId]);

  const fetchDesignTokens = useCallback(async () => {
    if (!token || !projectId) return;
    const res = await fetch(`/api/projects/${projectId}/design-tokens`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json() as { tokens?: ProjectDesignTokens };
    if (data.tokens) setDesignTokens(data.tokens);
  }, [token, projectId]);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    Promise.all([fetchProject(), fetchFiles(), fetchBuilds(), fetchMessages(), fetchQualityRuns(), fetchDomains(), fetchDeployments(), fetchMembers(), fetchDesignTokens()])
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

  async function handleStartQuality(previousRunId?: string) {
    if (!token || qualityStarting) return;
    setQualityStarting(true);
    try {
      const body: Record<string, string> = {};
      if (previousRunId) body.previousRunId = previousRunId;
      const res = await fetch(`/api/projects/${projectId}/quality/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.runId) {
        setActiveQualityRunId(data.runId as string);
        setQualityRuns((prev) => [{
          id: data.runId as string,
          project_id: projectId,
          status: 'queued',
          type: 'quality',
          attempt: 1,
          max_attempts: 4,
          result_json: null,
          logs_storage_path: null,
          logsUrl: null,
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

  // ─── Domain handlers ───────────────────────────────────────────────────────

  async function handleAddDomain() {
    if (!token || !newDomain.trim() || addingDomain) return;
    setAddingDomain(true);
    setDomainError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/domains`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewDomain('');
        await fetchDomains();
      } else {
        setDomainError(data.error ?? 'Failed to add domain');
      }
    } catch {
      setDomainError('Network error');
    }
    setAddingDomain(false);
  }

  async function handleDeleteDomain(domainId: string) {
    if (!token) return;
    const res = await fetch(`/api/projects/${projectId}/domains/${domainId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) await fetchDomains();
  }

  async function handleVerifyDomain(domainId: string) {
    if (!token || verifyingDomainId) return;
    setVerifyingDomainId(domainId);
    try {
      const res = await fetch(`/api/projects/${projectId}/domains/${domainId}/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) await fetchDomains();
    } finally {
      setVerifyingDomainId(null);
    }
  }

  function handleCopyToken(token: string, domainId: string) {
    navigator.clipboard.writeText(token).then(() => {
      setCopiedToken(domainId);
      setTimeout(() => setCopiedToken(null), 2000);
    }).catch(() => {});
  }

  // ─── Deployment rollback handlers ──────────────────────────────────────────

  async function handleRollback(deploymentId: string) {
    if (!token || rollingBackId) return;
    setRollingBackId(deploymentId);
    setRollbackMessage(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/deployments/${deploymentId}/rollback`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setRollbackMessage('Rollback initiated ✓');
        await fetchDeployments();
      } else {
        setRollbackMessage(data.error ?? 'Rollback failed');
      }
    } catch {
      setRollbackMessage('Network error');
    }
    setRollingBackId(null);
    setTimeout(() => setRollbackMessage(null), 4000);
  }

  // ─── Member handlers ───────────────────────────────────────────────────────

  async function handleInviteMember() {
    if (!token || !inviteEmail.trim() || inviting) return;
    setInviting(true);
    setInviteError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteEmail('');
        await fetchMembers();
      } else {
        setInviteError(data.error ?? 'Failed to invite member');
      }
    } catch {
      setInviteError('Network error');
    }
    setInviting(false);
  }

  async function handleRemoveMember(memberId: string) {
    if (!token) return;
    const res = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) await fetchMembers();
  }

  // ─── Publish handlers ──────────────────────────────────────────────────────

  async function handleExportZip() {
    if (!token || !projectId) return;
    setZipDownloading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/export.zip`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({ error: 'Download failed' }))).error);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project?.title ?? 'project'}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setZipDownloading(false);
    }
  }

  async function handleGithubPublish() {
    if (!token || !projectId) return;
    if (!ghRepoName.trim()) { alert('Enter a repository name'); return; }
    if (!ghPat.trim()) { alert('Enter your GitHub PAT'); return; }
    setGhPublishing(true);
    setGhResult(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/publish/github`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ repoName: ghRepoName.trim(), githubToken: ghPat.trim() }),
      });
      const data = await res.json() as { repoUrl?: string; commitSha?: string; error?: string };
      setGhResult(data);
    } catch (err) {
      setGhResult({ error: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setGhPublishing(false);
    }
  }

  async function handleDockerDeploy() {
    if (!token || !projectId) return;
    if (!dockerEndpoint.trim()) { alert('Enter a Docker deploy endpoint URL'); return; }
    if (!dockerToken.trim()) { alert('Enter the Docker deploy token'); return; }
    setDockerDeploying(true);
    setDockerResult(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/publish/docker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ endpoint: dockerEndpoint.trim(), token: dockerToken.trim() }),
      });
      const data = await res.json() as { success?: boolean; status?: string; message?: string; error?: string };
      setDockerResult(data);
    } catch (err) {
      setDockerResult({ error: err instanceof Error ? err.message : 'Unknown error' });
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
  const activeDomain = domains.find((d) => d.status === 'active');

  return (
    <SidebarLayout>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', minHeight: '100vh', background: '#0a0a0f' }}>
        {/* ── Main content column ── */}
        <div style={{ ...s.page, flex: 1, minWidth: 0, marginBottom: 0 }}>
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
              {activeDomain && (
                <a
                  href={`https://${activeDomain.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...s.badge, background: 'rgba(16,185,129,0.15)', color: '#10b981', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <Globe size={11} /> {activeDomain.domain}
                </a>
              )}
            </div>
          </div>
          {/* Plan & Checklist toggle button */}
          <button
            onClick={() => setPlanDrawerOpen((v) => !v)}
            title="Plan & Checklist"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.45rem 0.875rem', borderRadius: '8px',
              background: planDrawerOpen ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.08)',
              color: planDrawerOpen ? '#818cf8' : '#64748b',
              border: `1px solid ${planDrawerOpen ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.15)'}`,
              cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap',
            }}
          >
            <ClipboardList size={15} />
            Plan &amp; Checklist
          </button>
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
          {(['conversation', 'files', 'builds', 'quality', 'domains', 'deployments', 'team', 'publish', 'design'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ ...s.tabBtn, ...(activeTab === tab ? s.tabBtnActive : {}) }}
            >
              {tab === 'conversation' && <MessageSquare size={14} />}
              {tab === 'files' && <FileCode2 size={14} />}
              {tab === 'builds' && <History size={14} />}
              {tab === 'quality' && <ShieldCheck size={14} />}
              {tab === 'domains' && <Globe size={14} />}
              {tab === 'deployments' && <Server size={14} />}
              {tab === 'team' && <Users size={14} />}
              {tab === 'publish' && <Rocket size={14} />}
              {tab === 'design' && <Palette size={14} />}
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
              {tab === 'domains' && domains.length > 0 && (
                <span style={s.badge}>{domains.length}</span>
              )}
              {tab === 'team' && members.length > 0 && (
                <span style={s.badge}>{members.length}</span>
              )}
            </button>
          ))}
          <button
            onClick={() => { fetchFiles(); fetchBuilds(); fetchMessages(); fetchQualityRuns(); fetchDomains(); fetchDeployments(); fetchMembers(); fetchDesignTokens(); }}
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
                    build · lint · typecheck — runs in remote runner, app applies AI fixes
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {canAutoFix && (
                    <button
                      onClick={() => handleStartQuality(latestQualityRun?.id)}
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
                    onClick={() => handleStartQuality()}
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
                  <strong>Security note:</strong> Checks run in an isolated remote runner container,
                  not in the app. Logs are stored in Supabase Storage.
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

          {/* ── Publish ── */}
          {activeTab === 'publish' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Export ZIP */}
              <div style={s.buildPanel}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Download size={16} style={{ color: '#818cf8' }} />
                  <p style={s.panelTitle}>Export ZIP</p>
                </div>
                <p style={s.panelDesc}>Download all project files as a ZIP archive.</p>
                <button
                  onClick={handleExportZip}
                  disabled={zipDownloading}
                  style={{
                    ...s.primaryBtn,
                    background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                    color: '#fff',
                    cursor: zipDownloading ? 'not-allowed' : 'pointer',
                    opacity: zipDownloading ? 0.6 : 1,
                    alignSelf: 'flex-start',
                  }}
                >
                  {zipDownloading
                    ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Preparing…</>
                    : <><Download size={14} /> Download ZIP</>}
                </button>
              </div>

              {/* Push to GitHub */}
              <div style={s.buildPanel}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Github size={16} style={{ color: '#818cf8' }} />
                  <p style={s.panelTitle}>Push to GitHub</p>
                </div>
                <p style={s.panelDesc}>
                  Push project files to a GitHub repository using a Personal Access Token.
                  The repo will be created if it does not exist.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  <input
                    type="text"
                    placeholder="Repository name (e.g. my-awesome-app)"
                    value={ghRepoName}
                    onChange={(e) => setGhRepoName(e.target.value)}
                    style={{ ...s.textarea, minHeight: 'unset', padding: '0.5rem 0.75rem', resize: 'none' }}
                  />
                  <input
                    type="password"
                    placeholder="GitHub PAT (repo scope required)"
                    value={ghPat}
                    onChange={(e) => setGhPat(e.target.value)}
                    style={{ ...s.textarea, minHeight: 'unset', padding: '0.5rem 0.75rem', resize: 'none' }}
                  />
                  <button
                    onClick={handleGithubPublish}
                    disabled={ghPublishing}
                    style={{
                      ...s.primaryBtn,
                      background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                      color: '#fff',
                      cursor: ghPublishing ? 'not-allowed' : 'pointer',
                      opacity: ghPublishing ? 0.6 : 1,
                      alignSelf: 'flex-start',
                    }}
                  >
                    {ghPublishing
                      ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Pushing…</>
                      : <><Github size={14} /> Push to GitHub</>}
                  </button>
                  {ghResult && (
                    ghResult.error
                      ? <div style={s.errorBox}><XCircle size={14} /> {ghResult.error}</div>
                      : <div style={{
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                          padding: '0.625rem 0.75rem', borderRadius: '8px',
                          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
                          color: '#10b981', fontSize: '0.85rem',
                        }}>
                          <CheckCircle2 size={14} />
                          <span>Published! </span>
                          {ghResult.repoUrl && (
                            <a href={ghResult.repoUrl} target="_blank" rel="noopener noreferrer"
                              style={{ color: '#34d399', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              {ghResult.repoUrl} <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                  )}
                </div>
              </div>

              {/* Deploy to Docker */}
              <div style={s.buildPanel}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Container size={16} style={{ color: '#818cf8' }} />
                  <p style={s.panelTitle}>Deploy to Docker Server</p>
                </div>
                <p style={s.panelDesc}>
                  Trigger a deploy on your self-hosted Docker server.
                  See <a href="https://github.com/kimlainchhorng/ZIVO-AI/blob/main/docs/docker-deploy-agent.md"
                    target="_blank" rel="noopener noreferrer"
                    style={{ color: '#818cf8' }}>Docker Deploy Agent docs</a> to set up your server.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  <input
                    type="url"
                    placeholder="Docker deploy endpoint URL (e.g. https://my-server:4242/deploy)"
                    value={dockerEndpoint}
                    onChange={(e) => setDockerEndpoint(e.target.value)}
                    style={{ ...s.textarea, minHeight: 'unset', padding: '0.5rem 0.75rem', resize: 'none' }}
                  />
                  <input
                    type="password"
                    placeholder="Deploy token (shared secret with your Docker server)"
                    value={dockerToken}
                    onChange={(e) => setDockerToken(e.target.value)}
                    style={{ ...s.textarea, minHeight: 'unset', padding: '0.5rem 0.75rem', resize: 'none' }}
                  />
                  <button
                    onClick={handleDockerDeploy}
                    disabled={dockerDeploying}
                    style={{
                      ...s.primaryBtn,
                      background: 'linear-gradient(135deg,#0ea5e9,#0284c7)',
                      color: '#fff',
                      cursor: dockerDeploying ? 'not-allowed' : 'pointer',
                      opacity: dockerDeploying ? 0.6 : 1,
                      alignSelf: 'flex-start',
                    }}
                  >
                    {dockerDeploying
                      ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Deploying…</>
                      : <><Rocket size={14} /> Deploy</>}
                  </button>
                  {dockerResult && (
                    dockerResult.error
                      ? <div style={s.errorBox}><XCircle size={14} /> {dockerResult.error}</div>
                      : <div style={{
                          padding: '0.625rem 0.75rem', borderRadius: '8px',
                          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
                          color: '#10b981', fontSize: '0.85rem',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CheckCircle2 size={14} />
                            <strong>Deploy triggered</strong>
                            {dockerResult.status && <span style={{ color: '#64748b' }}>· {dockerResult.status}</span>}
                          </div>
                          {dockerResult.message && (
                            <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>{dockerResult.message}</p>
                          )}
                        </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ── Domains ── */}
          {activeTab === 'domains' && (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 1rem' }}>
                  Add custom domains for your Docker deployment. Point a CNAME at <code style={{ color: '#818cf8' }}>proxy.zivo-ai.app</code> and verify ownership via DNS TXT record.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <input
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="e.g. app.example.com"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddDomain(); }}
                    style={{
                      flex: 1, minWidth: '200px',
                      padding: '0.5rem 0.75rem', borderRadius: '8px',
                      background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(51,65,85,0.5)',
                      color: '#f1f5f9', fontSize: '0.875rem', outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleAddDomain}
                    disabled={addingDomain || !newDomain.trim()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.5rem 1rem', borderRadius: '8px',
                      background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                      color: '#fff', border: 'none', cursor: 'pointer',
                      fontWeight: 600, fontSize: '0.85rem',
                      opacity: addingDomain || !newDomain.trim() ? 0.6 : 1,
                    }}
                  >
                    {addingDomain ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Globe size={14} />}
                    Add Domain
                  </button>
                </div>
                {domainError && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <AlertCircle size={13} /> {domainError}
                  </div>
                )}
              </div>

              {domains.length === 0 ? (
                <div style={s.emptyTab}>
                  <Globe size={32} style={{ color: '#475569', marginBottom: '0.75rem' }} />
                  <p>No custom domains yet. Add one above.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {domains.map((d) => (
                    <div
                      key={d.id}
                      style={{
                        borderRadius: '10px',
                        border: `1px solid ${d.status === 'active' ? 'rgba(16,185,129,0.3)' : d.status === 'error' ? 'rgba(239,68,68,0.25)' : 'rgba(99,102,241,0.15)'}`,
                        background: d.status === 'active' ? 'rgba(16,185,129,0.05)' : 'rgba(15,15,26,0.6)',
                        padding: '0.875rem 1rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <Globe size={15} style={{ color: d.status === 'active' ? '#10b981' : '#6366f1', flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, color: '#f1f5f9', flex: 1 }}>{d.domain}</span>
                        <span style={{
                          ...s.badge,
                          background: d.status === 'active' ? 'rgba(16,185,129,0.2)' : d.status === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                          color: d.status === 'active' ? '#10b981' : d.status === 'error' ? '#ef4444' : '#f59e0b',
                          fontSize: '0.72rem',
                        }}>
                          {d.status.replace('_', ' ')}
                        </span>
                        {d.status !== 'active' && (
                          <button
                            onClick={() => handleVerifyDomain(d.id)}
                            disabled={verifyingDomainId === d.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '0.3rem',
                              padding: '0.3rem 0.625rem', borderRadius: '6px',
                              background: 'rgba(99,102,241,0.15)', color: '#818cf8',
                              border: '1px solid rgba(99,102,241,0.25)', cursor: 'pointer',
                              fontSize: '0.78rem', fontWeight: 600,
                              opacity: verifyingDomainId === d.id ? 0.6 : 1,
                            }}
                          >
                            {verifyingDomainId === d.id
                              ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                              : <Shield size={11} />}
                            Verify
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteDomain(d.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                            padding: '0.3rem 0.625rem', borderRadius: '6px',
                            background: 'rgba(239,68,68,0.08)', color: '#ef4444',
                            border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer',
                            fontSize: '0.78rem',
                          }}
                        >
                          <Trash2 size={11} /> Remove
                        </button>
                      </div>

                      {d.status !== 'active' && (
                        <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: '#64748b' }}>
                          <div style={{ marginBottom: '0.3rem' }}>
                            Add a <strong style={{ color: '#94a3b8' }}>CNAME</strong> record: <code style={{ color: '#818cf8' }}>{d.domain}</code> → <code style={{ color: '#10b981' }}>{d.cname_target}</code>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>TXT record: <code style={{ color: '#f59e0b', userSelect: 'all' }}>_zivo-verify.{d.domain}</code> = <code style={{ color: '#f59e0b' }}>{d.verification_token}</code></span>
                            <button
                              onClick={() => handleCopyToken(d.verification_token, d.id)}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6366f1', padding: '0 0.2rem', display: 'flex', alignItems: 'center' }}
                              title="Copy token"
                            >
                              {copiedToken === d.id ? <CheckCheck size={12} color="#10b981" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </div>
                      )}

                      {d.error_message && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <AlertCircle size={12} /> {d.error_message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Deployments (deploy history + rollback) ── */}
          {activeTab === 'deployments' && (
            <div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 1rem' }}>
                Deployment history for this project. Click <strong style={{ color: '#818cf8' }}>Rollback</strong> to re-deploy a prior successful deployment.
              </p>

              {rollbackMessage && (
                <div style={{
                  padding: '0.625rem 0.875rem', borderRadius: '8px', marginBottom: '0.75rem',
                  background: rollbackMessage.includes('✓') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${rollbackMessage.includes('✓') ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                  color: rollbackMessage.includes('✓') ? '#10b981' : '#ef4444',
                  fontSize: '0.875rem',
                }}>
                  {rollbackMessage}
                </div>
              )}

              {deployments.length === 0 ? (
                <div style={s.emptyTab}>
                  <Server size={32} style={{ color: '#475569', marginBottom: '0.75rem' }} />
                  <p>No deployments yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {deployments.map((dep) => (
                    <div
                      key={dep.id}
                      style={{
                        borderRadius: '10px',
                        border: dep.rollback_of ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(99,102,241,0.1)',
                        background: 'rgba(15,15,26,0.6)',
                        padding: '0.875rem 1rem',
                        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                          <span style={{
                            ...s.badge,
                            background: dep.status === 'success' ? 'rgba(16,185,129,0.2)' : dep.status === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                            color: dep.status === 'success' ? '#10b981' : dep.status === 'error' ? '#ef4444' : '#f59e0b',
                          }}>
                            {dep.status}
                          </span>
                          <span style={{ ...s.badge, background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>{dep.provider}</span>
                          {dep.rollback_of && (
                            <span style={{ ...s.badge, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: '0.7rem' }}>
                              <RotateCcw size={10} /> rollback
                            </span>
                          )}
                          <span style={{ fontSize: '0.75rem', color: '#475569', marginLeft: 'auto' }}>
                            {new Date(dep.created_at).toLocaleString()}
                          </span>
                        </div>
                        {dep.commit_sha && (
                          <div style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'monospace' }}>
                            SHA: {dep.commit_sha.slice(0, 12)}
                          </div>
                        )}
                        {dep.deploy_url && (
                          <a href={dep.deploy_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.78rem', color: '#6366f1', wordBreak: 'break-all' }}>
                            {dep.deploy_url}
                          </a>
                        )}
                        {dep.error_message && (
                          <div style={{ marginTop: '0.25rem', fontSize: '0.78rem', color: '#ef4444' }}>{dep.error_message}</div>
                        )}
                      </div>
                      {dep.status === 'success' && !dep.rollback_of && (
                        <button
                          onClick={() => handleRollback(dep.id)}
                          disabled={rollingBackId === dep.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                            padding: '0.4rem 0.75rem', borderRadius: '7px',
                            background: 'rgba(99,102,241,0.12)', color: '#818cf8',
                            border: '1px solid rgba(99,102,241,0.25)', cursor: 'pointer',
                            fontWeight: 600, fontSize: '0.8rem', flexShrink: 0,
                            opacity: rollingBackId === dep.id ? 0.6 : 1,
                          }}
                        >
                          {rollingBackId === dep.id
                            ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                            : <RotateCcw size={12} />}
                          Rollback
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Team ── */}
          {activeTab === 'team' && (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 1rem' }}>
                  Invite collaborators to this project. Editors can trigger builds; viewers have read-only access.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <input
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleInviteMember(); }}
                    style={{
                      flex: 1, minWidth: '200px',
                      padding: '0.5rem 0.75rem', borderRadius: '8px',
                      background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(51,65,85,0.5)',
                      color: '#f1f5f9', fontSize: '0.875rem', outline: 'none',
                    }}
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'editor' | 'viewer')}
                    style={{
                      padding: '0.5rem 0.75rem', borderRadius: '8px',
                      background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(51,65,85,0.5)',
                      color: '#f1f5f9', fontSize: '0.875rem', cursor: 'pointer',
                    }}
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                  <button
                    onClick={handleInviteMember}
                    disabled={inviting || !inviteEmail.trim()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.5rem 1rem', borderRadius: '8px',
                      background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                      color: '#fff', border: 'none', cursor: 'pointer',
                      fontWeight: 600, fontSize: '0.85rem',
                      opacity: inviting || !inviteEmail.trim() ? 0.6 : 1,
                    }}
                  >
                    {inviting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <UserPlus size={14} />}
                    Invite
                  </button>
                </div>
                {inviteError && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <AlertCircle size={13} /> {inviteError}
                  </div>
                )}
              </div>

              {members.length === 0 ? (
                <div style={s.emptyTab}>
                  <Users size={32} style={{ color: '#475569', marginBottom: '0.75rem' }} />
                  <p>No team members yet. Invite collaborators above.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {members.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        borderRadius: '10px',
                        border: '1px solid rgba(99,102,241,0.12)',
                        background: 'rgba(15,15,26,0.6)',
                        padding: '0.75rem 1rem',
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                      }}
                    >
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: 'rgba(99,102,241,0.2)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Users size={14} color="#818cf8" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.invited_email}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                          Invited {new Date(m.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <span style={{
                        ...s.badge,
                        background: m.role === 'editor' ? 'rgba(99,102,241,0.2)' : 'rgba(51,65,85,0.4)',
                        color: m.role === 'editor' ? '#818cf8' : '#94a3b8',
                        fontSize: '0.72rem',
                      }}>
                        {m.role}
                      </span>
                      <span style={{
                        ...s.badge,
                        background: m.status === 'active' ? 'rgba(16,185,129,0.15)' : m.status === 'declined' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                        color: m.status === 'active' ? '#10b981' : m.status === 'declined' ? '#ef4444' : '#f59e0b',
                        fontSize: '0.72rem',
                      }}>
                        {m.status}
                      </span>
                      <button
                        onClick={() => handleRemoveMember(m.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.3rem',
                          padding: '0.3rem 0.5rem', borderRadius: '6px',
                          background: 'rgba(239,68,68,0.08)', color: '#ef4444',
                          border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer',
                          fontSize: '0.78rem',
                        }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Design Tokens ── */}
          {activeTab === 'design' && token && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 0.25rem' }}>
                  Configure your project&apos;s design system tokens. The AI will use these tokens consistently in all generated pages.
                </p>
                <p style={{ fontSize: '0.75rem', color: '#475569', margin: 0 }}>
                  Use <code style={{ color: '#818cf8' }}>?format=css</code> on the API endpoint to download the generated <code style={{ color: '#818cf8' }}>tokens.css</code>.
                </p>
              </div>
              <DesignTokensPanel
                projectId={projectId}
                authToken={token}
                initialTokens={designTokens ?? undefined}
                onSaved={(updated) => setDesignTokens(updated)}
              />
            </div>
          )}
        </div>
        </div>{/* end main content column */}

        {/* ── Plan & Checklist right-side drawer ── */}
        {planDrawerOpen && token && (
          <div style={{
            width: '340px', flexShrink: 0, paddingTop: '2rem', paddingRight: '1.5rem',
            position: 'sticky', top: 0, maxHeight: '100vh', overflowY: 'auto',
          }}>
            <PlanChecklist
              projectId={projectId}
              token={token}
              onApplied={() => { fetchFiles(); fetchBuilds(); fetchMessages(); }}
            />
          </div>
        )}
      </div>

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
  } as React.CSSProperties,

  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
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
};
