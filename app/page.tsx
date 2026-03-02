import Link from "next/link";

const FEATURES = [
  { icon: "⚡", title: "AI Builder",    desc: "Generate full websites from a single prompt.",              href: "/ai"                     },
  { icon: "🧩", title: "Marketplace",   desc: "Install plugins to extend your AI's capabilities.",        href: "/dashboard/marketplace"  },
  { icon: "👥", title: "Team",          desc: "Collaborate with your team in real time.",                 href: "/dashboard/team"         },
  { icon: "📊", title: "Analytics",     desc: "Track usage, costs, and generation performance.",          href: "/dashboard/analytics"    },
  { icon: "📋", title: "Templates",     desc: "Start from 14+ production-ready templates.",              href: "/dashboard/templates"    },
  { icon: "🔌", title: "Integrations",  desc: "Connect Slack, GitHub, Figma, Notion, and more.",         href: "/dashboard/integrations" },
  { icon: "🧠", title: "AI Training",   desc: "Fine-tune the AI with your brand voice and code style.",   href: "/dashboard/ai-training"  },
  { icon: "✍️", title: "Content",       desc: "Generate blog posts and marketing copy instantly.",        href: "/dashboard/content"      },
  { icon: "🐳", title: "DevOps",        desc: "Auto-generate Docker, Kubernetes, and CI/CD configs.",     href: "/dashboard/devops"       },
  { icon: "⚙️", title: "Settings",      desc: "Manage billing, API keys, security, and notifications.",  href: "/dashboard/settings"     },
];

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f0f0f0" }}>
      {/* Hero */}
      <div style={{ textAlign: "center", padding: "80px 24px 60px" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>⚡</div>
        <h1 style={{ fontSize: 52, fontWeight: 900, margin: 0, color: "#fff", lineHeight: 1.1 }}>
          ZIVO AI
        </h1>
        <p style={{ fontSize: 22, color: "#a78bfa", fontWeight: 700, marginTop: 12 }}>
          The Complete AI-Powered Development Platform
        </p>
        <p style={{ fontSize: 16, color: "#888", maxWidth: 560, margin: "16px auto 0", lineHeight: 1.6 }}>
          Generate websites, mobile apps, and infrastructure from natural language.
          Build faster with AI — from prototype to production.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 32, flexWrap: "wrap" }}>
          <Link
            href="/ai"
            style={{
              padding: "14px 32px",
              borderRadius: 12,
              background: "#6c47ff",
              color: "#fff",
              fontWeight: 900,
              fontSize: 16,
              textDecoration: "none",
            }}
          >
            Launch AI Builder →
          </Link>
          <Link
            href="/dashboard/marketplace"
            style={{
              padding: "14px 32px",
              borderRadius: 12,
              background: "transparent",
              color: "#a78bfa",
              fontWeight: 900,
              fontSize: 16,
              textDecoration: "none",
              border: "1px solid #6c47ff",
            }}
          >
            Browse Marketplace
          </Link>
        </div>
      </div>

      {/* Feature Grid */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px" }}>
        <h2 style={{ textAlign: "center", fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 32 }}>
          Everything you need to build with AI
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 20,
        }}>
          {FEATURES.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              style={{ textDecoration: "none" }}
            >
              <div style={{
                background: "#111",
                borderRadius: 16,
                padding: 24,
                border: "1px solid #222",
                cursor: "pointer",
                transition: "border-color 0.2s",
                height: "100%",
              }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 14, color: "#888", lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
