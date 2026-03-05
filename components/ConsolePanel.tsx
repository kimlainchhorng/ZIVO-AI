'use client';

import { useEffect, useRef, useState } from 'react';
import type { LogEntry, LogLevel } from '@/lib/logger';

interface ConsolePanelProps {
  logs: LogEntry[];
  onClear: () => void;
}

const COLORS = {
  bg: '#0a0b14',
  bgPanel: '#0f1120',
  bgCard: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  accent: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
};

type FilterLevel = LogLevel | 'all';

const LEVEL_COLORS: Record<LogLevel, string> = {
  info: COLORS.textPrimary,
  warn: COLORS.warning,
  error: COLORS.error,
  debug: COLORS.textMuted,
};

const FILTER_BUTTONS: { label: string; value: FilterLevel }[] = [
  { label: 'All', value: 'all' },
  { label: 'Info', value: 'info' },
  { label: 'Warn', value: 'warn' },
  { label: 'Error', value: 'error' },
  { label: 'Debug', value: 'debug' },
];

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return iso;
  }
}

export default function ConsolePanel({ logs, onClear }: ConsolePanelProps) {
  const [filter, setFilter] = useState<FilterLevel>('all');
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = filter === 'all' ? logs : logs.filter((l) => l.level === filter);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [filtered.length]);

  function handleCopyAll() {
    const text = filtered
      .map((l) => `[${formatTimestamp(l.timestamp)}] ${l.level.toUpperCase().padEnd(5)} ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div
      style={{
        background: COLORS.bg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 320,
        fontFamily: 'monospace',
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 12px',
          borderBottom: `1px solid ${COLORS.border}`,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ color: COLORS.textSecondary, fontSize: 12, marginRight: 4, fontWeight: 600 }}>CONSOLE</span>

        <div style={{ display: 'flex', gap: 4, flex: 1, flexWrap: 'wrap' }}>
          {FILTER_BUTTONS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              style={{
                padding: '2px 10px',
                borderRadius: 6,
                border: `1px solid ${filter === value ? COLORS.accent : COLORS.border}`,
                background: filter === value ? `${COLORS.accent}22` : 'transparent',
                color: filter === value ? COLORS.accent : COLORS.textMuted,
                fontSize: 11,
                cursor: 'pointer',
                fontFamily: 'monospace',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={handleCopyAll}
          style={{
            padding: '2px 10px',
            borderRadius: 6,
            border: `1px solid ${COLORS.border}`,
            background: 'transparent',
            color: copied ? COLORS.success : COLORS.textSecondary,
            fontSize: 11,
            cursor: 'pointer',
            fontFamily: 'monospace',
          }}
        >
          {copied ? '✓ Copied' : 'Copy All'}
        </button>

        <button
          onClick={onClear}
          style={{
            padding: '2px 10px',
            borderRadius: 6,
            border: `1px solid ${COLORS.border}`,
            background: 'transparent',
            color: COLORS.textMuted,
            fontSize: 11,
            cursor: 'pointer',
            fontFamily: 'monospace',
          }}
        >
          Clear
        </button>
      </div>

      {/* Log entries */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {filtered.length === 0 ? (
          <span style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 8 }}>No log entries.</span>
        ) : (
          filtered.map((entry) => (
            <div key={entry.id} style={{ display: 'flex', gap: 8, fontSize: 12, lineHeight: '18px' }}>
              <span style={{ color: COLORS.textMuted, flexShrink: 0 }}>[{formatTimestamp(entry.timestamp)}]</span>
              <span
                style={{
                  color: LEVEL_COLORS[entry.level],
                  fontWeight: entry.level === 'error' || entry.level === 'warn' ? 700 : 400,
                  flexShrink: 0,
                  width: 42,
                }}
              >
                {entry.level.toUpperCase()}
              </span>
              <span style={{ color: LEVEL_COLORS[entry.level], wordBreak: 'break-all' }}>{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
