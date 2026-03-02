export default function DashboardPage() {
  const sections = [
    { href: "/dashboard/ai-feedback", label: "AI Feedback", description: "Human-in-the-Loop refinement & learning", emoji: "🤖" },
    { href: "/dashboard/tenants", label: "Tenant Management", description: "Multi-tenant SaaS administration", emoji: "🏢" },
    { href: "/dashboard/academy", label: "AI Academy", description: "Courses, certifications & leaderboards", emoji: "🎓" },
    { href: "/dashboard/billing", label: "Billing & Monetization", description: "Subscriptions, usage metering & invoices", emoji: "💳" },
    { href: "/dashboard/predictions", label: "Predictions", description: "AI-powered intelligence & forecasts", emoji: "🔮" },
    { href: "/dashboard/localization", label: "Localization", description: "100+ languages & regional customization", emoji: "🌍" },
    { href: "/dashboard/plugins", label: "Plugin Marketplace", description: "Discover, build & publish plugins", emoji: "🔌" },
    { href: "/dashboard/collaboration", label: "Collaboration Hub", description: "Live co-editing & team tools", emoji: "👥" },
    { href: "/dashboard/enterprise", label: "Enterprise Console", description: "SSO, audit logs & SLA management", emoji: "🏛️" },
    { href: "/dashboard/models", label: "Model Registry", description: "AI model versioning & deployment", emoji: "🧠" },
    { href: "/dashboard/jobs", label: "Job Queue Monitor", description: "Background jobs & task scheduling", emoji: "⚙️" },
    { href: "/dashboard/security", label: "Security Dashboard", description: "OWASP compliance & threat detection", emoji: "🔒" },
    { href: "/dashboard/metrics", label: "Metrics & Monitoring", description: "Real-time performance dashboards", emoji: "📊" },
    { href: "/dashboard/integrations", label: "Integrations", description: "100+ third-party connectors", emoji: "🔗" },
    { href: "/ai", label: "AI Builder", description: "Generate & deploy AI applications", emoji: "✨" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #222", padding: "24px 32px", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 28, fontWeight: 900 }}>ZIVO AI</span>
        <span style={{ color: "#666", fontSize: 14 }}>Ultimate AI Application Generation Platform</span>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 32px" }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Dashboard</h1>
        <p style={{ color: "#888", marginBottom: 40 }}>Select a module to get started.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {sections.map((s) => (
            <a
              key={s.href}
              href={s.href}
              style={{
                display: "block",
                padding: 24,
                borderRadius: 12,
                border: "1px solid #222",
                background: "#111",
                textDecoration: "none",
                color: "inherit",
                transition: "border-color 0.2s",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>{s.emoji}</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{s.label}</div>
              <div style={{ color: "#888", fontSize: 13 }}>{s.description}</div>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
