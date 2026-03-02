import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ZIVO AI – Platform Dashboard",
  description: "Full ZIVO AI platform dashboard: all expansion phases, feature categories, and integrations.",
};

interface FeatureCategory {
  title: string;
  icon: string;
  color: string;
  features: string[];
  stats?: { label: string; value: string }[];
}

const CATEGORIES: FeatureCategory[] = [
  {
    title: "Maintenance & Stability",
    icon: "🛡️",
    color: "#22c55e",
    features: [
      "Self-healing systems with automated rollback",
      "Real-time health monitoring & alerting",
      "Zero-downtime deployments",
      "Automated dependency updates & patching",
      "Chaos engineering & resilience testing",
      "SLA / uptime dashboard (99.99% target)",
    ],
  },
  {
    title: "Market Expansion – 20+ Verticals",
    icon: "📈",
    color: "#f59e0b",
    features: [
      "Healthcare & MedTech AI",
      "FinTech & Banking AI",
      "Legal & Compliance AI",
      "Education & EdTech AI",
      "Retail & E-Commerce AI",
      "Manufacturing & Industry 4.0",
      "Real Estate & PropTech AI",
      "Logistics & Supply Chain AI",
      "Agriculture & AgriTech AI",
      "Government & Public Sector AI",
      "Media & Entertainment AI",
      "Hospitality & Travel AI",
      "Energy & CleanTech AI",
      "Insurance & Risk AI",
      "HR & Recruitment AI",
      "Marketing & Advertising AI",
      "Cybersecurity AI",
      "Telecommunications AI",
      "Automotive & Mobility AI",
      "Sports & Fitness AI",
    ],
    stats: [{ label: "Verticals", value: "20+" }],
  },
  {
    title: "Geographic Expansion – 50+ Countries",
    icon: "🌍",
    color: "#3b82f6",
    features: [
      "Multi-language AI (100+ languages)",
      "Cultural AI models & localization",
      "Regional compliance (GDPR, CCPA, PIPL, etc.)",
      "Local data residency & sovereignty",
      "In-region cloud infrastructure (AWS/GCP/Azure)",
      "Global CDN & edge caching",
      "Local payment gateway integrations",
      "Country-specific regulatory dashboards",
    ],
    stats: [
      { label: "Countries", value: "50+" },
      { label: "Languages", value: "100+" },
    ],
  },
  {
    title: "Global Partnerships",
    icon: "🤝",
    color: "#a78bfa",
    features: [
      "Fortune 500 enterprise partnerships",
      "Hyperscaler partnerships (AWS, GCP, Azure, Alibaba)",
      "System integrator alliances (Accenture, Deloitte, KPMG)",
      "ISV & marketplace partnerships",
      "Academic & research collaborations",
      "Government & public-sector MoUs",
      "Channel & reseller partner programme",
      "Global consulting partner network",
    ],
  },
  {
    title: "Next-Gen AI – GPT-5 & Beyond",
    icon: "🧠",
    color: "#ec4899",
    features: [
      "GPT-5 & latest frontier model integration",
      "Custom fine-tuned model training (BYOD)",
      "Multi-model routing & orchestration",
      "Multimodal processing (text, image, audio, video)",
      "Retrieval-Augmented Generation (RAG) pipelines",
      "Long-context & memory-augmented inference",
      "On-prem / private model deployment",
      "Neural interface readiness (BCI API layer)",
      "Quantum computing readiness & hybrid algorithms",
    ],
  },
  {
    title: "No-Code / Low-Code Platform",
    icon: "🔧",
    color: "#06b6d4",
    features: [
      "Visual drag-and-drop site builder",
      "AI workflow automation builder",
      "Zero-code API endpoint generator",
      "No-code database schema designer (300+ table templates)",
      "Visual agent builder & orchestrator",
      "One-click deployment to cloud or edge",
      "Form & survey builder with AI analytics",
      "Chatbot builder with multi-channel deployment",
    ],
  },
  {
    title: "Blockchain & Web3",
    icon: "⛓️",
    color: "#f97316",
    features: [
      "DAO governance framework",
      "Smart contract templates & audit tooling",
      "IPFS & decentralised file hosting",
      "NFT-based access control & licensing",
      "On-chain AI model provenance & versioning",
      "Token-gated API access",
      "DeFi analytics integration",
      "Multi-chain support (Ethereum, Solana, Polygon, etc.)",
    ],
  },
  {
    title: "Distributed & Edge Deployment",
    icon: "🌐",
    color: "#10b981",
    features: [
      "Global distributed deployment (50+ regions)",
      "Edge AI inference (sub-10 ms latency)",
      "Kubernetes-native orchestration",
      "Multi-cloud & hybrid-cloud support",
      "Serverless & container-as-a-service",
      "IoT & embedded AI device support",
      "Offline-first progressive web capabilities",
      "5G-optimised inference pipeline",
    ],
  },
  {
    title: "Metaverse & Immersive AI",
    icon: "🥽",
    color: "#8b5cf6",
    features: [
      "3D avatar & virtual assistant builder",
      "VR / AR AI experience generator",
      "Spatial computing AI API",
      "Digital-twin simulation engine",
      "Metaverse marketplace & commerce layer",
      "Immersive training & onboarding AI",
      "Real-time 3D scene AI generation",
    ],
  },
  {
    title: "Analytics Empire",
    icon: "📊",
    color: "#eab308",
    features: [
      "200+ pre-built analytical dashboards",
      "Real-time streaming analytics",
      "Business intelligence (BI) suite",
      "Predictive analytics & forecasting",
      "Data monetisation marketplace",
      "Custom report & visualisation builder",
      "Anomaly detection & root-cause AI",
      "Customer 360 & cohort analytics",
    ],
    stats: [{ label: "Dashboards", value: "200+" }],
  },
  {
    title: "Data Infrastructure",
    icon: "🗄️",
    color: "#64748b",
    features: [
      "300+ database table templates",
      "Multi-database support (SQL, NoSQL, vector, graph)",
      "AI-powered data pipeline builder",
      "Automated schema migration & versioning",
      "Data governance & lineage tracking",
      "Privacy-first anonymisation tools",
      "Global data marketplace",
      "Federated learning & privacy-preserving AI",
    ],
    stats: [{ label: "DB Tables", value: "300+" }],
  },
  {
    title: "Enterprise Suite",
    icon: "🏢",
    color: "#0ea5e9",
    features: [
      "Fortune 500 enterprise targeting",
      "SSO / SAML / OIDC enterprise auth",
      "Role-based access control (RBAC) & audit logs",
      "Dedicated managed services & SLAs",
      "White-label & OEM licensing",
      "Enterprise consulting & professional services",
      "Custom AI model development services",
      "Dedicated customer success & support",
    ],
  },
  {
    title: "Developer Tools Empire",
    icon: "💻",
    color: "#f43f5e",
    features: [
      "500+ API endpoints (REST + GraphQL + gRPC)",
      "SDK for 20+ languages & frameworks",
      "IDE plugins (VS Code, JetBrains, Neovim)",
      "GitHub / GitLab CI integration",
      "OpenAPI 3.1 & AsyncAPI documentation",
      "Interactive API playground",
      "Code-gen CLI & scaffolding tools",
      "Framework adapters (React, Vue, Angular, Next.js, etc.)",
    ],
    stats: [
      { label: "API Endpoints", value: "500+" },
      { label: "Integrations", value: "500+" },
    ],
  },
];

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        background: "#1e293b",
        border: "1px solid #334155",
        borderRadius: 9999,
        padding: "2px 12px",
        fontSize: 12,
        fontWeight: 700,
        color: "#94a3b8",
        marginRight: 6,
        marginBottom: 4,
      }}
    >
      {value} {label}
    </span>
  );
}

