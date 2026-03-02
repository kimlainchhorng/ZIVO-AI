import Link from "next/link";

const platformStats = [
  { label: "Active Users", value: "1,247,839", change: "+12.4%", up: true },
  { label: "API Calls Today", value: "48,392,011", change: "+8.7%", up: true },
  { label: "Apps Deployed", value: "94,302", change: "+21.2%", up: true },
  { label: "Revenue (MRR)", value: "$4,821,440", change: "+18.9%", up: true },
];

const recentActivity = [
  { action: "New app deployed", detail: "HealthcareAI Platform v2.1", time: "2 min ago", icon: "🚀" },
  { action: "Model trained", detail: "Custom GPT-4.1 fine-tune complete", time: "14 min ago", icon: "🧠" },
  { action: "Integration added", detail: "Salesforce CRM connector", time: "1 hr ago", icon: "🔗" },
  { action: "Auto-heal triggered", detail: "Memory leak fixed in prod-cluster-3", time: "2 hr ago", icon: "⚡" },
  { action: "Marketplace listing", detail: "DataSet: Global E-commerce Trends", time: "3 hr ago", icon: "🏪" },
];

const featureModules = [
  { title: "AI Builder", description: "Generate full-stack apps from prompts", icon: "🤖", href: "/ai", status: "active" },
  { title: "Analytics Empire", description: "Real-time & predictive analytics", icon: "📊", href: "#", status: "active" },
  { title: "Marketplace", description: "Data & app marketplace", icon: "🏪", href: "#", status: "active" },
  { title: "Blockchain Hub", description: "Smart contracts & DeFi", icon: "⛓️", href: "#", status: "beta" },
  { title: "Model Training", description: "Fine-tune AI models", icon: "🧠", href: "#", status: "active" },
  { title: "Global Deploy", description: "50+ country deployment", icon: "🌍", href: "#", status: "active" },
  { title: "No-Code Builder", description: "Visual workflow designer", icon: "🎨", href: "#", status: "active" },
  { title: "Edge AI", description: "Local inference on 50+ devices", icon: "📱", href: "#", status: "beta" },
];

export default function DashboardPage() {
  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", background: "#050505", color: "#fff", minHeight: "100vh" }}>
      {/* Sidebar + Main layout */}
      <div style={{ display: "flex" }}>
        {/* Sidebar */}
        <aside style={{ width: 240, background: "#0a0a0a", borderRight: "1px solid #1a1a1a", minHeight: "100vh", padding: "24px 0", position: "fixed", top: 0 }}>
          <div style={{ padding: "0 20px 24px", borderBottom: "1px solid #1a1a1a", marginBottom: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 900, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ZIVO AI</div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>Ultimate Platform v3.0</div>
          </div>
          {[
            { label: "Dashboard", icon: "📊", href: "/dashboard", active: true },
            { label: "AI Builder", icon: "🤖", href: "/ai" },
            { label: "Analytics", icon: "📈", href: "#" },
            { label: "Marketplace", icon: "🏪", href: "#" },
            { label: "Deployments", icon: "🚀", href: "#" },
            { label: "Integrations", icon: "🔗", href: "#" },
            { label: "Blockchain", icon: "⛓️", href: "#" },
            { label: "Models", icon: "🧠", href: "#" },
            { label: "Settings", icon: "⚙️", href: "#" },
          ].map((item) => (
            <Link key={item.label} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", fontSize: 14,
              color: item.active ? "#fff" : "#555", textDecoration: "none",
              background: item.active ? "#1a1a2e" : "transparent",
              borderLeft: item.active ? "3px solid #6366f1" : "3px solid transparent",
            }}>
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
          <div style={{ padding: "20px", borderTop: "1px solid #1a1a1a", marginTop: "auto", position: "absolute", bottom: 0, width: "100%", boxSizing: "border-box" }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#555", textDecoration: "none" }}>
              ← Back to Home
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ marginLeft: 240, flex: 1, padding: 32 }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>Platform Dashboard</h1>
              <p style={{ color: "#555", fontSize: 14, margin: "4px 0 0" }}>Welcome back. ZIVO AI is running at 99.99% uptime.</p>
            </div>
            <Link href="/ai" style={{ padding: "10px 24px", borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 700 }}>
              + New App
            </Link>
          </div>

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
            {platformStats.map((stat) => (
              <div key={stat.label} style={{ padding: 20, borderRadius: 12, border: "1px solid #1a1a1a", background: "#0a0a0a" }}>
                <div style={{ fontSize: 12, color: "#555", marginBottom: 8 }}>{stat.label}</div>
                <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: stat.up ? "#22c55e" : "#ef4444" }}>{stat.change} vs last month</div>
              </div>
            ))}
          </div>

          {/* Feature Modules */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Platform Modules</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {featureModules.map((mod) => (
                <Link key={mod.title} href={mod.href} style={{ padding: 20, borderRadius: 12, border: "1px solid #1a1a1a", background: "#0a0a0a", textDecoration: "none", color: "inherit", display: "block" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontSize: 28 }}>{mod.icon}</span>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: mod.status === "active" ? "#14532d" : "#1e3a5f", color: mod.status === "active" ? "#22c55e" : "#60a5fa" }}>{mod.status}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginTop: 12 }}>{mod.title}</div>
                  <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>{mod.description}</div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{ padding: 24, borderRadius: 12, border: "1px solid #1a1a1a", background: "#0a0a0a" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 16px" }}>Recent Activity</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {recentActivity.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 0", borderBottom: i < recentActivity.length - 1 ? "1px solid #111" : "none" }}>
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{item.action}</div>
                    <div style={{ fontSize: 12, color: "#555" }}>{item.detail}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "#444" }}>{item.time}</div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
