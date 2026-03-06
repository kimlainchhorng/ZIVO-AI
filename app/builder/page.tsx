'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Globe, Smartphone, Code2, Layers, FolderOpen, Zap } from 'lucide-react';
import PromptCard from '@/components/PromptCard';
import TemplateGrid from '@/components/TemplateGrid';

type BuildMode = 'website' | 'mobile' | 'code' | 'ui';

const MODES: { key: BuildMode; label: string; icon: React.ReactNode; href: string }[] = [
  { key: 'website', label: 'Website', icon: <Globe size={14} />, href: '/ai?mode=website' },
  { key: 'mobile', label: 'Mobile App', icon: <Smartphone size={14} />, href: '/ai?mode=mobile' },
  { key: 'code', label: 'Code Builder', icon: <Code2 size={14} />, href: '/ai?mode=code' },
  { key: 'ui', label: 'UI Builder', icon: <Layers size={14} />, href: '/ui-builder' },
];

/**
 * Builder Home — Lovable-inspired animated dashboard with prompt card,
 * mode pills, and template grid.
 */
export default function BuilderHomePage() {
  const router = useRouter();
  const [activeMode, setActiveMode] = useState<BuildMode>('website');

  function handlePromptSubmit(value: string) {
    const mode = activeMode;
    const params = new URLSearchParams({ mode, prompt: value });
    router.push(`/ai?${params.toString()}`);
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
      {/* Ambient glow orbs */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '10%',
          left: '20%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
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
          background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(50px)',
        }}
      />

      {/* Logo wordmark */}
      <div
        className="zivo-fade-in-up"
        style={{ marginBottom: '0.75rem', textAlign: 'center' }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.875rem',
            borderRadius: 9999,
            border: '1px solid rgba(99,102,241,0.25)',
            background: 'rgba(99,102,241,0.08)',
            marginBottom: '1.25rem',
          }}
        >
          <Zap size={13} color="#818cf8" />
          <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 600, letterSpacing: '0.05em' }}>
            AI-POWERED
          </span>
        </div>
      </div>

      {/* Hero heading */}
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
          <span className="zivo-gradient-text">build today?</span>
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

      {/* Prompt card */}
      <div
        className="zivo-fade-in-up"
        style={{ width: '100%', maxWidth: 640, marginBottom: '1.25rem', animationDelay: '0.1s' }}
      >
        <PromptCard
          placeholder="Describe what you want to build…"
          onSubmit={handlePromptSubmit}
        />
      </div>

      {/* Mode pills */}
      <div
        className="zivo-fade-in-up"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          justifyContent: 'center',
          marginBottom: '4rem',
          animationDelay: '0.15s',
        }}
      >
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => setActiveMode(m.key)}
            className={`zivo-mode-pill${activeMode === m.key ? ' active' : ''}`}
          >
            {m.icon}
            {m.label}
          </button>
        ))}
      </div>

      {/* Template / recent projects section */}
      <div
        className="zivo-fade-in-up"
        style={{
          width: '100%',
          maxWidth: 900,
          animationDelay: '0.2s',
        }}
      >
        <TemplateGrid />
      </div>

      {/* Open Projects link */}
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

