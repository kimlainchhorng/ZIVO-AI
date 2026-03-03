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

interface Template {
  name: string;
  description: string;
  icon: string;
  category: string;
  prompt: string;
}

const TEMPLATES: Template[] = [
  { name: "Landing Page", description: "Modern SaaS landing page with hero, features, pricing, and CTA", icon: "🚀", category: "Marketing", prompt: "Build a modern SaaS landing page with a hero section, features grid, pricing table with 3 tiers, testimonials, and a call-to-action section. Use a dark theme with purple/blue gradients." },
  { name: "SaaS Dashboard", description: "Analytics dashboard with charts, stats, and data tables", icon: "📊", category: "Dashboard", prompt: "Build a SaaS analytics dashboard with a sidebar navigation, stats cards showing key metrics, line charts for revenue and user growth, a recent activity feed, and a data table with pagination." },
  { name: "E-commerce Store", description: "Product listings, cart, and checkout flow", icon: "🛍️", category: "E-commerce", prompt: "Build an e-commerce store with a product grid, filter sidebar, product detail modal, shopping cart drawer, and a checkout form with order summary." },
  { name: "Blog", description: "Clean blog with posts, categories, and search", icon: "✍️", category: "Content", prompt: "Build a clean blog website with a header, featured post hero, post cards grid with category tags, a sidebar with categories and recent posts, and a search bar." },
  { name: "Portfolio", description: "Developer/designer portfolio with projects and contact", icon: "💼", category: "Personal", prompt: "Build a professional portfolio website for a developer with an animated hero section, skills grid, projects showcase with tech stack tags, work experience timeline, and a contact form." },
  { name: "Todo App", description: "Feature-rich todo app with categories and persistence", icon: "✅", category: "Productivity", prompt: "Build a todo app with categories, priority levels, due dates, drag-to-reorder, dark mode toggle, and local storage persistence. Include filter tabs for all/active/completed." },
  { name: "Chat App", description: "Real-time chat UI with message bubbles and rooms", icon: "💬", category: "Social", prompt: "Build a chat application UI with a sidebar showing chat rooms and online users, message bubbles with timestamps and read receipts, an emoji picker, file attachment button, and typing indicators." },
  { name: "Admin Panel", description: "Full-featured admin dashboard with user management", icon: "⚙️", category: "Dashboard", prompt: "Build an admin panel with a collapsible sidebar, user management table with CRUD actions, role badges, pagination, search and filter controls, and a settings page with toggle switches." },
  { name: "Auth System", description: "Login, signup, and password reset flows", icon: "🔐", category: "Auth", prompt: "Build a complete authentication system with a login page, signup page with validation, forgot password flow, email verification notice page, and a profile settings page." },
  { name: "API Docs", description: "Beautiful API documentation site", icon: "📖", category: "Developer", prompt: "Build an API documentation website with a sticky sidebar navigation, endpoint cards with method badges (GET/POST/PUT/DELETE), request/response code examples with syntax highlighting, and a search bar." },
  { name: "Newsletter", description: "Newsletter signup with templates and preview", icon: "📧", category: "Marketing", prompt: "Build a newsletter platform with a subscription form with email validation, a template gallery with preview cards, subscriber stats, and an email preview pane that shows rendered content." },
  { name: "Booking System", description: "Appointment booking with calendar and confirmation", icon: "📅", category: "Business", prompt: "Build a booking system with a service selection step, date picker calendar showing available slots, time slot selector, booking form with customer details, and a confirmation page with booking summary." },
];

const CATEGORIES = ["All", ...Array.from(new Set(TEMPLATES.map((t) => t.category)))];

export default function TemplatesPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("All");
  const [hovered, setHovered] = useState<string | null>(null);

  const filtered = activeCategory === "All" ? TEMPLATES : TEMPLATES.filter((t) => t.category === activeCategory);

  function applyTemplate(template: Template) {
    router.push(`/ai?prompt=${encodeURIComponent(template.prompt)}`);
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: COLORS.bg, color: COLORS.textPrimary, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
        <NavBar />
        <div style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <div style={{ marginBottom: '2rem', animation: 'fadeIn 0.4s ease' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>Project Templates</h1>
            <p style={{ fontSize: '0.9375rem', color: COLORS.textSecondary, margin: 0 }}>Start with a pre-built template and customize it for your needs</p>
          </div>

          {/* Category Filter */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '0.35rem 0.9rem',
                  borderRadius: '20px',
                  border: activeCategory === cat ? '1px solid rgba(99,102,241,0.5)' : `1px solid ${COLORS.border}`,
                  background: activeCategory === cat ? 'rgba(99,102,241,0.15)' : COLORS.bgCard,
                  color: activeCategory === cat ? COLORS.accent : COLORS.textSecondary,
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  transition: 'all 0.15s',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Templates Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', animation: 'fadeIn 0.4s ease' }}>
            {filtered.map((template) => (
              <div
                key={template.name}
                onMouseEnter={() => setHovered(template.name)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background: COLORS.bgCard,
                  border: `1px solid ${hovered === template.name ? COLORS.borderHover : COLORS.border}`,
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  transition: 'border-color 0.2s, transform 0.15s, box-shadow 0.2s',
                  transform: hovered === template.name ? 'translateY(-2px)' : 'none',
                  boxShadow: hovered === template.name ? '0 8px 24px rgba(0,0,0,0.3)' : 'none',
                  cursor: 'pointer',
                }}
                onClick={() => applyTemplate(template)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '2rem' }}>{template.icon}</span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: 'rgba(99,102,241,0.12)',
                    color: COLORS.accent,
                    border: '1px solid rgba(99,102,241,0.25)',
                  }}>{template.category}</span>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 0.25rem', fontSize: '0.9375rem', fontWeight: 600, color: COLORS.textPrimary }}>{template.name}</h3>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: COLORS.textSecondary, lineHeight: 1.5 }}>{template.description}</p>
                </div>
                <button
                  style={{
                    marginTop: 'auto',
                    padding: '0.45rem 0.75rem',
                    background: hovered === template.name ? COLORS.accentGradient : 'transparent',
                    border: `1px solid ${hovered === template.name ? 'transparent' : COLORS.border}`,
                    borderRadius: '8px',
                    color: hovered === template.name ? '#fff' : COLORS.textSecondary,
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                  }}
                  onClick={(e) => { e.stopPropagation(); applyTemplate(template); }}
                >
                  Use Template →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
