'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Copy, ExternalLink, FolderKanban } from 'lucide-react';
import SidebarLayout from '@/components/layout/SidebarLayout';

interface Project {
  id: string;
  title: string;
  mode: string;
  visibility: string;
  template: string | null;
  created_at: string;
  updated_at: string;
}

const MODE_OPTIONS = ['code', 'website_v2', 'mobile_v2'];

function getStoredToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('zivo_supabase_token');
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMode, setNewMode] = useState('website_v2');
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const token = getStoredToken();

  async function fetchProjects() {
    if (!token) { setLoading(false); setError('Not authenticated'); return; }
    try {
      const res = await fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setProjects(data.projects ?? []);
      else setError(data.error ?? 'Failed to load projects');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchProjects(); }, []);

  async function handleCreate() {
    if (!token || !newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, mode: newMode }),
      });
      if (res.ok) {
        setShowNewDialog(false);
        setNewTitle('');
        await fetchProjects();
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!token) return;
    setDeletingId(id);
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDuplicate(id: string) {
    if (!token) return;
    try {
      const res = await fetch(`/api/projects/${id}/duplicate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) await fetchProjects();
    } catch {}
  }

  return (
    <SidebarLayout>
      <div style={{ padding: '2rem', minHeight: '100vh', background: '#0a0a0f', color: '#f1f5f9' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f1f5f9' }}>Projects</h1>
            <p style={{ color: '#64748b', marginTop: '0.25rem' }}>Manage your ZIVO-AI projects</p>
          </div>
          <button
            onClick={() => setShowNewDialog(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.625rem 1.25rem', borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
            }}
          >
            <Plus size={16} /> New Project
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ height: '160px', borderRadius: '12px', background: 'rgba(99,102,241,0.05)', animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#ef4444' }}>{error}</div>
        ) : projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: '6rem 2rem' }}
          >
            <FolderKanban size={64} style={{ color: '#334155', margin: '0 auto 1.5rem' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#64748b', marginBottom: '0.75rem' }}>
              No projects yet
            </h2>
            <p style={{ color: '#475569', marginBottom: '2rem' }}>
              Create your first project to get started with ZIVO-AI
            </p>
            <button
              onClick={() => setShowNewDialog(true)}
              style={{
                padding: '0.75rem 2rem', borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600,
              }}
            >
              Create your first project
            </button>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            <AnimatePresence>
              {projects.map((project, idx) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  style={{
                    borderRadius: '12px',
                    border: '1px solid rgba(99,102,241,0.15)',
                    background: 'rgba(15,15,26,0.8)',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <h3 style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '1rem' }}>{project.title}</h3>
                    <span style={{
                      padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem',
                      background: project.visibility === 'public' ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)',
                      color: project.visibility === 'public' ? '#10b981' : '#818cf8',
                    }}>
                      {project.visibility}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                      {project.mode}
                    </span>
                    {project.template && (
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
                        {project.template}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#475569' }}>
                    Updated {new Date(project.updated_at).toLocaleDateString()}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                    <a
                      href={`/projects/${project.id}`}
                      style={{
                        flex: 1, textAlign: 'center', padding: '0.5rem', borderRadius: '6px',
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        color: '#fff', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem',
                      }}
                    >
                      <ExternalLink size={14} /> Open
                    </a>
                    <button
                      onClick={() => handleDuplicate(project.id)}
                      title="Duplicate"
                      style={{
                        padding: '0.5rem', borderRadius: '6px',
                        background: 'rgba(99,102,241,0.1)', color: '#818cf8',
                        border: '1px solid rgba(99,102,241,0.2)', cursor: 'pointer',
                      }}
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      disabled={deletingId === project.id}
                      title="Delete"
                      style={{
                        padding: '0.5rem', borderRadius: '6px',
                        background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                        border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer',
                        opacity: deletingId === project.id ? 0.5 : 1,
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* New Project Dialog */}
        <AnimatePresence>
          {showNewDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
              }}
              onClick={(e) => { if (e.target === e.currentTarget) setShowNewDialog(false); }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                style={{
                  background: '#0f0f1a', border: '1px solid rgba(99,102,241,0.3)',
                  borderRadius: '16px', padding: '2rem', width: '440px', maxWidth: '90vw',
                }}
              >
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '1.5rem' }}>
                  New Project
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                      Project Title
                    </label>
                    <input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="My Awesome Project"
                      style={{
                        width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px',
                        background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)',
                        color: '#f1f5f9', fontSize: '0.9rem', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                      Mode
                    </label>
                    <select
                      value={newMode}
                      onChange={(e) => setNewMode(e.target.value)}
                      style={{
                        width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px',
                        background: '#0f0f1a', border: '1px solid rgba(99,102,241,0.2)',
                        color: '#f1f5f9', fontSize: '0.9rem',
                      }}
                    >
                      {MODE_OPTIONS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button
                    onClick={() => setShowNewDialog(false)}
                    style={{
                      flex: 1, padding: '0.625rem', borderRadius: '8px',
                      background: 'transparent', border: '1px solid rgba(99,102,241,0.2)',
                      color: '#94a3b8', cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={creating || !newTitle.trim()}
                    style={{
                      flex: 1, padding: '0.625rem', borderRadius: '8px',
                      background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                      color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600,
                      opacity: creating || !newTitle.trim() ? 0.6 : 1,
                    }}
                  >
                    {creating ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SidebarLayout>
  );
}
