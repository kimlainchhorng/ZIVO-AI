'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

interface Template {
  id: string;
  title: string;
  description: string;
  image: string;
  href: string;
}

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'saas-landing',
    title: 'SaaS Landing Page',
    description: 'Hero, features, pricing & CTA',
    image: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=600&h=360&fit=crop',
    href: '/ai?mode=code&prompt=Build+a+modern+SaaS+landing+page+with+hero,+features,+pricing,+and+CTA+sections',
  },
  {
    id: 'minimal-portfolio',
    title: 'Minimal Portfolio',
    description: 'Clean personal work showcase',
    image: 'https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg?auto=compress&cs=tinysrgb&w=600&h=360&fit=crop',
    href: '/ai?mode=code&prompt=Build+a+minimal+personal+portfolio+with+about,+projects,+and+contact+sections',
  },
  {
    id: 'ecommerce-store',
    title: 'E-commerce Store',
    description: 'Premium design for webstore',
    image: 'https://images.pexels.com/photos/5632402/pexels-photo-5632402.jpeg?auto=compress&cs=tinysrgb&w=600&h=360&fit=crop',
    href: '/ai?mode=code&prompt=Build+an+e-commerce+store+with+product+listings,+cart,+and+checkout+flow',
  },
  {
    id: 'event-platform',
    title: 'Event Platform',
    description: 'Find, register, create events',
    image: 'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg?auto=compress&cs=tinysrgb&w=600&h=360&fit=crop',
    href: '/ai?mode=code&prompt=Build+an+event+platform+where+users+can+browse,+register+for,+and+create+events',
  },
  {
    id: 'lifestyle-blog',
    title: 'Lifestyle Blog',
    description: 'Sophisticated blog design',
    image: 'https://images.pexels.com/photos/6335/man-coffee-cup-pen.jpg?auto=compress&cs=tinysrgb&w=600&h=360&fit=crop',
    href: '/ai?mode=code&prompt=Build+a+lifestyle+blog+with+article+listings,+categories,+and+reading+view',
  },
  {
    id: 'visual-landing',
    title: 'Visual Landing Page',
    description: 'Showcase your company',
    image: 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=600&h=360&fit=crop',
    href: '/ai?mode=code&prompt=Build+a+visually+striking+company+landing+page+with+bold+typography+and+imagery',
  },
  {
    id: 'photographer-portfolio',
    title: 'Photographer Portfolio',
    description: 'Interactive image showcase',
    image: 'https://images.pexels.com/photos/3379934/pexels-photo-3379934.jpeg?auto=compress&cs=tinysrgb&w=600&h=360&fit=crop',
    href: '/ai?mode=code&prompt=Build+a+photographer+portfolio+with+gallery,+lightbox,+and+contact+form',
  },
  {
    id: 'saas-dashboard',
    title: 'SaaS Dashboard',
    description: 'Analytics, sidebar, data tables',
    image: 'https://images.pexels.com/photos/5077047/pexels-photo-5077047.jpeg?auto=compress&cs=tinysrgb&w=600&h=360&fit=crop',
    href: '/ai?mode=code&prompt=Build+a+SaaS+analytics+dashboard+with+sidebar+navigation,+stats+cards,+and+data+tables',
  },
];

type TabKey = 'recently-viewed' | 'my-projects' | 'templates';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'recently-viewed', label: 'Recently viewed' },
  { key: 'my-projects', label: 'My projects' },
  { key: 'templates', label: 'Templates' },
];

interface TemplateGridProps {
  templates?: Template[];
}

export default function TemplateGrid({ templates = DEFAULT_TEMPLATES }: TemplateGridProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('templates');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const displayed = activeTab === 'templates' ? templates : [];

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.125rem' }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '0.375rem 0.875rem',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: activeTab === tab.key ? 600 : 400,
                background: activeTab === tab.key ? 'rgba(255,255,255,0.07)' : 'transparent',
                color: activeTab === tab.key ? '#e2e8f0' : '#475569',
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
            color: '#64748b',
            textDecoration: 'none',
            fontWeight: 500,
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = '#94a3b8';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = '#64748b';
          }}
        >
          Browse all
          <ArrowRight size={13} />
        </Link>
      </div>

      {displayed.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.875rem',
          }}
        >
          {displayed.map((tpl, i) => (
            <Link
              key={tpl.id}
              href={tpl.href}
              onMouseEnter={() => setHoveredId(tpl.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                textDecoration: 'none',
                borderRadius: 10,
                overflow: 'hidden',
                border: hoveredId === tpl.id
                  ? '1px solid rgba(255,255,255,0.14)'
                  : '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.03)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
                transform: hoveredId === tpl.id ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: hoveredId === tpl.id
                  ? '0 8px 24px rgba(0,0,0,0.35)'
                  : '0 2px 8px rgba(0,0,0,0.15)',
                animationDelay: `${i * 0.04}s`,
              }}
            >
              <div
                style={{
                  width: '100%',
                  aspectRatio: '16/9',
                  overflow: 'hidden',
                  background: '#0f1120',
                }}
              >
                <Image
                  src={tpl.image}
                  alt={tpl.title}
                  width={600}
                  height={338}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    transition: 'transform 0.3s ease',
                    transform: hoveredId === tpl.id ? 'scale(1.04)' : 'scale(1)',
                  }}
                />
              </div>

              <div style={{ padding: '0.625rem 0.75rem 0.75rem' }}>
                <div
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: '#e2e8f0',
                    marginBottom: '0.2rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {tpl.title}
                </div>
                <div
                  style={{
                    fontSize: '0.7125rem',
                    color: '#475569',
                    lineHeight: 1.4,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
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
            padding: '2.5rem',
            textAlign: 'center',
            color: '#334155',
            fontSize: '0.875rem',
            border: '1px dashed rgba(255,255,255,0.06)',
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
