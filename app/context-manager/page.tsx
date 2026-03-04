'use client';

import NavBar from '../components/NavBar';
import { useState } from 'react';

const COLORS = {
  bg: "#0a0b14",
  bgPanel: "#0f1120",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
};

const fadeInCSS = '@keyframes fadeIn { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }';

type DocStatus = 'indexed' | 'pending' | 'processing';
interface Doc {
  id: number;
  name: string;
  size: string;
  type: string;
  status: DocStatus;
  tokens: number;
}

const INITIAL_DOCS: Doc[] = [
  { id: 1, name: 'README.md', size: '12 KB', type: 'Markdown', status: 'indexed', tokens: 3200 },
  { id: 2, name: 'API Reference', size: '45 KB', type: 'Markdown', status: 'indexed', tokens: 12400 },
  { id: 3, name: 'Design System', size: '8 KB', type: 'PDF', status: 'pending', tokens: 0 },
  { id: 4, name: 'User Guide', size: '28 KB', type: 'PDF', status: 'indexed', tokens: 9200 },
];

interface PipelineStep {
  id: number;
  icon: string;
  name: string;
  description: string;
  status: 'ready' | 'running' | 'done' | 'error';
}

const PIPELINE_STEPS: PipelineStep[] = [
  { id: 1, icon: '📄', name: 'Source', description: 'Fetch documents from configured sources', status: 'done' },
  { id: 2, icon: '✂️', name: 'Chunker', description: 'Split documents into overlapping text chunks', status: 'done' },
  { id: 3, icon: '🔢', name: 'Embedder', description: 'Generate vector embeddings with text-embedding-3', status: 'done' },
  { id: 4, icon: '🗄️', name: 'Vector Store', description: 'Upsert vectors into Pinecone index', status: 'done' },
  { id: 5, icon: '🔍', name: 'Query Interface', description: 'Expose semantic search endpoint', status: 'ready' },
];

interface MemoryEntry {
  id: number;
  excerpt: string;
  similarity: number;
  source: string;
}

const MEMORY_ENTRIES: MemoryEntry[] = [
  { id: 1, excerpt: 'The API supports OAuth 2.0 and API key authentication methods...', similarity: 0.92, source: 'API Reference' },
  { id: 2, excerpt: 'Components follow atomic design principles: atoms, molecules, organisms...', similarity: 0.87, source: 'Design System' },
  { id: 3, excerpt: 'To install, run npm install @zivo/core and configure your environment...', similarity: 0.83, source: 'README.md' },
  { id: 4, excerpt: 'User onboarding consists of 5 steps: signup, verification, workspace creation...', similarity: 0.79, source: 'User Guide' },
  { id: 5, excerpt: 'Rate limits are enforced per API key: 1000 requests per minute...', similarity: 0.74, source: 'API Reference' },
];

const TOTAL_TOKENS = 128000;
const USED_TOKENS = 24800;

