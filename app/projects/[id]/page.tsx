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
  Loader2,
  LogIn,
  RotateCcw,
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('zivo_supabase_token');
}

// ─── Component ────────────────────────────────────────────────────────────────

type Tab = 'conversation' | 'files' | 'builds';

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

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    Promise.all([fetchProject(), fetchFiles(), fetchBuilds(), fetchMessages()])
      .catch((err) => setError(err.message ?? 'Failed to load workspace'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, token]);

  // Auto-scroll stream log
  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [streamLog]);

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
        const errData = await res.json().catch(() => ({}));
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
          {(['conversation', 'files', 'builds'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ ...s.tabBtn, ...(activeTab === tab ? s.tabBtnActive : {}) }}
            >
              {tab === 'conversation' && <MessageSquare size={14} />}
              {tab === 'files' && <FileCode2 size={14} />}
              {tab === 'builds' && <History size={14} />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'files' && files.length > 0 && (
                <span style={s.badge}>{files.length}</span>
              )}
              {tab === 'builds' && builds.length > 0 && (
                <span style={s.badge}>{builds.length}</span>
              )}
            </button>
          ))}
          <button
            onClick={() => { fetchFiles(); fetchBuilds(); fetchMessages(); }}
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
        </div>

        {/* Hidden iframe to bust preview cache — key change forces reload */}
        <iframe key={iframeKey} src="about:blank" style={{ display: 'none' }} title="preview-cache-bust" />
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
};
