"use client";

import { useRouter } from "next/navigation";
const TEMPLATES = [
  { id: "t1",  name: "Landing Page",       category: "Marketing",   desc: "Beautiful hero, features, pricing, and CTA sections." },
  { id: "t2",  name: "E-commerce Store",   category: "Commerce",    desc: "Product grid, cart, checkout flow with Stripe." },
  { id: "t3",  name: "Blog Platform",      category: "Content",     desc: "Article list, detail view, tags, and search." },
  { id: "t4",  name: "Admin Dashboard",    category: "Dashboard",   desc: "Sidebar nav, stats cards, tables, and charts." },
  { id: "t5",  name: "Portfolio",          category: "Personal",    desc: "Projects showcase with case studies and contact." },
  { id: "t6",  name: "SaaS App",           category: "Product",     desc: "Auth, billing, settings, and feature pages." },
  { id: "t7",  name: "Mobile App UI",      category: "Mobile",      desc: "React Native screen layouts for iOS and Android." },
  { id: "t8",  name: "API Documentation",  category: "Docs",        desc: "Reference docs with code samples and try-it panels." },
  { id: "t9",  name: "Restaurant Website", category: "Business",    desc: "Menu, reservations, gallery, and contact info." },
  { id: "t10", name: "Event Page",         category: "Marketing",   desc: "Event schedule, speakers, tickets, and countdown." },
  { id: "t11", name: "Startup Website",    category: "Business",    desc: "Team, product, investors, and press sections." },
  { id: "t12", name: "Crypto Dashboard",   category: "Finance",     desc: "Portfolio tracker, charts, and token watchlist." },
  { id: "t13", name: "Social Network",     category: "Community",   desc: "Feed, profiles, follow system, and messaging." },
  { id: "t14", name: "Job Board",          category: "Marketplace", desc: "Listings, filters, applications, and employer panel." },
];

const CATEGORY_COLORS: Record<string, string> = {
  Marketing: "#f5a623",
  Commerce: "#6c47ff",
  Content: "#4caf50",
  Dashboard: "#00bcd4",
  Personal: "#e91e63",
  Product: "#9c27b0",
  Mobile: "#ff5722",
  Docs: "#607d8b",
  Business: "#795548",
  Finance: "#ffc107",
  Community: "#03a9f4",
  Marketplace: "#8bc34a",
};

const s = {
  page: { minHeight: "100vh", background: "#0a0a0a", color: "#f0f0f0", padding: "32px" } as React.CSSProperties,
  title: { fontSize: 32, fontWeight: 900, margin: 0, color: "#fff" } as React.CSSProperties,
  subtitle: { color: "#888", marginTop: 8, fontSize: 16, marginBottom: 32 } as React.CSSProperties,
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 } as React.CSSProperties,
  card: { background: "#111", borderRadius: 16, padding: 24, border: "1px solid #222", display: "flex", flexDirection: "column" as const, gap: 12 } as React.CSSProperties,
  cardName: { fontSize: 18, fontWeight: 800, color: "#fff", margin: 0 } as React.CSSProperties,
  cardDesc: { color: "#aaa", fontSize: 14, lineHeight: 1.5, flex: 1 } as React.CSSProperties,
  footer: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 } as React.CSSProperties,
  badge: { fontSize: 12, padding: "4px 10px", borderRadius: 99, fontWeight: 700 } as React.CSSProperties,
  useBtn: { padding: "8px 18px", borderRadius: 10, border: "none", background: "#6c47ff", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" } as React.CSSProperties,
};

export default function TemplatesPage() {
  const router = useRouter();
  function handleUse(name: string) {
    router.push(`/ai?template=${encodeURIComponent(name)}`);
  }

  return (
    <div style={s.page}>
      <h1 style={s.title}>Template Gallery</h1>
      <p style={s.subtitle}>Start with a pre-built template and customize with AI</p>
      <div style={s.grid}>
        {TEMPLATES.map((t) => (
          <div key={t.id} style={s.card}>
            <h3 style={s.cardName}>{t.name}</h3>
            <p style={s.cardDesc}>{t.desc}</p>
            <div style={s.footer}>
              <span style={{ ...s.badge, background: "#1a1a1a", color: CATEGORY_COLORS[t.category] ?? "#888" }}>
                {t.category}
              </span>
              <button style={s.useBtn} onClick={() => handleUse(t.name)}>Use Template</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
