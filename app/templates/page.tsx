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

type Complexity = "Simple" | "Medium" | "Complex";

interface Template {
  name: string;
  description: string;
  icon: string;
  category: string;
  complexity: Complexity;
  prompt: string;
}

const COMPLEXITY_COLORS: Record<Complexity, { bg: string; color: string }> = {
  Simple:  { bg: "rgba(16,185,129,0.12)", color: "#10b981" },
  Medium:  { bg: "rgba(245,158,11,0.12)", color: "#f59e0b" },
  Complex: { bg: "rgba(239,68,68,0.12)",  color: "#ef4444" },
};

const TEMPLATES: Template[] = [
  { name: "Landing Page", description: "Modern SaaS landing page with hero, features, pricing, and CTA", icon: "🚀", category: "Marketing", complexity: "Simple", prompt: "Build a modern SaaS landing page with a hero section, features grid, pricing table with 3 tiers, testimonials, and a call-to-action section. Use a dark theme with purple/blue gradients." },
  { name: "SaaS Dashboard", description: "Analytics dashboard with charts, stats, and data tables", icon: "📊", category: "Dashboard", complexity: "Medium", prompt: "Build a SaaS analytics dashboard with a sidebar navigation, stats cards showing key metrics, line charts for revenue and user growth, a recent activity feed, and a data table with pagination." },
  { name: "E-commerce Store", description: "Product listings, cart, and checkout flow", icon: "🛍️", category: "E-commerce", complexity: "Complex", prompt: "Build an e-commerce store with a product grid, filter sidebar, product detail modal, shopping cart drawer, and a checkout form with order summary." },
  { name: "Blog", description: "Clean blog with posts, categories, and search", icon: "✍️", category: "Content", complexity: "Simple", prompt: "Build a clean blog website with a header, featured post hero, post cards grid with category tags, a sidebar with categories and recent posts, and a search bar." },
  { name: "Portfolio", description: "Developer/designer portfolio with projects and contact", icon: "💼", category: "Personal", complexity: "Simple", prompt: "Build a professional portfolio website for a developer with an animated hero section, skills grid, projects showcase with tech stack tags, work experience timeline, and a contact form." },
  { name: "Todo App", description: "Feature-rich todo app with categories and persistence", icon: "✅", category: "Productivity", complexity: "Simple", prompt: "Build a todo app with categories, priority levels, due dates, drag-to-reorder, dark mode toggle, and local storage persistence. Include filter tabs for all/active/completed." },
  { name: "Chat App", description: "Real-time chat UI with message bubbles and rooms", icon: "💬", category: "Social", complexity: "Medium", prompt: "Build a chat application UI with a sidebar showing chat rooms and online users, message bubbles with timestamps and read receipts, an emoji picker, file attachment button, and typing indicators." },
  { name: "Admin Panel", description: "Full-featured admin dashboard with user management", icon: "⚙️", category: "Dashboard", complexity: "Complex", prompt: "Build an admin panel with a collapsible sidebar, user management table with CRUD actions, role badges, pagination, search and filter controls, and a settings page with toggle switches." },
  { name: "Auth System", description: "Login, signup, and password reset flows", icon: "🔐", category: "Auth", complexity: "Medium", prompt: "Build a complete authentication system with a login page, signup page with validation, forgot password flow, email verification notice page, and a profile settings page." },
  { name: "API Docs", description: "Beautiful API documentation site", icon: "📖", category: "Developer", complexity: "Medium", prompt: "Build an API documentation website with a sticky sidebar navigation, endpoint cards with method badges (GET/POST/PUT/DELETE), request/response code examples with syntax highlighting, and a search bar." },
  { name: "Newsletter", description: "Newsletter signup with templates and preview", icon: "📧", category: "Marketing", complexity: "Simple", prompt: "Build a newsletter platform with a subscription form with email validation, a template gallery with preview cards, subscriber stats, and an email preview pane that shows rendered content." },
  { name: "Booking System", description: "Appointment booking with calendar and confirmation", icon: "📅", category: "Business", complexity: "Medium", prompt: "Build a booking system with a service selection step, date picker calendar showing available slots, time slot selector, booking form with customer details, and a confirmation page with booking summary." },
  { name: "SaaS App (Full)", description: "Complete SaaS with auth, billing, and dashboard", icon: "🏗️", category: "SaaS", complexity: "Complex", prompt: "Build a complete SaaS application with authentication (login/signup), a billing/subscription page with Stripe-style pricing, a main dashboard with usage metrics, user settings, and a team management page." },
  { name: "Social Feed", description: "Twitter-style social feed with posts and profile", icon: "🐦", category: "Social", complexity: "Complex", prompt: "Build a Twitter/X-style social media feed with a timeline, post cards with likes/comments/retweets, a compose tweet modal, user profile page with followers, and a trending sidebar." },
  { name: "Crypto Dashboard", description: "Real-time crypto prices and portfolio tracker", icon: "📈", category: "Finance", complexity: "Complex", prompt: "Build a cryptocurrency dashboard with a portfolio overview, price cards for top coins, a candlestick chart, transaction history table, wallet balance, and market cap rankings." },
  { name: "Kanban Board", description: "Drag-and-drop project management board", icon: "🎯", category: "Productivity", complexity: "Medium", prompt: "Build a Kanban board with drag-and-drop columns (Todo, In Progress, Review, Done), task cards with priority badges and assignee avatars, a task creation modal, and board settings." },
  { name: "Recipe App", description: "Recipe browser with favorites and meal planner", icon: "🍳", category: "Lifestyle", complexity: "Simple", prompt: "Build a recipe app with a recipe grid with filter by cuisine and diet, a recipe detail page with ingredients and steps, a favorites system using localStorage, and a weekly meal planner." },
  { name: "Job Board", description: "Job listings with filters and application flow", icon: "💼", category: "Business", complexity: "Medium", prompt: "Build a job board with job listing cards showing company, role, salary range, and tags, filter sidebar by type/location/salary, a job detail page, and an application modal with form." },
  { name: "Music Player", description: "Spotify-style music player UI", icon: "🎵", category: "Media", complexity: "Medium", prompt: "Build a Spotify-style music player with a sidebar showing playlists, a main content area with album grid, a now-playing bar at the bottom with progress scrubber, volume control, and play/skip buttons." },
  { name: "Weather App", description: "Weather app with forecasts and location search", icon: "🌤️", category: "Lifestyle", complexity: "Simple", prompt: "Build a weather app with a location search bar, current weather display with icon and temperature, a 7-day forecast, hourly chart, wind/humidity/pressure stats cards, and a dark/light theme toggle." },
];

