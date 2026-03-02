import Link from "next/link";

export default function Home() {
  const features = [
    { icon: "🔍", title: "Search & Discovery", desc: "Semantic search, smart recommendations, component library", href: "/dashboard?tab=search" },
    { icon: "📊", title: "Monitoring & Observability", desc: "Real-time dashboards, error tracking, Core Web Vitals", href: "/dashboard?tab=monitoring" },
    { icon: "⛓️", title: "Blockchain & Web3", desc: "Smart contracts, NFT builder, wallet integration", href: "/dashboard?tab=web3" },
    { icon: "🧪", title: "AI-Powered Testing", desc: "Jest, Cypress, Playwright, load testing automation", href: "/dashboard?tab=testing" },
    { icon: "⚡", title: "Performance & Caching", desc: "Redis, CDN, GraphQL, edge computing optimization", href: "/dashboard?tab=performance" },
    { icon: "🎤", title: "Voice & Conversational AI", desc: "Voice commands, chatbot builder, NLP integration", href: "/dashboard?tab=voice" },
    { icon: "🥽", title: "AR/VR & Immersive XR", desc: "WebXR, 3D models, VR builder, metaverse templates", href: "/dashboard?tab=xr" },
    { icon: "🤖", title: "Machine Learning", desc: "TensorFlow.js, PyTorch, model serving, RAG pipelines", href: "/dashboard?tab=ml" },
    { icon: "📝", title: "Advanced CMS", desc: "Headless CMS, content versioning, multi-channel publishing", href: "/dashboard?tab=cms" },
    { icon: "🔒", title: "Security & Compliance", desc: "OWASP scanning, SOC 2, encryption, zero-trust", href: "/dashboard?tab=security" },
    { icon: "🚀", title: "Deployment Options", desc: "Multi-cloud, Docker, Kubernetes, canary deployments", href: "/dashboard?tab=deployment" },
    { icon: "🔌", title: "API Management", desc: "API gateway, versioning, OpenAPI docs, analytics", href: "/dashboard?tab=api-management" },
    { icon: "🗄️", title: "Data Management", desc: "ETL pipelines, data warehouse, Kafka streaming", href: "/dashboard?tab=data" },
    { icon: "📈", title: "Analytics & BI", desc: "BI dashboards, predictive analytics, cohort analysis", href: "/dashboard?tab=analytics" },
    { icon: "⚙️", title: "Workflow Engine", desc: "Visual workflow builder, automation, event-driven tasks", href: "/dashboard?tab=workflow" },
    { icon: "🏗️", title: "AI App Builder", desc: "Generate complete applications with a single prompt", href: "/ai" },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black tracking-tight">ZIVO AI</span>
          <span className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded-full font-medium">ULTIMATE</span>
        </div>
        <nav className="flex gap-4 text-sm text-white/70">
          <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          <Link href="/ai" className="hover:text-white transition-colors">AI Builder</Link>
          <Link href="/ai-login" className="hover:text-white transition-colors">Login</Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="px-6 py-24 text-center max-w-4xl mx-auto">
        <h1 className="text-6xl font-black tracking-tight mb-6">
          The <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Ultimate</span> AI<br />
          Application Platform
        </h1>
        <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto">
          ZIVO AI combines every advanced feature into one comprehensive platform — from AI-powered code generation to Web3, AR/VR, ML, and beyond.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/dashboard" className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-white/90 transition-colors">
            Open Dashboard
          </Link>
          <Link href="/ai" className="px-8 py-3 border border-white/20 rounded-full hover:bg-white/10 transition-colors">
            Launch AI Builder
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 pb-24 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center text-white/80">25+ Feature Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <Link
              key={f.title}
              href={f.href}
              className="p-5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors group"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <div className="font-semibold text-sm mb-1 group-hover:text-white transition-colors">{f.title}</div>
              <div className="text-xs text-white/50">{f.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-6 text-center text-white/30 text-sm">
        ZIVO AI – Ultimate AI Application Generation Platform
      </footer>
    </div>
  );
}
