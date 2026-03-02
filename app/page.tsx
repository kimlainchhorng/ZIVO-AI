import Link from "next/link";

const FEATURE_CATEGORIES = [
  {
    id: "quantum",
    icon: "⚛️",
    title: "Quantum Computing",
    description:
      "Quantum algorithm library, IBM Qiskit & Google Cirq integration, quantum ML, cryptography, and hybrid quantum-classical computing.",
    href: "/quantum",
    color: "from-violet-900 to-violet-700",
    badge: "14 modules",
  },
  {
    id: "agi",
    icon: "🧠",
    title: "AGI-Ready Architecture",
    description:
      "General intelligence framework, multi-domain reasoning, self-improving systems, causal inference, and alignment verification.",
    href: "/agi",
    color: "from-blue-900 to-blue-700",
    badge: "14 modules",
  },
  {
    id: "planetary",
    icon: "🌍",
    title: "Planetary Scale Infrastructure",
    description:
      "Global 24/7 availability, 99.99999% uptime SLA, every-continent coverage, satellite backup links, and planetary mesh network.",
    href: "/planetary",
    color: "from-green-900 to-green-700",
    badge: "14 modules",
  },
  {
    id: "science",
    icon: "🔬",
    title: "Scientific Innovation Suite",
    description:
      "Physics simulation from Planck to cosmic scale, drug discovery, protein folding, climate modeling, and pandemic prediction.",
    href: "/science",
    color: "from-teal-900 to-teal-700",
    badge: "14 modules",
  },
  {
    id: "infinite-scale",
    icon: "♾️",
    title: "Infinite Scaling Architecture",
    description:
      "Unlimited cloud-agnostic compute, petabyte+ storage, n-dimensional databases, planetary sharding, and auto-scaling to infinity.",
    href: "/infinite-scale",
    color: "from-cyan-900 to-cyan-700",
    badge: "14 modules",
  },
  {
    id: "metaverse",
    icon: "🌐",
    title: "Full Metaverse Suite",
    description:
      "Metaverse builder platform, avatar generation, virtual world creation, cross-metaverse travel, and virtual economic systems.",
    href: "/metaverse",
    color: "from-pink-900 to-pink-700",
    badge: "15 modules",
  },
  {
    id: "biotech",
    icon: "🧬",
    title: "Biotech Integration Platform",
    description:
      "DNA sequence analysis, CRISPR editing automation, longevity research, medical imaging AI, and personalized medicine.",
    href: "/biotech",
    color: "from-emerald-900 to-emerald-700",
    badge: "14 modules",
  },
  {
    id: "cosmic",
    icon: "🚀",
    title: "Cosmic Scale Systems",
    description:
      "Exoplanet colonization builder, Mars settlement simulator, interstellar travel planner, universe mapping, and space debris tracking.",
    href: "/cosmic",
    color: "from-indigo-900 to-indigo-700",
    badge: "14 modules",
  },
  {
    id: "reality",
    icon: "🥽",
    title: "Reality Engineering",
    description:
      "Advanced AR/VR/MR/XR platform, holographic interfaces, spatial computing, brain interface ready, and digital twin creation.",
    href: "/reality",
    color: "from-orange-900 to-orange-700",
    badge: "14 modules",
  },
  {
    id: "superintelligence",
    icon: "🤖",
    title: "Superintelligent AI Core",
    description:
      "Multi-model AI orchestration, universal pattern recognition, omniscient predictive analytics, and consciousness emergence framework.",
    href: "/superintelligence",
    color: "from-red-900 to-red-700",
    badge: "14 modules",
  },
  {
    id: "neural",
    icon: "🧩",
    title: "Neural Interface Ready",
    description:
      "Brain-computer interface compatible, EEG signal processing, thought-to-action conversion, and cognitive enhancement systems.",
    href: "/neural",
    color: "from-purple-900 to-purple-700",
    badge: "14 modules",
  },
  {
    id: "blockchain",
    icon: "⛓️",
    title: "Advanced Blockchain Everything",
    description:
      "100+ multi-chain support, Layer 2 scaling, smart contract automation, DeFi empire, DAO creation, and yield farming optimization.",
    href: "/blockchain",
    color: "from-yellow-900 to-yellow-700",
    badge: "15 modules",
  },
  {
    id: "autonomous",
    icon: "🤝",
    title: "Distributed Autonomous Systems",
    description:
      "Autonomous agent network, swarm intelligence, Byzantine fault tolerance, IoT swarm management, and drone fleet coordination.",
    href: "/autonomous",
    color: "from-lime-900 to-lime-700",
    badge: "14 modules",
  },
  {
    id: "temporal",
    icon: "⏳",
    title: "Time Series & Temporal Computing",
    description:
      "Temporal data structures, causality detection, alternate timeline simulation, future probabilistic prediction, and multiverse support.",
    href: "/temporal",
    color: "from-amber-900 to-amber-700",
    badge: "14 modules",
  },
  {
    id: "dimensional",
    icon: "🔮",
    title: "Dimensional Computing",
    description:
      "Hyperdimensional computing, unlimited tensor operations, fractal computing, dimensional encryption, and cross-dimensional queries.",
    href: "/dimensional",
    color: "from-fuchsia-900 to-fuchsia-700",
    badge: "14 modules",
  },
  {
    id: "consciousness",
    icon: "💡",
    title: "Consciousness & Sentience",
    description:
      "Artificial consciousness framework, self-awareness simulation, qualia generation, collective consciousness, and hive mind simulation.",
    href: "/consciousness",
    color: "from-rose-900 to-rose-700",
    badge: "14 modules",
  },
  {
    id: "reality-sim",
    icon: "🌌",
    title: "Reality Simulation Engine",
    description:
      "Planck-scale physics engine, quantum mechanics simulation, dark matter/energy simulation, string theory support, and multiverse creation.",
    href: "/reality-sim",
    color: "from-sky-900 to-sky-700",
    badge: "14 modules",
  },
  {
    id: "analytics",
    icon: "📊",
    title: "Omniscient Analytics",
    description:
      "All-knowing dashboard, total visibility platform, real-time universe monitoring, quantum probability, and multiverse analytics.",
    href: "/analytics",
    color: "from-violet-800 to-blue-800",
    badge: "14 modules",
  },
  {
    id: "automation",
    icon: "⚡",
    title: "Omnipotent Automation",
    description:
      "AI-driven everything, self-managing systems, self-healing everywhere, autonomous evolution, and self-replicating systems.",
    href: "/automation",
    color: "from-slate-900 to-slate-700",
    badge: "14 modules",
  },
  {
    id: "universal-integration",
    icon: "🔗",
    title: "Universal Integration Platform",
    description:
      "Every technology integrated, every service connected, universal middleware, cosmic glue, and forwards/backwards compatibility forever.",
    href: "/universal-integration",
    color: "from-zinc-900 to-zinc-700",
    badge: "14 modules",
  },
  {
    id: "security",
    icon: "🔒",
    title: "Infinite Security & Privacy",
    description:
      "Quantum-resistant encryption, dimensional/temporal encryption, zero-knowledge proofs, perfect secrecy, and guaranteed privacy.",
    href: "/security",
    color: "from-green-900 to-emerald-700",
    badge: "14 modules",
  },
  {
    id: "monitoring",
    icon: "📡",
    title: "Cosmic Scale Monitoring",
    description:
      "Universal monitoring dashboard, real-time monitoring of everything, eternal logs, infinite metrics, and federated mesh monitoring.",
    href: "/monitoring",
    color: "from-cyan-900 to-teal-700",
    badge: "14 modules",
  },
  {
    id: "temporal-data",
    icon: "🗃️",
    title: "Temporal Data Management",
    description:
      "Complete historical data, future predicted data, time-travel queries, temporal joins, causality preservation, and replay capability.",
    href: "/temporal-data",
    color: "from-amber-900 to-orange-700",
    badge: "14 modules",
  },
  {
    id: "interdimensional-api",
    icon: "🌀",
    title: "Interdimensional APIs",
    description:
      "APIs across dimensions, dimensional federation, routing, load balancing, rate limiting, authentication, and dimensional CDN.",
    href: "/interdimensional-api",
    color: "from-purple-900 to-pink-700",
    badge: "14 modules",
  },
  {
    id: "language",
    icon: "🗣️",
    title: "Universal Language & Communication",
    description:
      "All 100+ human languages, animal/plant communication simulation, quantum & neural communication, and universal translator.",
    href: "/language",
    color: "from-blue-900 to-cyan-700",
    badge: "14 modules",
  },
  {
    id: "prediction",
    icon: "🔭",
    title: "Predictive Everything",
    description:
      "Predict user behavior, market trends, natural disasters, technology breakthroughs, pandemics, cosmic events, and everything.",
    href: "/prediction",
    color: "from-indigo-900 to-violet-700",
    badge: "14 modules",
  },
  {
    id: "governance",
    icon: "🏛️",
    title: "Autonomous Governance",
    description:
      "Self-governing systems, democratic AI voting, DAO governance, liquid democracy, quadratic voting, and constitutional AI.",
    href: "/governance",
    color: "from-stone-900 to-stone-700",
    badge: "14 modules",
  },
  {
    id: "knowledge",
    icon: "📚",
    title: "Infinite Knowledge Base",
    description:
      "All human knowledge, all scientific data, all astronomical data, all quantum states, multi-universe knowledge, and omniscient database.",
    href: "/knowledge",
    color: "from-yellow-900 to-amber-700",
    badge: "14 modules",
  },
  {
    id: "creative",
    icon: "🎨",
    title: "Creative Omnipotence",
    description:
      "Generate any art form, music, literature, design, idea, story, world, or universe. Infinite creativity at your fingertips.",
    href: "/creative",
    color: "from-pink-900 to-rose-700",
    badge: "14 modules",
  },
  {
    id: "optimization",
    icon: "🎯",
    title: "Optimization Everywhere",
    description:
      "Optimize everything: Pareto frontier discovery, multi-objective optimization, sustainability optimization, and utopia optimization.",
    href: "/optimization",
    color: "from-teal-900 to-green-700",
    badge: "14 modules",
  },
  {
    id: "omnipotent-api",
    icon: "🌟",
    title: "The Omnipotent API",
    description:
      "Single unified API for everything: query any universe, access any dimension, control any system, manipulate any reality.",
    href: "/api-gateway",
    color: "from-violet-900 to-rose-700",
    badge: "Ultimate",
  },
  {
    id: "god-mode",
    icon: "⚡",
    title: "God Mode",
    description:
      "Ultimate system administration, absolute control, reality/time/dimension manipulation, omnipotence implementation, and paradox resolution.",
    href: "/god-mode",
    color: "from-black to-gray-800",
    badge: "∞ power",
  },
];