const ALL_CATEGORIES = ["All", ...Array.from(new Set(TEMPLATES.map((t) => t.category))).sort()];
const COMPLEXITIES: Array<"All" | Complexity> = ["All", "Simple", "Medium", "Complex"];

export default function TemplatesPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeComplexity, setActiveComplexity] = useState<"All" | Complexity>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [hovered, setHovered] = useState<string | null>(null);

  const filtered = TEMPLATES.filter((t) => {
    const matchCat = activeCategory === "All" || t.category === activeCategory;
    const matchComplex = activeComplexity === "All" || t.complexity === activeComplexity;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
    return matchCat && matchComplex && matchSearch;
  });

  function applyTemplate(template: Template) {
    router.push(`/ai?prompt=${encodeURIComponent(template.prompt)}`);
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        .tpl-search:focus { outline: none; border-color: #6366f1 !important; }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: COLORS.bg, color: COLORS.textPrimary, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
        <NavBar />
        <div style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <div style={{ marginBottom: '1.5rem', animation: 'fadeIn 0.4s ease' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>Project Templates</h1>
            <p style={{ fontSize: '0.9375rem', color: COLORS.textSecondary, margin: 0 }}>
              Start with a pre-built template and customize it for your needs · <span style={{ color: COLORS.accent }}>{TEMPLATES.length} templates</span>
            </p>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: COLORS.textMuted }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              className="tpl-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates…"
              style={{ width: '100%', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: '10px', padding: '0.55rem 0.75rem 0.55rem 2.25rem', color: COLORS.textPrimary, fontSize: '0.875rem' }}
            />
          </div>

          {/* Filters Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'center' }}>
            {/* Category pills */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '0.3rem 0.75rem',
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
            {/* Divider */}
            <div style={{ width: '1px', height: '20px', background: COLORS.border, flexShrink: 0 }} />
            {/* Complexity pills */}
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {COMPLEXITIES.map((c) => {
                const isAll = c === "All";
                const colors = isAll ? null : COMPLEXITY_COLORS[c];
                const isActive = activeComplexity === c;
                return (
                  <button
                    key={c}
                    onClick={() => setActiveComplexity(c)}
                    style={{
                      padding: '0.3rem 0.75rem',
                      borderRadius: '20px',
                      border: isActive && !isAll ? `1px solid ${colors!.color}44` : isActive ? '1px solid rgba(99,102,241,0.5)' : `1px solid ${COLORS.border}`,
                      background: isActive && !isAll ? colors!.bg : isActive ? 'rgba(99,102,241,0.15)' : COLORS.bgCard,
                      color: isActive && !isAll ? colors!.color : isActive ? COLORS.accent : COLORS.textSecondary,
                      cursor: 'pointer',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      transition: 'all 0.15s',
                    }}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Result count */}
          {(searchQuery || activeCategory !== "All" || activeComplexity !== "All") && (
            <p style={{ fontSize: '0.8125rem', color: COLORS.textMuted, marginBottom: '1rem' }}>
              Showing {filtered.length} of {TEMPLATES.length} templates
            </p>
          )}

          {/* Templates Grid */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: COLORS.textMuted }}>
              <p style={{ fontSize: '0.9375rem' }}>No templates found for your search.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', animation: 'fadeIn 0.4s ease' }}>
              {filtered.map((template) => {
                const cx = COMPLEXITY_COLORS[template.complexity];
                return (
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
                      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '2px 6px', borderRadius: '10px', background: cx.bg, color: cx.color }}>{template.complexity}</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', background: 'rgba(99,102,241,0.12)', color: COLORS.accent, border: '1px solid rgba(99,102,241,0.25)' }}>{template.category}</span>
                      </div>
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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
