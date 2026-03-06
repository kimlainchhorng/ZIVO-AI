'use client';

import { useEffect, useState } from 'react';

const COLORS = {
  bg: '#0a0b14',
  bgPanel: '#0f1120',
  bgCard: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  accent: '#6366f1',
  accentGradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  success: '#10b981',
  error: '#ef4444',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
};

interface ProjectFile {
  path: string;
  content: string;
  updated_at?: string;
}

interface Project {
  id: string;
  title: string;
  client_idea: string | null;
  mode: string;
  visibility: string;
  created_at: string;
  updated_at: string;
}

function getFileIcon(path: string) {
  const ext = path.split('.').pop()?.toLowerCase();
  const s: React.CSSProperties = { display: 'inline-block', flexShrink: 0 };
  if (ext === 'css')
    return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1 1.02 2.34 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/></svg>;
  if (ext === 'json')
    return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/></svg>;
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>;
}

export default function PublicProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [activeFile, setActiveFile] = useState<ProjectFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyDone, setCopyDone] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'files'>('preview');

  useEffect(() => {
    params.then(({ id: resolvedId }) => setId(resolvedId));
  }, [params]);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/public/projects/${id}`)
      .then((r) => r.json())
      .then((data: { project?: Project; files?: ProjectFile[]; error?: string }) => {
        if (data.error) {
          setError(data.error);
        } else if (data.project) {
          setProject(data.project);
          setFiles(data.files ?? []);
          if (data.files && data.files.length > 0) {
            setActiveFile(data.files[0]);
          }
          // Build preview HTML from files
          const htmlFile = data.files?.find((f) => f.path.endsWith('.html') || f.path === 'index.html');
          if (htmlFile) {
            setPreviewHtml(htmlFile.content);
          }
        }
      })
      .catch(() => setError('Failed to load project'))
      .finally(() => setLoading(false));
  }, [id]);

  function handleFork() {
    if (!project) return;
    const prompt = project.client_idea ?? project.title;
    window.location.href = `/ai?prompt=${encodeURIComponent(prompt)}`;
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    }).catch(() => {});
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: COLORS.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", color: COLORS.textPrimary }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ width: '20px', height: '20px', border: '2px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
          Loading project…
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div style={{ minHeight: '100vh', background: COLORS.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", color: COLORS.textPrimary, padding: '2rem', textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔒</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Project not found</h1>
          <p style={{ color: COLORS.textSecondary, marginBottom: '1.5rem' }}>This project does not exist or is not publicly shared.</p>
          <a href="/ai" style={{ padding: '0.6rem 1.5rem', background: COLORS.accentGradient, color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.9375rem' }}>
            Build your own →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", color: COLORS.textPrimary, display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.4s ease' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', height: '52px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <a href="/ai" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <div style={{ width: '28px', height: '28px', background: COLORS.accentGradient, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px', color: '#fff' }}>Z</div>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: COLORS.textPrimary }}>ZIVO AI</span>
          </a>
          <div style={{ width: '1px', height: '20px', background: COLORS.border }} />
          <span style={{ fontSize: '0.875rem', color: COLORS.textSecondary }}>Public Project</span>
          <span style={{ fontSize: '0.875rem', color: COLORS.textPrimary, fontWeight: 600 }}>{project.title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={handleCopyLink}
            style={{ padding: '0.35rem 0.75rem', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: '6px', color: copyDone ? COLORS.success : COLORS.textSecondary, cursor: 'pointer', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.35rem', transition: 'all 0.15s' }}
          >
            {copyDone ? (
              <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Copied!</>
            ) : (
              <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Share</>
            )}
          </button>
          <button
            onClick={handleFork}
            style={{ padding: '0.35rem 0.75rem', background: COLORS.accentGradient, border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>
            Fork this project
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* File Tree */}
        <div style={{ width: '220px', flexShrink: 0, borderRight: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, overflowY: 'auto', padding: '0.75rem 0' }}>
          <div style={{ padding: '0 0.75rem', marginBottom: '0.5rem', fontSize: '0.7rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
            Files ({files.length})
          </div>
          {files.map((f) => (
            <button
              key={f.path}
              onClick={() => { setActiveFile(f); setViewMode('files'); }}
              style={{ width: '100%', padding: '0.35rem 0.75rem', background: activeFile?.path === f.path && viewMode === 'files' ? 'rgba(99,102,241,0.12)' : 'transparent', border: 'none', color: activeFile?.path === f.path && viewMode === 'files' ? COLORS.accent : COLORS.textSecondary, cursor: 'pointer', textAlign: 'left', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: "'Fira Code',monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {getFileIcon(f.path)}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{f.path}</span>
            </button>
          ))}
        </div>

        {/* Main Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0 1rem', height: '44px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, flexShrink: 0 }}>
            {(['preview', 'files'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                style={{ padding: '0.25rem 0.65rem', background: viewMode === v ? 'rgba(99,102,241,0.15)' : 'transparent', border: viewMode === v ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent', borderRadius: '6px', color: viewMode === v ? COLORS.accent : COLORS.textSecondary, cursor: 'pointer', fontSize: '0.8125rem', fontWeight: viewMode === v ? 600 : 400 }}
              >
                {v === 'preview' ? 'Preview' : activeFile ? activeFile.path : 'Code'}
              </button>
            ))}
            <div style={{ marginLeft: 'auto', padding: '0.2rem 0.5rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '4px', fontSize: '0.7rem', color: COLORS.success, fontWeight: 600 }}>
              🔓 Public
            </div>
          </div>

          {/* Content */}
          {viewMode === 'preview' ? (
            previewHtml ? (
              <iframe
                srcDoc={previewHtml}
                style={{ flex: 1, border: 'none', background: '#fff' }}
                sandbox="allow-scripts allow-same-origin"
                title="Project Preview"
              />
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.textMuted, flexDirection: 'column', gap: '0.5rem' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
                <span style={{ fontSize: '0.875rem' }}>No HTML preview available</span>
                <span style={{ fontSize: '0.75rem' }}>Select a file from the sidebar to view its code</span>
              </div>
            )
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
              {activeFile ? (
                <pre style={{ margin: 0, fontFamily: "'Fira Code','JetBrains Mono',monospace", fontSize: '0.8125rem', color: COLORS.textPrimary, lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {activeFile.content}
                </pre>
              ) : (
                <div style={{ color: COLORS.textMuted, fontSize: '0.875rem' }}>Select a file to view its contents</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '0.75rem 1.5rem', borderTop: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem', color: COLORS.textMuted, flexShrink: 0 }}>
        <span>
          Created {new Date(project.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })} · {files.length} files · Mode: {project.mode}
        </span>
        <button
          onClick={handleFork}
          style={{ padding: '0.4rem 1rem', background: COLORS.accentGradient, border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>
          Fork & Build Your Own
        </button>
      </div>
    </div>
  );
}