export default function ContextManager() {
  const [activeTab, setActiveTab] = useState<'Documents' | 'RAG Pipeline' | 'Memory Store'>('Documents');
  const [docs, setDocs] = useState<Doc[]>(INITIAL_DOCS);
  const [pipeline, setPipeline] = useState<PipelineStep[]>(PIPELINE_STEPS);
  const [memories, setMemories] = useState<MemoryEntry[]>(MEMORY_ENTRIES);
  const [memSearch, setMemSearch] = useState('');
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const deleteDoc = (id: number) => setDocs(prev => prev.filter(d => d.id !== id));
  const deleteMemory = (id: number) => setMemories(prev => prev.filter(m => m.id !== id));

  const handleRunPipeline = () => {
    setRunning(true);
    setPipeline(prev => prev.map((s, i) => i < 4 ? { ...s, status: 'running' } : s));
    setTimeout(() => {
      setPipeline(prev => prev.map(s => ({ ...s, status: 'done' })));
      setRunning(false);
      showToast('✓ Pipeline completed successfully');
    }, 2000);
  };

  const handleUpload = () => {
    const newDoc: Doc = {
      id: Date.now(), name: `document_${Date.now()}.pdf`,
      size: '5 KB', type: 'PDF', status: 'pending', tokens: 0,
    };
    setDocs(prev => [...prev, newDoc]);
    showToast('File uploaded — queued for indexing');
  };

  const filteredMemories = memories.filter(m =>
    m.excerpt.toLowerCase().includes(memSearch.toLowerCase()) ||
    m.source.toLowerCase().includes(memSearch.toLowerCase())
  );

  const statusColor = (s: DocStatus) => s === 'indexed' ? COLORS.success : s === 'pending' ? COLORS.warning : COLORS.accent;
  const pipelineStatusIcon = (s: PipelineStep['status']) =>
    s === 'done' ? <span style={{ color: COLORS.success }}>✓</span> :
    s === 'running' ? <span style={{ color: COLORS.warning }}>⟳</span> :
    s === 'error' ? <span style={{ color: COLORS.error }}>✗</span> :
    <span style={{ color: COLORS.textMuted }}>○</span>;

  const usedPct = Math.round((USED_TOKENS / TOTAL_TOKENS) * 100);

  const tabs = ['Documents', 'RAG Pipeline', 'Memory Store'] as const;

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', color: COLORS.textPrimary }}>
      <style>{fadeInCSS}</style>
      <NavBar />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px', animation: 'fadeIn 0.4s ease' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>Context Manager</h1>
        <p style={{ color: COLORS.textSecondary, margin: '0 0 28px' }}>Manage documents, RAG pipelines, and memory</p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: `1px solid ${COLORS.border}` }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 22px', background: 'none',
                border: 'none', borderBottom: activeTab === tab ? `2px solid ${COLORS.accent}` : '2px solid transparent',
                color: activeTab === tab ? COLORS.textPrimary : COLORS.textSecondary,
                fontSize: 14, fontWeight: activeTab === tab ? 600 : 400, cursor: 'pointer',
                marginBottom: -1, transition: 'all 0.2s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* DOCUMENTS TAB */}
        {activeTab === 'Documents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Upload area */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload(); }}
              onClick={handleUpload}
              style={{
                border: `2px dashed ${dragOver ? COLORS.accent : COLORS.border}`,
                borderRadius: 12, padding: 36, textAlign: 'center',
                cursor: 'pointer', transition: 'all 0.2s',
                background: dragOver ? COLORS.accent + '08' : 'transparent',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 10 }}>📁</div>
              <p style={{ margin: 0, color: COLORS.textSecondary, fontSize: 14 }}>
                Drop files or click to upload
              </p>
              <p style={{ margin: '4px 0 0', color: COLORS.textMuted, fontSize: 12 }}>
                Supports PDF, Markdown, TXT, DOCX
              </p>
            </div>

            {/* Token Budget */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Context Window Budget</span>
                <span style={{ fontSize: 13, color: COLORS.textMuted }}>
                  {USED_TOKENS.toLocaleString()} / {TOTAL_TOKENS.toLocaleString()} tokens ({usedPct}%)
                </span>
              </div>
              <div style={{ height: 8, background: COLORS.border, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${usedPct}%`,
                  background: COLORS.accentGradient, borderRadius: 4, transition: 'width 0.5s',
                }} />
              </div>
            </div>

            {/* Doc List */}
            <div style={card}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600 }}>Documents ({docs.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {docs.map(doc => (
                  <div key={doc.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 14px', background: 'rgba(0,0,0,0.2)', borderRadius: 8,
                    border: `1px solid ${COLORS.border}`,
                  }}>
                    <span style={{ fontSize: 20 }}>{doc.type === 'PDF' ? '📕' : '📝'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{doc.name}</div>
                      <div style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 2 }}>
                        {doc.size} · {doc.tokens > 0 ? doc.tokens.toLocaleString() + ' tokens' : 'not indexed'}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                      background: COLORS.accent + '22', color: COLORS.accent,
                    }}>{doc.type}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                      background: statusColor(doc.status) + '22', color: statusColor(doc.status),
                    }}>{doc.status}</span>
                    <button onClick={() => deleteDoc(doc.id)} style={btnDanger}>Delete</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RAG PIPELINE TAB */}
        {activeTab === 'RAG Pipeline' && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              {pipeline.map((step, i) => (
                <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    ...card, padding: '16px 18px', textAlign: 'center', minWidth: 140,
                    border: `1px solid ${step.status === 'done' ? COLORS.success + '44' : COLORS.border}`,
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{step.icon}</div>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{step.name}</div>
                    <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 10, lineHeight: 1.4 }}>{step.description}</div>
                    <div style={{ fontSize: 16 }}>{pipelineStatusIcon(step.status)}</div>
                  </div>
                  {i < pipeline.length - 1 && (
                    <span style={{ color: COLORS.textMuted, fontSize: 18 }}>→</span>
                  )}
                </div>
              ))}
            </div>
            <button onClick={handleRunPipeline} disabled={running} style={{ ...btnAccent, opacity: running ? 0.7 : 1 }}>
              {running ? '⟳ Running...' : '▶ Run Pipeline'}
            </button>
          </div>
        )}

        {/* MEMORY STORE TAB */}
        {activeTab === 'Memory Store' && (
          <div>
            <input
              value={memSearch}
              onChange={e => setMemSearch(e.target.value)}
              placeholder="Search embeddings..."
              style={{
                width: '100%', padding: '10px 16px', background: COLORS.bgCard,
                border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textPrimary,
                fontSize: 14, marginBottom: 18, boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredMemories.map(m => (
                <div key={m.id} style={{
                  ...card, display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 6px', fontSize: 13, color: COLORS.textPrimary, lineHeight: 1.5 }}>{m.excerpt}</p>
                    <span style={{ fontSize: 12, color: COLORS.textMuted }}>Source: {m.source}</span>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 70 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.accent }}>{m.similarity}</div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted }}>similarity</div>
                  </div>
                  <button onClick={() => deleteMemory(m.id)} style={btnDanger}>Delete</button>
                </div>
              ))}
              {filteredMemories.length === 0 && (
                <p style={{ color: COLORS.textMuted, textAlign: 'center', padding: 32 }}>No embeddings found.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, background: COLORS.accent, color: '#fff',
          padding: '12px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500, zIndex: 200,
          animation: 'fadeIn 0.3s ease',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}

const card: React.CSSProperties = {
  background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20,
};
const btnAccent: React.CSSProperties = {
  background: COLORS.accent, color: '#fff', border: 'none', borderRadius: 7,
  padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
};
const btnDanger: React.CSSProperties = {
  background: COLORS.error + '15', color: COLORS.error, border: `1px solid ${COLORS.error}33`,
  borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer',
};