function CategoryCard({ cat }: { cat: FeatureCategory }) {
  return (
    <div
      style={{
        background: "#0f172a",
        border: `1px solid #1e293b`,
        borderRadius: 16,
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 28 }}>{cat.icon}</span>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: cat.color,
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {cat.title}
        </h2>
      </div>
      {cat.stats && (
        <div>
          {cat.stats.map((s) => (
            <StatBadge key={s.label} label={s.label} value={s.value} />
          ))}
        </div>
      )}
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
        {cat.features.map((f) => (
          <li
            key={f}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              fontSize: 13,
              color: "#cbd5e1",
              lineHeight: 1.5,
            }}
          >
            <span style={{ color: cat.color, flexShrink: 0, marginTop: 1 }}>✓</span>
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DashboardPage() {
  const totalFeatures = CATEGORIES.reduce((acc, c) => acc + c.features.length, 0);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#f1f5f9",
        fontFamily: "system-ui, sans-serif",
        padding: "0 0 80px",
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid #1e293b",
          padding: "20px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          background: "#020617",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: "#f1f5f9", letterSpacing: -1 }}>
              ZIVO<span style={{ color: "#818cf8" }}>AI</span>
            </span>
          </a>
          <span
            style={{
              background: "#312e81",
              color: "#a5b4fc",
              borderRadius: 9999,
              padding: "2px 10px",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            ULTIMATE PLATFORM
          </span>
        </div>
        <nav style={{ display: "flex", gap: 24, fontSize: 14, fontWeight: 600, color: "#94a3b8" }}>
          <a href="/ai" style={{ color: "#94a3b8", textDecoration: "none" }}>AI Builder</a>
          <a href="/ai-login" style={{ color: "#94a3b8", textDecoration: "none" }}>Login</a>
        </nav>
      </header>

      {/* Hero stats bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 0,
          borderBottom: "1px solid #1e293b",
          background: "#0a0f1e",
        }}
      >
        {[
          { label: "Expansion Phases", value: String(CATEGORIES.length) },
          { label: "Features", value: String(totalFeatures) + "+" },
          { label: "API Endpoints", value: "500+" },
          { label: "Integrations", value: "500+" },
          { label: "Dashboards", value: "200+" },
          { label: "DB Tables", value: "300+" },
          { label: "Countries", value: "50+" },
          { label: "Verticals", value: "20+" },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              flex: "1 1 120px",
              padding: "20px 24px",
              borderRight: "1px solid #1e293b",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 900, color: "#818cf8" }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Page title */}
      <div style={{ padding: "48px 32px 24px", maxWidth: 1400, margin: "0 auto" }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0, color: "#f8fafc" }}>
          Platform Dashboard
        </h1>
        <p style={{ color: "#64748b", fontSize: 15, marginTop: 8 }}>
          All expansion phases, feature categories, and capabilities — in one place.
        </p>
      </div>

      {/* Feature grid */}
      <main
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: 20,
          maxWidth: 1400,
          margin: "0 auto",
          padding: "0 32px",
        }}
      >
        {CATEGORIES.map((cat) => (
          <CategoryCard key={cat.title} cat={cat} />
        ))}
      </main>
    </div>
  );
}
