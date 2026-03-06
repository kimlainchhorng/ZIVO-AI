'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Mic, Plus } from 'lucide-react';

export interface PromptCardProps {
  placeholder?: string;
  onSubmit?: (value: string) => void;
  className?: string;
  defaultModel?: string;
}

const MAX_CHARS = 2000;

export default function PromptCard({
  placeholder = 'Describe what you want to build…',
  onSubmit,
  className = '',
  defaultModel = 'GPT-4o',
}: PromptCardProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [value]);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit?.(trimmed);
    setValue('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }

  const charCount = value.length;
  const nearLimit = charCount > MAX_CHARS * 0.85;
  const overLimit = charCount > MAX_CHARS;

  return (
    <div className={`zivo-prompt-card ${className}`} style={{ padding: '1rem 1.25rem' }}>
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, MAX_CHARS))}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          resize: 'none',
          color: '#f1f5f9',
          fontSize: '0.9375rem',
          lineHeight: '1.6',
          fontFamily: 'var(--font-inter)',
          minHeight: '40px',
          maxHeight: '240px',
          overflowY: 'auto',
          caretColor: '#6366f1',
        }}
      />

      {/* Bottom toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '0.625rem',
        }}
      >
        {/* Left side: attach + model badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Attach button */}
          <button
            type="button"
            title="Attach file"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: '9999px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent',
              color: '#64748b',
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
              (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = '#64748b';
            }}
          >
            <Plus size={15} />
          </button>

          {/* Model badge */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.25rem 0.625rem',
              borderRadius: '9999px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
              color: '#94a3b8',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'default',
              userSelect: 'none',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#10b981',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            {defaultModel}
          </span>
        </div>

        {/* Right side: char counter + mic + send */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Character counter */}
          {charCount > 0 && (
            <span
              style={{
                fontSize: '0.7rem',
                color: overLimit ? '#ef4444' : nearLimit ? '#f59e0b' : '#475569',
                transition: 'color 0.15s',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {charCount}/{MAX_CHARS}
            </span>
          )}

          {/* Mic button */}
          <button
            type="button"
            title="Voice input"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: '9999px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent',
              color: '#64748b',
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
              (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = '#64748b';
            }}
          >
            <Mic size={15} />
          </button>

          {/* Send button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!value.trim() || overLimit}
            title="Send (Ctrl+Enter)"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 34,
              height: 34,
              borderRadius: '9999px',
              border: 'none',
              background:
                value.trim() && !overLimit
                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  : 'rgba(255,255,255,0.06)',
              color: value.trim() && !overLimit ? '#fff' : '#475569',
              cursor: value.trim() && !overLimit ? 'pointer' : 'default',
              transition: 'background 0.15s, transform 0.15s, box-shadow 0.15s',
              boxShadow:
                value.trim() && !overLimit
                  ? '0 2px 12px rgba(99,102,241,0.4)'
                  : 'none',
            }}
            onMouseEnter={(e) => {
              if (!value.trim() || overLimit) return;
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                '0 4px 18px rgba(99,102,241,0.55)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                value.trim() && !overLimit
                  ? '0 2px 12px rgba(99,102,241,0.4)'
                  : 'none';
            }}
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
