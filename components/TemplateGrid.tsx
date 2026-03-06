'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Globe, Smartphone, ShoppingCart, Lock, LayoutDashboard, Monitor, ArrowRight } from 'lucide-react';

export interface Template {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  href: string;
}

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'landing-page',
    title: 'Landing Page',
    description: 'Modern hero + features + CTA layout',
    icon: <Globe size={20} />,
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    href: '/ai?mode=website&template=landing-page',
  },
  {
    id: 'saas-dashboard',
    title: 'SaaS Dashboard',
    description: 'Analytics, sidebar nav, data tables',
    icon: <LayoutDashboard size={20} />,
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
    href: '/ai?mode=website&template=saas-dashboard',
  },
  {
    id: 'ecommerce',
    title: 'E-commerce',
    description: 'Product grid, cart & checkout flow',
    icon: <ShoppingCart size={20} />,
    gradient: 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)',
    href: '/ai?mode=website&template=ecommerce',
  },
  {
    id: 'auth-flow',
    title: 'Auth Flow',
    description: 'Sign in, sign up & password reset',
    icon: <Lock size={20} />,
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    href: '/ai?mode=website&template=auth-flow',
  },
  {
    id: 'mobile-app',
    title: 'Mobile App',
    description: 'React Native-style mobile screens',
    icon: <Smartphone size={20} />,
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
    href: '/ai?mode=mobile',
  },
  {
    id: 'portfolio',
    title: 'Portfolio',
    description: 'Showcase work with project gallery',
    icon: <Monitor size={20} />,
    gradient: 'linear-gradient(135deg, #475569 0%, #6366f1 100%)',
    href: '/ai?mode=website&template=portfolio',
  },
];

type TabKey = 'recently-viewed' | 'my-projects' | 'templates';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'recently-viewed', label: 'Recently Viewed' },
  { key: 'my-projects', label: 'My Projects' },
  { key: 'templates', label: 'Templates' },
];

interface TemplateGridProps {
  templates?: Template[];
}

export default function TemplateGrid({ templates = DEFAULT_TEMPLATES }: TemplateGridProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('templates');

  const displayed = activeTab === 'templates' ? templates : [];

  return (
    <div style={{ width: '100%' }}>
      {/* Tab switcher + Browse all */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '0.25rem',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            padding: '3px',
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '0.35rem 0.875rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: activeTab === tab.key ? 600 : 400,
                background:
                  activeTab === tab.key
                    ? 'rgba(99,102,241,0.2)'
                    : 'transparent',
                color: activeTab === tab.key ? '#818cf8' : '#64748b',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Link
          href="/templates"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontSize: '0.8125rem',
            color: '#6366f1',
            textDecoration: 'none',
            fontWeight: 500,
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = '#818cf8';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = '#6366f1';
          }}
        >
          Browse all
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* Template cards horizontal scroll */}
      {displayed.length > 0 ? (
        <div
          style={{
            display: 'flex',
            gap: '0.875rem',
            overflowX: 'auto',
            paddingBottom: '0.75rem',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.1) transparent',
          }}
        >
          {displayed.map((tpl, i) => (
            <Link
              key={tpl.id}
              href={tpl.href}
              className="zivo-template-card"
              style={{
                textDecoration: 'none',
                animationDelay: `${i * 0.06}s`,
              }}
            >
              {/* Gradient header */}
              <div
                style={{
                  height: 80,
                  background: tpl.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  opacity: 0.9,
                }}
              >
                {tpl.icon}
              </div>

              {/* Card body */}
              <div style={{ padding: '0.75rem' }}>
                <div
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#f1f5f9',
                    marginBottom: '0.25rem',
                  }}
                >
                  {tpl.title}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: '#64748b',
                    lineHeight: 1.4,
                  }}
                >
                  {tpl.description}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            color: '#475569',
            fontSize: '0.875rem',
            border: '1px dashed rgba(255,255,255,0.08)',
            borderRadius: 12,
          }}
        >
          {activeTab === 'recently-viewed'
            ? 'No recently viewed projects yet.'
            : 'No projects yet. Start building!'}
        </div>
      )}
    </div>
  );
}
