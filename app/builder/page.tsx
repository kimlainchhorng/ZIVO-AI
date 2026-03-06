'use client';

import Link from 'next/link';
import { Globe, Smartphone, Layers, FolderOpen } from 'lucide-react';

/**
 * Builder Home — standalone landing page (no sidebar layout).
 * Provides entry CTAs to the main builder modes:
 *  - Website Builder  → /ai?mode=website
 *  - Mobile App Builder → /ai?mode=mobile
 *  - UI Visual Builder  → /ui-builder
 */
export default function BuilderHomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#080810',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Logo / Wordmark */}
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.04em',
            margin: 0,
          }}
        >
          ZIVO<span style={{ color: '#6366f1' }}>-AI</span>
        </h1>
        <p
          style={{
            marginTop: '0.5rem',
            color: '#94a3b8',
            fontSize: '1rem',
          }}
        >
          What would you like to build today?
        </p>
      </div>

      {/* CTA Cards */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          width: '100%',
          maxWidth: '460px',
        }}
      >
        {/* Primary CTA — Website Builder */}
        <Link
          href="/ai?mode=website"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.25rem 1.5rem',
            borderRadius: '12px',
            textDecoration: 'none',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 4px 24px rgba(99,102,241,0.35)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)';
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 8px 32px rgba(99,102,241,0.45)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 24px rgba(99,102,241,0.35)';
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Globe size={22} color="#fff" />
          </div>
          <div>
            <div
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              Website Builder
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  borderRadius: 4,
                  padding: '2px 7px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Recommended
              </span>
            </div>
            <div style={{ fontSize: '0.825rem', color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
              Generate a full website with AI in seconds
            </div>
          </div>
        </Link>

        {/* Secondary CTA — Mobile App Builder */}
        <Link
          href="/ai?mode=mobile"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.25rem 1.5rem',
            borderRadius: '12px',
            textDecoration: 'none',
            backgroundColor: '#0f1020',
            border: '1px solid rgba(99,102,241,0.2)',
            transition: 'border-color 0.15s ease, background-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(99,102,241,0.5)';
            (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#141528';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(99,102,241,0.2)';
            (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#0f1020';
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: 'rgba(99,102,241,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Smartphone size={22} color="#818cf8" />
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#f1f5f9' }}>
              Mobile App Builder
            </div>
            <div style={{ fontSize: '0.825rem', color: '#64748b', marginTop: 2 }}>
              Build React Native-style mobile apps with AI
            </div>
          </div>
        </Link>

        {/* Secondary CTA — UI Visual Builder */}
        <Link
          href="/ui-builder"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.25rem 1.5rem',
            borderRadius: '12px',
            textDecoration: 'none',
            backgroundColor: '#0f1020',
            border: '1px solid rgba(99,102,241,0.2)',
            transition: 'border-color 0.15s ease, background-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(99,102,241,0.5)';
            (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#141528';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(99,102,241,0.2)';
            (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#0f1020';
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: 'rgba(99,102,241,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Layers size={22} color="#818cf8" />
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#f1f5f9' }}>
              UI Visual Builder
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  backgroundColor: 'rgba(99,102,241,0.15)',
                  color: '#818cf8',
                  borderRadius: 4,
                  padding: '2px 7px',
                  marginLeft: '0.5rem',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Advanced
              </span>
            </div>
            <div style={{ fontSize: '0.825rem', color: '#64748b', marginTop: 2 }}>
              Drag-and-drop component canvas with live preview
            </div>
          </div>
        </Link>
      </div>

      {/* Open Projects link */}
      <div style={{ marginTop: '2rem' }}>
        <Link
          href="/projects"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#64748b',
            fontSize: '0.875rem',
            textDecoration: 'none',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = '#94a3b8';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = '#64748b';
          }}
        >
          <FolderOpen size={15} />
          Open Projects
        </Link>
      </div>
    </main>
  );
}
