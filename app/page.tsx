import Link from "next/link";

const features = [
  {
    icon: "🤖",
    title: "AI App Builder",
    description: "Generate full-stack AI applications from a single prompt. Healthcare, FinTech, E-commerce, SaaS and 20+ verticals.",
  },
  {
    icon: "🌍",
    title: "Global Deployment",
    description: "One-click deployment to 50+ countries with multi-region support, local compliance, and 100+ payment methods.",
  },
  {
    icon: "📊",
    title: "Analytics Empire",
    description: "Real-time, predictive, and prescriptive analytics. Behavioral insights, churn prediction, and revenue forecasting.",
  },
  {
    icon: "🔗",
    title: "500+ Integrations",
    description: "Connect to every service. AWS, Azure, GCP, Stripe, Salesforce, and 495 more integrations out of the box.",
  },
  {
    icon: "⚡",
    title: "Self-Healing Systems",
    description: "Auto-detection, auto-recovery, and predictive maintenance. Your platform heals itself before you even notice.",
  },
  {
    icon: "🔒",
    title: "Enterprise Security",
    description: "Post-quantum cryptography, zero-trust architecture, automated vulnerability scanning, and SOC 2 compliance.",
  },
  {
    icon: "🧠",
    title: "Next-Gen AI Models",
    description: "GPT-4.1, Claude, Gemini, Llama, and Mistral. Fine-tune custom models and A/B test AI performance.",
  },
  {
    icon: "🌐",
    title: "Web3 & Blockchain",
    description: "Smart contracts, NFT marketplace, DAO governance, DeFi protocols, and IPFS decentralized hosting.",
  },
  {
    icon: "🏭",
    title: "No-Code Platform",
    description: "Visual workflow builder, drag-and-drop UI, no-code database designer, and visual ML model builder.",
  },
];

const verticals = [
  "Healthcare AI", "FinTech", "E-commerce", "SaaS", "Education",
  "Legal Tech", "Real Estate", "Logistics", "Manufacturing", "Agriculture",
  "Insurance", "Travel", "Media", "Government", "Non-Profit",
];

const stats = [
  { value: "1M+", label: "Users" },
  { value: "10K+", label: "Enterprises" },
  { value: "50+", label: "Countries" },
  { value: "500+", label: "Integrations" },
];

export default function Home() {
  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", background: "#000", color: "#fff", minHeight: "100vh" }}>
      {/* Navigation */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 40px", borderBottom: "1px solid #222", position: "sticky", top: 0, background: "#000", zIndex: 100 }}>
        <div style={{ fontSize: 24, fontWeight: 900, background: "linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          ZIVO AI
        </div>
        <div style={{ display: "flex", gap: 32, fontSize: 14 }}>
          <Link href="/dashboard" style={{ color: "#aaa", textDecoration: "none" }}>Dashboard</Link>
          <Link href="/ai" style={{ color: "#aaa", textDecoration: "none" }}>AI Builder</Link>
          <a href="#features" style={{ color: "#aaa", textDecoration: "none" }}>Features</a>
          <a href="#verticals" style={{ color: "#aaa", textDecoration: "none" }}>Verticals</a>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/ai-login" style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid #333", color: "#fff", textDecoration: "none", fontSize: 14 }}>Login</Link>
          <Link href="/ai" style={{ padding: "10px 20px", borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 700 }}>Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: "center", padding: "120px 40px 80px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "inline-block", padding: "6px 16px", borderRadius: 20, border: "1px solid #6366f1", fontSize: 13, color: "#8b5cf6", marginBottom: 24 }}>
          🚀 The Ultimate AI Platform — Now Live
        </div>
        <h1 style={{ fontSize: 72, fontWeight: 900, lineHeight: 1.1, marginBottom: 24, background: "linear-gradient(135deg, #fff 30%, #8b5cf6 70%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Build. Deploy. Dominate.
        </h1>
        <p style={{ fontSize: 22, color: "#888", maxWidth: 700, margin: "0 auto 48px", lineHeight: 1.6 }}>
          ZIVO AI is the world&apos;s most comprehensive AI platform. Generate full-stack applications,
          deploy globally, and scale to millions — all from a single prompt.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/ai" style={{ padding: "16px 40px", borderRadius: 12, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", textDecoration: "none", fontSize: 18, fontWeight: 700 }}>
            Start Building Free →
          </Link>
          <Link href="/dashboard" style={{ padding: "16px 40px", borderRadius: 12, border: "1px solid #333", color: "#fff", textDecoration: "none", fontSize: 18 }}>
            View Dashboard
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section style={{ display: "flex", justifyContent: "center", gap: 64, padding: "40px", borderTop: "1px solid #111", borderBottom: "1px solid #111", background: "#080808" }}>
        {stats.map((stat) => (
          <div key={stat.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 42, fontWeight: 900, background: "linear-gradient(135deg, #6366f1, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{stat.value}</div>
            <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section id="features" style={{ padding: "100px 40px", maxWidth: 1200, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: 48, fontWeight: 900, marginBottom: 16 }}>Everything You Need</h2>
        <p style={{ textAlign: "center", color: "#666", fontSize: 18, marginBottom: 64 }}>46 feature categories. 500+ integrations. Infinite scale.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {features.map((f) => (
            <div key={f.title} style={{ padding: 28, borderRadius: 16, border: "1px solid #1a1a1a", background: "#0a0a0a" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: "#666", fontSize: 14, lineHeight: 1.6 }}>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Verticals */}
      <section id="verticals" style={{ padding: "80px 40px", background: "#050505", borderTop: "1px solid #111" }}>
        <h2 style={{ textAlign: "center", fontSize: 48, fontWeight: 900, marginBottom: 16 }}>Every Industry. Every Vertical.</h2>
        <p style={{ textAlign: "center", color: "#666", fontSize: 18, marginBottom: 48 }}>20+ industry-specific AI builders ready to deploy.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", maxWidth: 900, margin: "0 auto" }}>
          {verticals.map((v) => (
            <span key={v} style={{ padding: "10px 20px", borderRadius: 24, border: "1px solid #222", fontSize: 14, color: "#aaa" }}>{v}</span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: "center", padding: "120px 40px", background: "linear-gradient(135deg, #0a0020, #000)" }}>
        <h2 style={{ fontSize: 56, fontWeight: 900, marginBottom: 16 }}>Ready to Dominate?</h2>
        <p style={{ fontSize: 20, color: "#666", marginBottom: 40 }}>Join 1M+ users building the future with ZIVO AI.</p>
        <Link href="/ai" style={{ padding: "18px 48px", borderRadius: 12, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", textDecoration: "none", fontSize: 18, fontWeight: 700 }}>
          Start For Free →
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ padding: "40px", borderTop: "1px solid #111", textAlign: "center", color: "#444", fontSize: 14 }}>
        <div style={{ marginBottom: 16, fontSize: 20, fontWeight: 900, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ZIVO AI</div>
        <p>© 2026 ZIVO AI. The Ultimate AI Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
