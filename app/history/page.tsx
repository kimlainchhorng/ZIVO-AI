'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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

export interface BuildHistoryEntry {
  id: string;
  timestamp: number;
  prompt: string;
  model: string;
  fileCount: number;
  duration: number; // ms
}

const HISTORY_KEY = "zivo_build_history";

export function loadHistory(): BuildHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveHistory(entries: BuildHistoryEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
}

export function addHistoryEntry(entry: Omit<BuildHistoryEntry, "id">): void {
  const entries = loadHistory();
  const newEntry: BuildHistoryEntry = { ...entry, id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}` };
  entries.unshift(newEntry);
  saveHistory(entries.slice(0, 100)); // keep last 100
}

export default function HistoryPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<BuildHistoryEntry[]>(() => loadHistory());
  const [selected, setSelected] = useState<BuildHistoryEntry | null>(null);

  function clearHistory() {
    if (confirm("Clear all build history?")) {
      saveHistory([]);
      setEntries([]);
      setSelected(null);
    }
  }

  function rebuild(entry: BuildHistoryEntry) {
    router.push(`/ai?prompt=${encodeURIComponent(entry.prompt)}`);
  }

  function formatTime(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function formatDuration(ms: number): string {
    return `${(ms / 1000).toFixed(1)}s`;
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        .zh-row:hover { background: rgba(255,255,255,0.06) !important; cursor: pointer; }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: COLORS.bg, color: COLORS.textPrimary, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
        <NavBar />
        <div style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', animation: 'fadeIn 0.4s ease' }}>
            <div>
              <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>Build History</h1>
              <p style={{ fontSize: '0.9375rem', color: COLORS.textSecondary, margin: 0 }}>{entries.length} build{entries.length !== 1 ? 's' : ''} recorded</p>
            </div>
            {entries.length > 0 && (
              <button
                onClick={clearHistory}
                style={{ padding: '0.5rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: COLORS.error, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
              >
                Clear History
              </button>
            )}
          </div>

          {entries.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', textAlign: 'center', color: COLORS.textMuted, animation: 'fadeIn 0.4s ease' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
              <p style={{ fontSize: '1rem', marginBottom: '0.5rem', color: COLORS.textSecondary }}>No builds yet</p>
              <p style={{ fontSize: '0.875rem' }}>Start building in the <a href="/ai" style={{ color: COLORS.accent, textDecoration: 'none' }}>AI Builder</a> to see your history here.</p>
            </div>
          ) : (
            <div style={{ animation: 'fadeIn 0.4s ease' }}>
              {/* Table */}
              <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 70px 80px 130px', gap: '0', padding: '0.6rem 1rem', borderBottom: `1px solid ${COLORS.border}`, fontSize: '0.75rem', fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <span>Prompt</span>
                  <span>Model</span>
                  <span>Files</span>
                  <span>Duration</span>
                  <span>Time</span>
                </div>
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="zh-row"
                    onClick={() => setSelected(entry)}
                    style={{ display: 'grid', gridTemplateColumns: '1fr 100px 70px 80px 130px', gap: '0', padding: '0.75rem 1rem', borderBottom: `1px solid ${COLORS.border}`, background: 'transparent', transition: 'background 0.15s', alignItems: 'center' }}
                  >
                    <span style={{ fontSize: '0.8125rem', color: COLORS.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '1rem' }}>{entry.prompt}</span>
                    <span style={{ fontSize: '0.75rem', color: COLORS.textSecondary, fontFamily: 'monospace' }}>{entry.model}</span>
                    <span style={{ fontSize: '0.75rem', color: COLORS.textSecondary }}>{entry.fileCount} file{entry.fileCount !== 1 ? 's' : ''}</span>
                    <span style={{ fontSize: '0.75rem', color: COLORS.success }}>{formatDuration(entry.duration)}</span>
                    <span style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>{formatTime(entry.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal */}
        {selected && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', animation: 'fadeIn 0.2s ease' }}
            onClick={() => setSelected(null)}
          >
            <div
              style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: '16px', padding: '1.5rem', maxWidth: '560px', width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>Build Details</h2>
                <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: '1.25rem' }}>×</button>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, color: COLORS.textSecondary }}>{selected.model}</span>
                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, color: COLORS.success }}>{selected.fileCount} files</span>
                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, color: COLORS.textSecondary }}>{formatDuration(selected.duration)}</span>
                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, color: COLORS.textMuted }}>{formatTime(selected.timestamp)}</span>
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Prompt</p>
                <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: '8px', padding: '0.75rem', fontSize: '0.875rem', color: COLORS.textPrimary, lineHeight: 1.6, maxHeight: '150px', overflow: 'auto' }}>{selected.prompt}</div>
              </div>
              <button
                onClick={() => rebuild(selected)}
                style={{ width: '100%', padding: '0.65rem', background: COLORS.accentGradient, border: 'none', borderRadius: '10px', color: '#fff', cursor: 'pointer', fontSize: '0.9375rem', fontWeight: 600 }}
              >
                Rebuild →
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