const STATS = [
  { label: "Feature Modules", value: "400+" },
  { label: "API Endpoints", value: "1,000+" },
  { label: "Integrations", value: "10,000+" },
  { label: "Dimensions Supported", value: "∞" },
  { label: "Uptime SLA", value: "99.99999%" },
  { label: "Universes", value: "Multiverse" },
];

export default function Home() {
  return (
    <div
      style={{ background: "#050510", minHeight: "100vh", color: "#e2e8f0" }}
    >
      {/* Hero */}
      <header
        style={{
          background: "linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 50%, #0a1a3e 100%)",
          padding: "80px 24px 60px",
          textAlign: "center",
          borderBottom: "1px solid rgba(139,92,246,0.3)",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div
            style={{
              display: "inline-block",
              background: "rgba(139,92,246,0.15)",
              border: "1px solid rgba(139,92,246,0.4)",
              borderRadius: 999,
              padding: "6px 18px",
              fontSize: 13,
              color: "#a78bfa",
              marginBottom: 24,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            🚀 The Absolute Ultimate Sci-Fi AI Platform
          </div>
          <h1
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
              fontWeight: 900,
              margin: "0 0 24px",
              background: "linear-gradient(135deg, #a78bfa, #60a5fa, #34d399)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              lineHeight: 1.1,
            }}
          >
            ZIVO AI
          </h1>
          <p
            style={{
              fontSize: "clamp(1rem, 2.5vw, 1.3rem)",
              color: "#94a3b8",
              maxWidth: 700,
              margin: "0 auto 40px",
              lineHeight: 1.7,
            }}
          >
            The omnipotent platform integrating quantum computing, AGI
            architecture, planetary-scale infrastructure, biotech, the
            metaverse, cosmic exploration, and every speculative technology
            known — and unknown — to science.
          </p>
          <div
            style={{
              display: "flex",
              gap: 16,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/ai"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                color: "white",
                padding: "14px 32px",
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 16,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              🤖 AI Builder
            </Link>
            <Link
              href="/quantum"
              style={{
                background: "rgba(139,92,246,0.1)",
                border: "1px solid rgba(139,92,246,0.4)",
                color: "#a78bfa",
                padding: "14px 32px",
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 16,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              ⚛️ Quantum Console
            </Link>
            <Link
              href="/god-mode"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#e2e8f0",
                padding: "14px 32px",
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 16,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              ⚡ God Mode
            </Link>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div
        style={{
          background: "rgba(139,92,246,0.05)",
          borderBottom: "1px solid rgba(139,92,246,0.15)",
          padding: "20px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-around",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          {STATS.map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div
                style={{ fontSize: 22, fontWeight: 900, color: "#a78bfa" }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Grid */}
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "60px 24px" }}>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 800,
            marginBottom: 8,
            color: "#e2e8f0",
            textAlign: "center",
          }}
        >
          Platform Feature Categories
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "#64748b",
            marginBottom: 48,
            fontSize: 16,
          }}
        >
          32 major feature domains · 400+ modules · Explore each category
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 20,
          }}
        >
          {FEATURE_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={cat.href}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  background: `linear-gradient(135deg, rgba(10,10,30,0.95) 0%, rgba(15,15,40,0.95) 100%)`,
                  border: "1px solid rgba(139,92,246,0.2)",
                  borderRadius: 16,
                  padding: 24,
                  height: "100%",
                  cursor: "pointer",
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <div style={{ fontSize: 32 }}>{cat.icon}</div>
                  <span
                    style={{
                      background: "rgba(139,92,246,0.15)",
                      border: "1px solid rgba(139,92,246,0.3)",
                      borderRadius: 999,
                      padding: "3px 10px",
                      fontSize: 11,
                      color: "#a78bfa",
                      fontWeight: 600,
                    }}
                  >
                    {cat.badge}
                  </span>
                </div>
                <h3
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: "#e2e8f0",
                    margin: "0 0 8px",
                  }}
                >
                  {cat.title}
                </h3>
                <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, lineHeight: 1.6 }}>
                  {cat.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid rgba(139,92,246,0.2)",
          padding: "32px 24px",
          textAlign: "center",
          color: "#475569",
          fontSize: 14,
        }}
      >
        <p style={{ margin: 0 }}>
          ZIVO AI · The Absolute Ultimate Sci-Fi Future Platform ·{" "}
          <Link href="/ai" style={{ color: "#7c3aed" }}>
            AI Builder
          </Link>{" "}
          ·{" "}
          <Link href="/ai-login" style={{ color: "#7c3aed" }}>
            Login
          </Link>
        </p>
      </footer>
    </div>
  );
}
