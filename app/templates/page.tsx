'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '../components/NavBar';

const COLORS = {
  bg: "#0a0b14",
  bgPanel: "#0f1120",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  borderHover: "rgba(99,102,241,0.5)",
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
  id: string;
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

const TEMPLATE_PREVIEWS: Record<string, { gradient: string; emoji: string }> = {
  "landing-page":     { gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", emoji: "🚀" },
  "saas-dashboard":   { gradient: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)", emoji: "📊" },
  "ecommerce-store":  { gradient: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)", emoji: "🛍️" },
  "blog":             { gradient: "linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)", emoji: "✍️" },
  "portfolio":        { gradient: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)", emoji: "🎨" },
  "todo-app":         { gradient: "linear-gradient(135deg, #10b981 0%, #6366f1 100%)", emoji: "✅" },
  "chat-app":         { gradient: "linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)", emoji: "💬" },
  "admin-panel":      { gradient: "linear-gradient(135deg, #374151 0%, #6366f1 100%)", emoji: "⚙️" },
  "auth-system":      { gradient: "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)", emoji: "🔐" },
  "api-docs":         { gradient: "linear-gradient(135deg, #0f172a 0%, #0ea5e9 100%)", emoji: "📖" },
  "newsletter":       { gradient: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)", emoji: "📧" },
  "booking-system":   { gradient: "linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)", emoji: "📅" },
  "saas-app-full":    { gradient: "linear-gradient(135deg, #6366f1 0%, #0ea5e9 100%)", emoji: "🏗️" },
  "social-feed":      { gradient: "linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)", emoji: "🐦" },
  "crypto-dashboard": { gradient: "linear-gradient(135deg, #f59e0b 0%, #10b981 100%)", emoji: "📈" },
  "kanban-board":     { gradient: "linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)", emoji: "🎯" },
  "recipe-app":       { gradient: "linear-gradient(135deg, #f59e0b 0%, #10b981 100%)", emoji: "🍳" },
  "job-board":        { gradient: "linear-gradient(135deg, #6366f1 0%, #10b981 100%)", emoji: "💼" },
  "music-player":     { gradient: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)", emoji: "🎵" },
  "weather-app":      { gradient: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)", emoji: "🌤️" },
  "ride-sharing":     { gradient: "linear-gradient(135deg, #374151 0%, #f59e0b 100%)", emoji: "🚗" },
  "food-delivery":    { gradient: "linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)", emoji: "🍔" },
  "saas-app":         { gradient: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)", emoji: "💡" },
  "ai-chat-app":      { gradient: "linear-gradient(135deg, #0f172a 0%, #6366f1 100%)", emoji: "🤖" },
  "real-estate":      { gradient: "linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)", emoji: "🏠" },
};

const TEMPLATES: Template[] = [
  { id: "landing-page",     name: "Landing Page",      description: "Modern SaaS landing page with hero, features, pricing, and CTA",        icon: "🚀", category: "Marketing",   complexity: "Simple",  prompt: "Build a modern SaaS landing page with a hero section, features grid, pricing table with 3 tiers, testimonials, and a call-to-action section. Use a dark theme with purple/blue gradients." },
  { id: "saas-dashboard",   name: "SaaS Dashboard",    description: "Analytics dashboard with charts, stats, and data tables",                icon: "📊", category: "Dashboard",   complexity: "Medium",  prompt: "Build a SaaS analytics dashboard with a sidebar navigation, stats cards showing key metrics, line charts for revenue and user growth, a recent activity feed, and a data table with pagination." },
  { id: "ecommerce-store",  name: "E-commerce Store",  description: "Product listings, cart, and checkout flow",                             icon: "🛍️", category: "E-commerce",  complexity: "Complex", prompt: "Build an e-commerce store with a product grid, filter sidebar, product detail modal, shopping cart drawer, and a checkout form with order summary." },
  { id: "blog",             name: "Blog",               description: "Clean blog with posts, categories, and search",                         icon: "✍️", category: "Content",     complexity: "Simple",  prompt: "Build a clean blog website with a header, featured post hero, post cards grid with category tags, a sidebar with categories and recent posts, and a search bar." },
  { id: "portfolio",        name: "Portfolio",          description: "Developer/designer portfolio with projects and contact",                 icon: "🎨", category: "Personal",    complexity: "Simple",  prompt: "Build a professional portfolio website for a developer with an animated hero section, skills grid, projects showcase with tech stack tags, work experience timeline, and a contact form." },
  { id: "todo-app",         name: "Todo App",           description: "Feature-rich todo app with categories and persistence",                 icon: "✅", category: "Productivity", complexity: "Simple",  prompt: "Build a todo app with categories, priority levels, due dates, drag-to-reorder, dark mode toggle, and local storage persistence. Include filter tabs for all/active/completed." },
  { id: "chat-app",         name: "Chat App",           description: "Real-time chat UI with message bubbles and rooms",                     icon: "💬", category: "Social",      complexity: "Medium",  prompt: "Build a chat application UI with a sidebar showing chat rooms and online users, message bubbles with timestamps and read receipts, an emoji picker, file attachment button, and typing indicators." },
  { id: "admin-panel",      name: "Admin Panel",        description: "Full-featured admin dashboard with user management",                    icon: "⚙️", category: "Dashboard",   complexity: "Complex", prompt: "Build an admin panel with a collapsible sidebar, user management table with CRUD actions, role badges, pagination, search and filter controls, and a settings page with toggle switches." },
  { id: "auth-system",      name: "Auth System",        description: "Login, signup, and password reset flows",                              icon: "🔐", category: "Auth",        complexity: "Medium",  prompt: "Build a complete authentication system with a login page, signup page with validation, forgot password flow, email verification notice page, and a profile settings page." },
  { id: "api-docs",         name: "API Docs",           description: "Beautiful API documentation site",                                     icon: "📖", category: "Developer",   complexity: "Medium",  prompt: "Build an API documentation website with a sticky sidebar navigation, endpoint cards with method badges (GET/POST/PUT/DELETE), request/response code examples with syntax highlighting, and a search bar." },
  { id: "newsletter",       name: "Newsletter",         description: "Newsletter signup with templates and preview",                         icon: "📧", category: "Marketing",   complexity: "Simple",  prompt: "Build a newsletter platform with a subscription form with email validation, a template gallery with preview cards, subscriber stats, and an email preview pane that shows rendered content." },
  { id: "booking-system",   name: "Booking System",     description: "Appointment booking with calendar and confirmation",                   icon: "📅", category: "Business",    complexity: "Medium",  prompt: "Build a booking system with a service selection step, date picker calendar showing available slots, time slot selector, booking form with customer details, and a confirmation page with booking summary." },
  { id: "saas-app-full",    name: "SaaS App Full",      description: "Complete SaaS with auth, billing, and dashboard",                     icon: "🏗️", category: "SaaS",        complexity: "Complex", prompt: "Build a complete SaaS application with authentication (login/signup), a billing/subscription page with Stripe-style pricing, a main dashboard with usage metrics, user settings, and a team management page." },
  { id: "social-feed",      name: "Social Feed",        description: "Twitter-style social feed with posts and profile",                     icon: "🐦", category: "Social",      complexity: "Complex", prompt: "Build a Twitter/X-style social media feed with a timeline, post cards with likes/comments/retweets, a compose tweet modal, user profile page with followers, and a trending sidebar." },
  { id: "crypto-dashboard", name: "Crypto Dashboard",   description: "Real-time crypto prices and portfolio tracker",                        icon: "📈", category: "Finance",     complexity: "Complex", prompt: "Build a cryptocurrency dashboard with a portfolio overview, price cards for top coins, a candlestick chart, transaction history table, wallet balance, and market cap rankings." },
  { id: "kanban-board",     name: "Kanban Board",       description: "Drag-and-drop project management board",                              icon: "🎯", category: "Productivity", complexity: "Medium",  prompt: "Build a Kanban board with drag-and-drop columns (Todo, In Progress, Review, Done), task cards with priority badges and assignee avatars, a task creation modal, and board settings." },
  { id: "recipe-app",       name: "Recipe App",         description: "Recipe browser with favorites and meal planner",                      icon: "🍳", category: "Lifestyle",   complexity: "Simple",  prompt: "Build a recipe app with a recipe grid with filter by cuisine and diet, a recipe detail page with ingredients and steps, a favorites system using localStorage, and a weekly meal planner." },
  { id: "job-board",        name: "Job Board",          description: "Job listings with filters and application flow",                       icon: "💼", category: "Business",    complexity: "Medium",  prompt: "Build a job board with job listing cards showing company, role, salary range, and tags, filter sidebar by type/location/salary, a job detail page, and an application modal with form." },
  { id: "music-player",     name: "Music Player",       description: "Spotify-style music player UI",                                       icon: "🎵", category: "Media",       complexity: "Medium",  prompt: "Build a Spotify-style music player with a sidebar showing playlists, a main content area with album grid, a now-playing bar at the bottom with progress scrubber, volume control, and play/skip buttons." },
  { id: "weather-app",      name: "Weather App",        description: "Weather app with forecasts and location search",                       icon: "🌤️", category: "Lifestyle",   complexity: "Simple",  prompt: "Build a weather app with a location search bar, current weather display with icon and temperature, a 7-day forecast, hourly chart, wind/humidity/pressure stats cards, and a dark/light theme toggle." },
  { id: "ride-sharing",     name: "Ride Sharing App",   description: "Uber-like ride sharing with maps and real-time tracking",             icon: "🚗", category: "Marketplace", complexity: "Complex", prompt: "Build a ride-sharing app like Uber with a map view showing available drivers, ride booking flow, driver dashboard with earnings, and real-time trip status updates using Supabase realtime." },
  { id: "food-delivery",    name: "Food Delivery",      description: "DoorDash-style food ordering and delivery platform",                  icon: "🍔", category: "Marketplace", complexity: "Complex", prompt: "Build a food delivery app with restaurant listings, menu items with images and prices, cart and checkout, order tracking page, and restaurant admin panel." },
  { id: "saas-app",         name: "SaaS App",           description: "Full SaaS with billing, teams, and settings",                        icon: "💡", category: "SaaS",        complexity: "Complex", prompt: "Build a SaaS application with a marketing landing page, user onboarding, subscription plans with Stripe billing, team workspace management, and account settings." },
  { id: "ai-chat-app",      name: "AI Chat App",        description: "ChatGPT-style AI chat with history and personas",                     icon: "🤖", category: "AI",          complexity: "Complex", prompt: "Build an AI chat application with a sidebar showing conversation history, multiple AI personas/system prompts, markdown message rendering, code syntax highlighting, and message regeneration." },
  { id: "real-estate",      name: "Real Estate",        description: "Property listings with map view and mortgage calculator",             icon: "🏠", category: "Marketplace", complexity: "Medium",  prompt: "Build a real estate platform with property listing cards showing price, beds, baths, and location, a map view with pins, a property detail page with image gallery, and a mortgage calculator." },
];

const ALL_CATEGORIES = ["All", ...Array.from(new Set(TEMPLATES.map((t) => t.category))).sort()];
const COMPLEXITIES: Array<"All" | Complexity> = ["All", "Simple", "Medium", "Complex"];

export default function TemplatesPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeComplexity, setActiveComplexity] = useState<"All" | Complexity>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered = TEMPLATES.filter((t) => {
    const matchCat = activeCategory === "All" || t.category === activeCategory;
    const matchComplex = activeComplexity === "All" || t.complexity === activeComplexity;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
    return matchCat && matchComplex && matchSearch;
  });

  function applyTemplate(template: Template) {
    router.push(`/ai?template=${template.id}&prompt=${encodeURIComponent(template.prompt)}`);
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInStagger { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        .tpl-search:focus { outline: none; border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.15) !important; }
        .tpl-search::placeholder { color: #475569; }
        .tpl-card { transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s; }
        .tpl-card:hover { transform: translateY(-4px) scale(1.01); box-shadow: 0 16px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,102,241,0.3); border-color: rgba(99,102,241,0.5) !important; }
        .tpl-overlay { opacity: 0; transition: opacity 0.2s; }
        .tpl-card:hover .tpl-overlay { opacity: 1; }
        .tpl-use-btn { transition: background 0.15s, transform 0.1s; }
        .tpl-use-btn:hover { transform: scale(1.04); }
        .tpl-grid-pattern {
          background-image: linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: COLORS.bg, color: COLORS.textPrimary, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
        <NavBar />
        <div style={{ flex: 1, padding: '2rem 2rem 3rem', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>

          {/* Header */}
          <div style={{ marginBottom: '2rem', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Project Templates
              </h1>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: 'rgba(99,102,241,0.15)', color: COLORS.accent, border: '1px solid rgba(99,102,241,0.3)', letterSpacing: '0.02em' }}>
                {TEMPLATES.length}
              </span>
            </div>
            <p style={{ fontSize: '1rem', color: COLORS.textSecondary, margin: 0, lineHeight: 1.6 }}>
              Kickstart your next project with a professionally crafted template. <span style={{ color: COLORS.textMuted }}>Click any card to start building.</span>
            </p>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '1.25rem', maxWidth: '520px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: COLORS.textMuted, pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              className="tpl-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates…"
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${COLORS.border}`, borderRadius: '12px', padding: '0.65rem 1rem 0.65rem 2.5rem', color: COLORS.textPrimary, fontSize: '0.875rem', transition: 'border-color 0.2s, box-shadow 0.2s' }}
            />
          </div>

          {/* Filters Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.75rem', alignItems: 'center' }}>
            {/* Category pills */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '0.35rem 0.875rem',
                    borderRadius: '20px',
                    border: activeCategory === cat ? '1px solid rgba(99,102,241,0.6)' : `1px solid ${COLORS.border}`,
                    background: activeCategory === cat ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.03)',
                    color: activeCategory === cat ? '#a5b4fc' : COLORS.textSecondary,
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                    fontWeight: activeCategory === cat ? 600 : 500,
                    transition: 'all 0.15s',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
            {/* Divider */}
            <div style={{ width: '1px', height: '22px', background: COLORS.border, flexShrink: 0 }} />
            {/* Complexity pills */}
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {COMPLEXITIES.map((c) => {
                const isAll = c === "All";
                const colors = isAll ? null : COMPLEXITY_COLORS[c];
                const isActive = activeComplexity === c;
                return (
                  <button
                    key={c}
                    onClick={() => setActiveComplexity(c)}
                    style={{
                      padding: '0.35rem 0.875rem',
                      borderRadius: '20px',
                      border: isActive && !isAll ? `1px solid ${colors!.color}55` : isActive ? '1px solid rgba(99,102,241,0.6)' : `1px solid ${COLORS.border}`,
                      background: isActive && !isAll ? colors!.bg : isActive ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.03)',
                      color: isActive && !isAll ? colors!.color : isActive ? '#a5b4fc' : COLORS.textSecondary,
                      cursor: 'pointer',
                      fontSize: '0.8125rem',
                      fontWeight: isActive ? 600 : 500,
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
            <p style={{ fontSize: '0.8125rem', color: COLORS.textMuted, marginBottom: '1.25rem' }}>
              Showing <span style={{ color: COLORS.textSecondary, fontWeight: 600 }}>{filtered.length}</span> of {TEMPLATES.length} templates
            </p>
          )}

          {/* Templates Grid */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: COLORS.textMuted }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔍</div>
              <p style={{ fontSize: '1rem', fontWeight: 500, color: COLORS.textSecondary, margin: '0 0 0.5rem' }}>No templates found</p>
              <p style={{ fontSize: '0.875rem', margin: 0 }}>Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem', animation: 'fadeIn 0.5s ease' }}>
              {filtered.map((template, idx) => {
                const cx = COMPLEXITY_COLORS[template.complexity];
                const preview = TEMPLATE_PREVIEWS[template.id] ?? { gradient: COLORS.accentGradient, emoji: template.icon };
                const isHovered = hoveredId === template.id;
                return (
                  <div
                    key={template.id}
                    className="tpl-card"
                    onMouseEnter={() => setHoveredId(template.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      background: COLORS.bgCard,
                      border: `1px solid ${isHovered ? 'rgba(99,102,241,0.5)' : COLORS.border}`,
                      borderRadius: '16px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      animation: `fadeInStagger 0.4s ease ${Math.min(idx * 0.03, 0.3)}s both`,
                    }}
                    onClick={() => applyTemplate(template)}
                  >
                    {/* Visual Preview Area */}
                    <div
                      style={{
                        position: 'relative',
                        height: '160px',
                        background: preview.gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}
                    >
                      {/* Grid pattern overlay */}
                      <div className="tpl-grid-pattern" style={{ position: 'absolute', inset: 0, opacity: 0.5 }} />
                      {/* Glow effect */}
                      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08) 0%, transparent 70%)' }} />
                      {/* Emoji */}
                      <span style={{ fontSize: '3.5rem', position: 'relative', zIndex: 1, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>
                        {preview.emoji}
                      </span>
                      {/* Hover overlay with CTA */}
                      <div
                        className="tpl-overlay"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(10,11,20,0.75)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backdropFilter: 'blur(2px)',
                          zIndex: 2,
                        }}
                      >
                        <button
                          className="tpl-use-btn"
                          style={{
                            padding: '0.6rem 1.5rem',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            border: 'none',
                            borderRadius: '10px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            letterSpacing: '0.01em',
                            boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
                          }}
                          onClick={(e) => { e.stopPropagation(); applyTemplate(template); }}
                        >
                          Use Template →
                        </button>
                      </div>
                    </div>

                    {/* Card Info */}
                    <div style={{ padding: '1rem 1.125rem 1.125rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: COLORS.textPrimary, letterSpacing: '-0.01em' }}>
                          {template.name}
                        </h3>
                        <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '2px 7px', borderRadius: '10px', background: cx.bg, color: cx.color, whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {template.complexity}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.8125rem', color: COLORS.textSecondary, lineHeight: 1.55 }}>
                        {template.description}
                      </p>
                      <div style={{ marginTop: 'auto', paddingTop: '0.375rem' }}>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>
                          {template.category}
                        </span>
                      </div>
                    </div>
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
