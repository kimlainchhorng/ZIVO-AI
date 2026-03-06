'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SidebarLayout from '@/components/layout/SidebarLayout';
import {
  Play,
  Square,
  Save,
  RotateCcw,
  ChevronRight,
  Loader2,
  Clock,
  FileCode,
  Eye,
} from 'lucide-react';
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  title: string;
  mode: string;
  visibility: string;
  created_at: string;
  updated_at: string;
}

interface ProjectFile {
  id: string;
  project_id: string;
  path: string;
  content: string;
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

type Tab = 'preview' | 'files' | 'builds';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('zivo_supabase_token');
}

function guessLanguage(path: string): string {
  if (path.endsWith('.tsx') || path.endsWith('.ts')) return 'typescript';
  if (path.endsWith('.jsx') || path.endsWith('.js')) return 'javascript';
  if (path.endsWith('.css')) return 'css';
  if (path.endsWith('.html')) return 'html';
  if (path.endsWith('.json')) return 'json';
  if (path.endsWith('.md')) return 'markdown';
  return 'plaintext';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProjectWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = typeof params?.id === 'string' ? params.id : '';

  const token = getStoredToken();

  // ── Project state ──────────────────────────────────────────────────────────
  const [project, setProject] = useState<Project | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);

  // ── Tab ───────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('preview');

  // ── Preview state ─────────────────────────────────────────────────────────
  const [previewStatus, setPreviewStatus] = useState<'idle' | 'loading' | 'running'>('idle');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // ── Files state ───────────────────────────────────────────────────────────
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [savingFile, setSavingFile] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // ── Builds state ──────────────────────────────────────────────────────────
  const [builds, setBuilds] = useState<ProjectBuild[]>([]);
  const [loadingBuilds, setLoadingBuilds] = useState(false);
  const [restoringBuildId, setRestoringBuildId] = useState<string | null>(null);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // ── Auth redirect ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) {
      router.push('/auth?next=' + encodeURIComponent(`/projects/${projectId}`));
    }
  }, [token, router, projectId]);

  // ── Fetch project metadata ─────────────────────────────────────────────────
  useEffect(() => {
    if (!token || !projectId) return;
    setLoadingProject(true);
    fetch(`/api/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.project) setProject(d.project);
      })
      .catch(() => {})
      .finally(() => setLoadingProject(false));
  }, [token, projectId]);

  // ── Fetch files ────────────────────────────────────────────────────────────
  const fetchFiles = useCallback(async () => {
    if (!token || !projectId) return;
    setLoadingFiles(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/files`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setFiles(data.files ?? []);
      }
    } catch {}
    setLoadingFiles(false);
  }, [token, projectId]);

  // ── Fetch builds ───────────────────────────────────────────────────────────
  const fetchBuilds = useCallback(async () => {
    if (!token || !projectId) return;
    setLoadingBuilds(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/builds`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setBuilds(data.builds ?? []);
      }
    } catch {}
    setLoadingBuilds(false);
  }, [token, projectId]);

  useEffect(() => {
    if (activeTab === 'files') fetchFiles();
    if (activeTab === 'builds') fetchBuilds();
  }, [activeTab, fetchFiles, fetchBuilds]);

  // ── Select a file ──────────────────────────────────────────────────────────
  function selectFile(file: ProjectFile) {
    setSelectedFile(file);
    setEditorContent(file.content);
    setSaveMessage(null);
  }

  // ── Save file ─────────────────────────────────────────────────────────────
  async function saveFile() {
    if (!token || !selectedFile || !projectId) return;
    setSavingFile(true);
    setSaveMessage(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/files`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: selectedFile.path, content: editorContent }),
      });
      if (res.ok) {
        setSaveMessage('Saved ✓');
        setFiles((prev) =>
          prev.map((f) =>
            f.path === selectedFile.path ? { ...f, content: editorContent } : f
          )
        );
        setSelectedFile((prev) => (prev ? { ...prev, content: editorContent } : prev));
      } else {
        const d = await res.json();
        setSaveMessage(d.error ?? 'Save failed');
      }
    } catch {
      setSaveMessage('Network error');
    }
    setSavingFile(false);
    setTimeout(() => setSaveMessage(null), 3000);
  }

  // ── Start preview ─────────────────────────────────────────────────────────
  async function startPreview() {
    if (!token || !projectId) return;
    setPreviewStatus('loading');
    setPreviewError(null);
    try {
      const res = await fetch('/api/preview/start', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (res.ok && data.previewHtml) {
        setPreviewHtml(data.previewHtml);
        setPreviewStatus('running');
      } else {
        setPreviewError(data.error ?? 'Failed to start preview');
        setPreviewStatus('idle');
      }
    } catch {
      setPreviewError('Network error');
      setPreviewStatus('idle');
    }
  }

  // ── Stop preview ──────────────────────────────────────────────────────────
  async function stopPreview() {
    try {
      await fetch('/api/preview/stop', { method: 'POST' });
    } catch {
      // Non-fatal — clear local state regardless
    }
    setPreviewStatus('idle');
    setPreviewHtml(null);
  }

  // ── Restore build ─────────────────────────────────────────────────────────
  async function restoreBuild(buildId: string) {
    if (!token || !projectId) return;
    setRestoringBuildId(buildId);
    setRestoreMessage(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/restore`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ buildId }),
      });
      const data = await res.json();
      if (res.ok) {
        setRestoreMessage('Build restored successfully ✓');
        // Refresh files if on files tab
        if (activeTab === 'files') fetchFiles();
      } else {
        setRestoreMessage(data.error ?? 'Restore failed');
      }
    } catch {
      setRestoreMessage('Network error');
    }
    setRestoringBuildId(null);
    setTimeout(() => setRestoreMessage(null), 4000);
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  const s = {
    container: {
      padding: '1.5rem',
      minHeight: '100vh',
      background: '#0a0a0f',
      color: '#f1f5f9',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '1rem',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      flexWrap: 'wrap' as const,
    },
    breadcrumb: { fontSize: '0.85rem', color: '#64748b', cursor: 'pointer' },
    title: { fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9', margin: 0 },
    badge: (color: string) => ({
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '0.75rem',
      background: `${color}22`,
      color: color,
    }),
    tabs: {
      display: 'flex',
      gap: '0.25rem',
      borderBottom: '1px solid rgba(99,102,241,0.15)',
      paddingBottom: '0',
    },
    tab: (active: boolean) => ({
      padding: '0.625rem 1.25rem',
      borderRadius: '8px 8px 0 0',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: active ? 600 : 400,
      color: active ? '#818cf8' : '#94a3b8',
      background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    }),
    panel: {
      flex: 1,
      borderRadius: '0 8px 8px 8px',
      border: '1px solid rgba(99,102,241,0.15)',
      background: 'rgba(15,15,26,0.8)',
      padding: '1.25rem',
      minHeight: '500px',
    },
    btn: (variant: 'primary' | 'danger' | 'ghost') => {
      const variants = {
        primary: { background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none' },
        danger: { background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' },
        ghost: { background: 'rgba(99,102,241,0.08)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' },
      };
      return {
        ...variants[variant],
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '0.875rem',
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
      };
    },
  };

  if (!token) return null;

  return (
    <SidebarLayout>
      <div style={s.container}>
        {/* Header */}
        <div style={s.header}>
          <button
            onClick={() => router.push('/projects')}
            style={s.breadcrumb}
          >
            Projects
          </button>
          <ChevronRight size={14} color="#64748b" />
          {loadingProject ? (
            <Loader2 size={16} style={{ color: '#64748b', animation: 'spin 1s linear infinite' }} />
          ) : (
            <>
              <h1 style={s.title}>{project?.title ?? 'Project Workspace'}</h1>
              {project && (
                <>
                  <span style={s.badge('#818cf8')}>{project.mode}</span>
                  <span style={s.badge(project.visibility === 'public' ? '#10b981' : '#6366f1')}>
                    {project.visibility}
                  </span>
                </>
              )}
            </>
          )}
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          {(['preview', 'files', 'builds'] as Tab[]).map((tab) => {
            const icons: Record<Tab, React.ReactNode> = {
              preview: <Eye size={15} />,
              files: <FileCode size={15} />,
              builds: <Clock size={15} />,
            };
            const labels: Record<Tab, string> = {
              preview: 'Preview',
              files: 'Files',
              builds: 'Build History',
            };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={s.tab(activeTab === tab)}
              >
                {icons[tab]}
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Panel */}
        <div style={s.panel}>
          {/* ── Preview Tab ─────────────────────────────────────────────── */}
          {activeTab === 'preview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                {previewStatus !== 'running' ? (
                  <button
                    onClick={startPreview}
                    disabled={previewStatus === 'loading'}
                    style={{ ...s.btn('primary'), opacity: previewStatus === 'loading' ? 0.7 : 1 }}
                  >
                    {previewStatus === 'loading' ? (
                      <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Play size={15} />
                    )}
                    {previewStatus === 'loading' ? 'Generating…' : 'Start Preview'}
                  </button>
                ) : (
                  <button onClick={stopPreview} style={s.btn('danger')}>
                    <Square size={15} />
                    Stop Preview
                  </button>
                )}
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    background:
                      previewStatus === 'running'
                        ? 'rgba(16,185,129,0.15)'
                        : previewStatus === 'loading'
                        ? 'rgba(245,158,11,0.15)'
                        : 'rgba(99,102,241,0.1)',
                    color:
                      previewStatus === 'running'
                        ? '#10b981'
                        : previewStatus === 'loading'
                        ? '#f59e0b'
                        : '#64748b',
                  }}
                >
                  {previewStatus === 'running' ? '● Running' : previewStatus === 'loading' ? '● Loading…' : '○ Idle'}
                </span>
              </div>

              {previewError && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    color: '#ef4444',
                    fontSize: '0.875rem',
                  }}
                >
                  {previewError}
                </div>
              )}

              {previewStatus === 'running' && previewHtml ? (
                <iframe
                  ref={iframeRef}
                  srcDoc={previewHtml}
                  style={{
                    flex: 1,
                    minHeight: '440px',
                    width: '100%',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: '8px',
                    background: '#fff',
                  }}
                  sandbox="allow-scripts allow-same-origin"
                  title="Project Preview"
                />
              ) : (
                <div
                  style={{
                    flex: 1,
                    minHeight: '440px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#334155',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    border: '1px dashed rgba(99,102,241,0.15)',
                    borderRadius: '8px',
                  }}
                >
                  <Eye size={40} />
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>Click &ldquo;Start Preview&rdquo; to render the project</p>
                </div>
              )}
            </div>
          )}

          {/* ── Files Tab ───────────────────────────────────────────────── */}
          {activeTab === 'files' && (
            <div style={{ display: 'flex', gap: '1rem', height: '600px' }}>
              {/* File tree */}
              <div
                style={{
                  width: '220px',
                  flexShrink: 0,
                  overflowY: 'auto',
                  borderRight: '1px solid rgba(99,102,241,0.12)',
                  paddingRight: '0.75rem',
                }}
              >
                <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Files
                </p>
                {loadingFiles ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.85rem' }}>
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    Loading…
                  </div>
                ) : files.length === 0 ? (
                  <p style={{ color: '#475569', fontSize: '0.85rem' }}>No files yet</p>
                ) : (
                  files.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => selectFile(file)}
                      title={file.path}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.375rem 0.5rem',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontFamily: 'monospace',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        background:
                          selectedFile?.id === file.id
                            ? 'rgba(99,102,241,0.15)'
                            : 'transparent',
                        color:
                          selectedFile?.id === file.id ? '#818cf8' : '#94a3b8',
                      }}
                    >
                      {file.path}
                    </button>
                  ))
                )}
              </div>

              {/* Editor */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedFile ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                        {selectedFile.path}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {saveMessage && (
                          <span style={{ fontSize: '0.8rem', color: saveMessage.includes('✓') ? '#10b981' : '#ef4444' }}>
                            {saveMessage}
                          </span>
                        )}
                        <button
                          onClick={saveFile}
                          disabled={savingFile}
                          style={{ ...s.btn('primary'), opacity: savingFile ? 0.7 : 1 }}
                        >
                          {savingFile ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
                          Save
                        </button>
                      </div>
                    </div>
                    <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(99,102,241,0.15)' }}>
                      <MonacoEditor
                        height="100%"
                        language={guessLanguage(selectedFile.path)}
                        value={editorContent}
                        onChange={(v) => setEditorContent(v ?? '')}
                        theme="vs-dark"
                        options={{
                          minimap: { enabled: false },
                          fontSize: 13,
                          scrollBeyondLastLine: false,
                          wordWrap: 'on',
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#334155',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <FileCode size={40} />
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>Select a file to edit</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Build History Tab ────────────────────────────────────────── */}
          {activeTab === 'builds' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#f1f5f9' }}>
                  Build History
                </h3>
                <button onClick={fetchBuilds} style={s.btn('ghost')}>
                  <RotateCcw size={14} />
                  Refresh
                </button>
              </div>

              {restoreMessage && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    background: restoreMessage.includes('✓')
                      ? 'rgba(16,185,129,0.1)'
                      : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${restoreMessage.includes('✓') ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                    color: restoreMessage.includes('✓') ? '#10b981' : '#ef4444',
                    fontSize: '0.875rem',
                  }}
                >
                  {restoreMessage}
                </div>
              )}

              {loadingBuilds ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Loading builds…
                </div>
              ) : builds.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '3rem',
                    color: '#475569',
                    border: '1px dashed rgba(99,102,241,0.15)',
                    borderRadius: '8px',
                  }}
                >
                  <Clock size={36} style={{ margin: '0 auto 0.75rem', display: 'block' }} />
                  No builds yet. Start a build to see history here.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {builds.map((build) => (
                    <div
                      key={build.id}
                      style={{
                        padding: '1rem',
                        borderRadius: '10px',
                        border: '1px solid rgba(99,102,241,0.15)',
                        background: 'rgba(15,15,26,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        flexWrap: 'wrap' as const,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 700, color: '#818cf8', fontSize: '0.9rem' }}>
                            Build #{build.build_number}
                          </span>
                          {build.snapshot_path && (
                            <span
                              style={{
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                background: 'rgba(16,185,129,0.12)',
                                color: '#10b981',
                              }}
                            >
                              snapshot
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', wordBreak: 'break-word' as const }}>
                          {build.summary ?? 'No summary'}
                        </p>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#475569' }}>
                          {new Date(build.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        {build.snapshot_path ? (
                          <button
                            onClick={() => restoreBuild(build.id)}
                            disabled={restoringBuildId === build.id}
                            style={{
                              ...s.btn('ghost'),
                              opacity: restoringBuildId === build.id ? 0.7 : 1,
                            }}
                          >
                            {restoringBuildId === build.id ? (
                              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                              <RotateCcw size={14} />
                            )}
                            {restoringBuildId === build.id ? 'Restoring…' : 'Restore'}
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#475569' }}>No snapshot</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </SidebarLayout>
  );
}
