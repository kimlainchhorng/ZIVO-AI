'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Globe, Smartphone, Code2, Layers, FolderOpen, Zap, Lock, Bell } from 'lucide-react';
import PromptCard from '@/components/PromptCard';
import TemplateGrid from '@/components/TemplateGrid';

type BuildMode = 'website' | 'mobile' | 'code' | 'ui';

interface ModeItem {
  key: BuildMode;
  label: string;
  icon: React.ReactNode;
  href: string;
  comingSoon?: boolean;
}

const MODES: ModeItem[] = [
  { key: 'website', label: 'Website', icon: <Globe size={14} />, href: '/ai?mode=website', comingSoon: true },
  { key: 'mobile', label: 'Mobile App', icon: <Smartphone size={14} />, href: '/ai?mode=mobile' },
  { key: 'code', label: 'Code Builder', icon: <Code2 size={14} />, href: '/ai?mode=code' },
  { key: 'ui', label: 'UI Builder', icon: <Layers size={14} />, href: '/ui-builder' },
];

export default function BuilderHomePage() {
  const router = useRouter();
  const [activeMode, setActiveMode] = useState<BuildMode>('mobile');
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySubmitted, setNotifySubmitted] = useState(false);

  const isWebsiteMode = activeMode === 'website';

  function handlePromptSubmit(value: string) {
    if (isWebsiteMode) return;
    const params = new URLSearchParams({ mode: activeMode, prompt: value });
    router.push(`/ai?${params.toString()}`);
  }

  function handleNotifySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!notifyEmail.trim()) return;
    setNotifySubmitted(true);
  }

  return (
    <main
      className="zivo-hero-bg"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        fontFamily: 'var(--font-inter)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '10%',
          left: '20%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(40px)',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: '15%',
          right: '15%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(50px)',
        }}
      />

      <div className="zivo-fade-in-up" style={{ marginBottom: '0.75rem', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.875rem',
            borderRadius: 9999,
            border: '1px solid rgba(14,165,233,0.25)',
            background: 'rgba(14,165,233,0.08)',
            marginBottom: '1.25rem',
          }}
        >
          <Zap size={13} color="#38bdf8" />
          <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600, letterSpacing: '0.05em' }}>
            AI-POWERED
          </span>
        </div>
      </div>

      <div
        className="zivo-fade-in-up"
        style={{ textAlign: 'center', marginBottom: '2.5rem', animationDelay: '0.05s' }}
      >
        <h1
          style={{
            fontSize: 'clamp(2rem, 5vw, 3.25rem)',
            fontWeight: 800,
            color: '#f1f5f9',
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          What will you{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #38bdf8, #10b981)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            build today?
          </span>
        </h1>
        <p
          style={{
            marginTop: '0.875rem',
            color: '#64748b',
            fontSize: '1.0625rem',
            maxWidth: 480,
            margin: '0.875rem auto 0',
          }}
        >
          Describe your idea and ZIVO AI will generate a full application in seconds.
        </p>
      </div>

      <div
        className="zivo-fade-in-up"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          justifyContent: 'center',
          marginBottom: '1.25rem',
          animationDelay: '0.08s',
        }}
      >
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => setActiveMode(m.key)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.4rem 0.875rem',
              borderRadius: 9999,
              border: m.comingSoon
                ? '1px solid rgba(255,255,255,0.06)'
                : activeMode === m.key
                  ? '1px solid rgba(14,165,233,0.4)'
                  : '1px solid rgba(255,255,255,0.1)',
              background: m.comingSoon
                ? 'rgba(255,255,255,0.02)'
                : activeMode === m.key
                  ? 'rgba(14,165,233,0.12)'
                  : 'rgba(255,255,255,0.04)',
              color: m.comingSoon ? '#334155' : activeMode === m.key ? '#38bdf8' : '#94a3b8',
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: m.comingSoon ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              opacity: m.comingSoon ? 0.5 : 1,
            }}
          >
            {m.icon}
            {m.label}
            {m.comingSoon && (
              <span
                style={{
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  color: '#475569',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 4,
                  padding: '0.1rem 0.3rem',
                  marginLeft: 2,
                }}
              >
                SOON
              </span>
            )}
          </button>
        ))}
      </div>

      <div
        className="zivo-fade-in-up"
        style={{ width: '100%', maxWidth: 640, marginBottom: '1.25rem', animationDelay: '0.1s' }}
      >
        {isWebsiteMode ? (
          <ComingSoonCard
            notifyEmail={notifyEmail}
            notifySubmitted={notifySubmitted}
            onEmailChange={setNotifyEmail}
            onNotifySubmit={handleNotifySubmit}
          />
        ) : (
          <PromptCard
            placeholder="Describe what you want to build…"
            onSubmit={handlePromptSubmit}
          />
        )}
      </div>

      {isWebsiteMode ? (
        <div
          className="zivo-fade-in-up"
          style={{
            width: '100%',
            maxWidth: 700,
            animationDelay: '0.15s',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem',
          }}
        >
          {[
            { label: 'Visual drag & drop editor', desc: 'Build pages without writing a single line of code' },
            { label: 'SEO-optimized output', desc: 'Every site ships with perfect meta tags and structured data' },
            { label: 'One-click deploy', desc: 'Publish to a custom domain instantly with CDN & SSL' },
          ].map((f) => (
            <div
              key={f.label}
              style={{
                padding: '1rem',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                {f.label}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#334155', lineHeight: 1.5 }}>
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="zivo-fade-in-up"
          style={{ width: '100%', maxWidth: 900, animationDelay: '0.2s' }}
        >
          <TemplateGrid />
        </div>
      )}

      <div style={{ marginTop: '2rem' }}>
        <Link
          href="/projects"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#475569',
            fontSize: '0.875rem',
            textDecoration: 'none',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = '#94a3b8';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = '#475569';
          }}
        >
          <FolderOpen size={15} />
          Open Projects
        </Link>
      </div>
    </main>
  );
}

function ComingSoonCard({
  notifyEmail,
  notifySubmitted,
  onEmailChange,
  onNotifySubmit,
}: {
  notifyEmail: string;
  notifySubmitted: boolean;
  onEmailChange: (v: string) => void;
  onNotifySubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(12px)',
        padding: '2rem 1.75rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: '15%',
          right: '15%',
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
        }}
      />

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          marginBottom: '1rem',
        }}
      >
        <Lock size={20} color="#475569" />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <span
          style={{
            display: 'inline-block',
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: '#475569',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 9999,
            padding: '0.25rem 0.75rem',
          }}
        >
          COMING SOON
        </span>
      </div>

      <h2
        style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          color: '#94a3b8',
          margin: '0 0 0.5rem',
          letterSpacing: '-0.02em',
        }}
      >
        Website Builder is in development
      </h2>
      <p
        style={{
          fontSize: '0.875rem',
          color: '#334155',
          maxWidth: 380,
          margin: '0 auto 1.5rem',
          lineHeight: 1.6,
        }}
      >
        We are working hard to bring you a powerful AI website builder. Be the first to know when it launches.
      </p>

      {notifySubmitted ? (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.25rem',
            borderRadius: 9999,
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.2)',
            color: '#10b981',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          <Bell size={14} />
          You are on the list — we will notify you!
        </div>
      ) : (
        <form
          onSubmit={onNotifySubmit}
          style={{ display: 'flex', gap: '0.5rem', maxWidth: 380, margin: '0 auto' }}
        >
          <input
            type="email"
            value={notifyEmail}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="your@email.com"
            required
            style={{
              flex: 1,
              padding: '0.625rem 0.875rem',
              borderRadius: 9999,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
              color: '#f1f5f9',
              fontSize: '0.875rem',
              outline: 'none',
              fontFamily: 'var(--font-inter)',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '0.625rem 1.125rem',
              borderRadius: 9999,
              border: 'none',
              background: 'linear-gradient(135deg, #0ea5e9, #10b981)',
              color: '#fff',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Notify me
          </button>
        </form>
      )}
    </div>
  );
}
