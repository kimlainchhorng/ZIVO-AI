'use client';

import { motion } from 'framer-motion';

const TEMPLATES = [
  {
    label: 'SaaS Landing Page',
    icon: '🚀',
    prompt: 'Build a modern SaaS landing page with hero section, features grid, pricing table, and customer testimonials. Use a premium dark theme with indigo accents.',
    tags: ['hero', 'features', 'pricing'],
  },
  {
    label: 'Ride-share App',
    icon: '🚗',
    prompt: 'Create a ride-share mobile app UI with a map-based hero, driver/rider cards, fare calculator section, and safety features. Clean startup style.',
    tags: ['hero', 'dashboard', 'features'],
  },
  {
    label: 'Restaurant App',
    icon: '🍽️',
    prompt: 'Design a restaurant app with a menu showcase, online ordering interface, reservation booking form, and chef/team section. Luxury warm tones.',
    tags: ['hero', 'menu', 'contact'],
  },
  {
    label: 'Delivery Dashboard',
    icon: '📦',
    prompt: 'Build an analytics dashboard for a delivery service with order stats cards, live tracking table, driver performance metrics, and revenue charts.',
    tags: ['dashboard', 'stats', 'table'],
  },
  {
    label: 'Luxury Brand',
    icon: '💎',
    prompt: 'Create a luxury fashion brand homepage with full-bleed imagery, editorial hero, collection grid, brand story section, and newsletter signup. Gold/black palette.',
    tags: ['hero', 'gallery', 'newsletter'],
  },
  {
    label: 'E-commerce Store',
    icon: '🛍️',
    prompt: 'Build a modern e-commerce storefront with product hero banner, featured products grid, category navigation, reviews section, and sticky cart.',
    tags: ['hero', 'products', 'reviews'],
  },
  {
    label: 'Portfolio Site',
    icon: '🎨',
    prompt: 'Design a creative portfolio for a developer/designer with an animated hero intro, project showcase grid, skills section, about me, and contact form.',
    tags: ['hero', 'portfolio', 'contact'],
  },
  {
    label: 'Admin Dashboard',
    icon: '📊',
    prompt: 'Create a feature-rich admin dashboard with sidebar navigation, KPI stats row, data tables, recent activity feed, and user management section.',
    tags: ['nav', 'stats', 'tables'],
  },
];

const COLORS = {
  bgCard: 'rgba(255,255,255,0.04)',
  bgCardHover: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.08)',
  borderSelected: '#6366f1',
  accent: '#6366f1',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
};

interface PromptTemplateCardsProps {
  onSelect: (prompt: string) => void;
  selectedTemplate?: string;
}

export default function PromptTemplateCards({ onSelect, selectedTemplate }: PromptTemplateCardsProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
      {TEMPLATES.map((tpl) => {
        const isSelected = selectedTemplate === tpl.prompt;
        return (
          <motion.button
            key={tpl.label}
            onClick={() => onSelect(tpl.prompt)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '0.3rem',
              padding: '0.75rem',
              background: isSelected ? 'rgba(99,102,241,0.1)' : COLORS.bgCard,
              border: `1px solid ${isSelected ? COLORS.borderSelected : COLORS.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'left',
              outline: 'none',
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{tpl.icon}</span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: isSelected ? COLORS.accent : COLORS.textPrimary,
                lineHeight: 1.3,
              }}
            >
              {tpl.label}
            </span>
            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.125rem' }}>
              {tpl.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: '0.5625rem',
                    padding: '0.1rem 0.375rem',
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: '4px',
                    color: COLORS.textMuted,
                    fontWeight: 500,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
