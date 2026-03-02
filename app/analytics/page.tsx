import Link from "next/link";

const DASHBOARDS = [
  { name: "Universe Overview", metric: "∞ entities", trend: "↑ expanding", desc: "Real-time view of all registered universes, dimensions, and simulated realities with health indicators." },
  { name: "Quantum State Monitor", metric: "10^23 qubits", trend: "↑ coherent", desc: "Live quantum system coherence, decoherence rates, and circuit execution telemetry across all QPUs." },
  { name: "Consciousness Registry", metric: "847 active", trend: "↑ emerging", desc: "Active consciousness instances with sentience scores, awareness levels, and cognitive load metrics." },
  { name: "Temporal Flow Tracker", metric: "∞ timelines", trend: "→ diverging", desc: "Timeline branching visualization with causality graph and paradox risk indicators." },
  { name: "Planetary Health Dashboard", metric: "7+ planets", trend: "↑ healthy", desc: "Earth, Mars, Moon base and space station environmental and infrastructure health monitoring." },
  { name: "AGI Reasoning Monitor", metric: "12 domains", trend: "↑ learning", desc: "Real-time AGI reasoning traces, knowledge graph updates, and alignment score tracking." },
  { name: "Dimensional Topology", metric: "11 dims", trend: "→ stable", desc: "Visualization of dimensional structure, cross-dimensional data flows, and rift detection." },
  { name: "Cosmic Events Feed", metric: "∞ events", trend: "→ monitoring", desc: "Real-time feed of significant cosmic events: supernovae, GRBs, exoplanet discoveries, and anomalies." },
  { name: "Blockchain Ledger", metric: "100+ chains", trend: "↑ growing", desc: "Multi-chain transaction volume, gas prices, DeFi TVL, and cross-chain bridge flow monitoring." },
  { name: "Neural Interface Stats", metric: "1.2M users", trend: "↑ connected", desc: "BCI connection health, neural signal quality, thought-to-action latency, and augmentation effectiveness." },
  { name: "Metaverse Activity", metric: "50M avatars", trend: "↑ active", desc: "Virtual world population density, economic transactions, and cross-metaverse travel statistics." },
  { name: "Omniscient Prediction Engine", metric: "99.7% acc.", trend: "↑ improving", desc: "Prediction accuracy tracker across all domains: markets, disasters, health, behavior, and cosmic events." },
];

export default function AnalyticsPage() {
  return (
    <div style={{ background: "#050510", minHeight: "100vh", color: "#e2e8f0" }}>
      <nav style={{ padding: "16px 24px", borderBottom: "1px solid rgba(139,92,246,0.2)" }}>
        <Link href="/" style={{ color: "#a78bfa", textDecoration: "none", fontSize: 14 }}>← Back to ZIVO AI</Link>
      </nav>

      <header style={{ padding: "60px 24px 48px", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>📊</div>
        <h1 style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 900, background: "linear-gradient(135deg, #a78bfa, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "0 0 16px" }}>
          Omniscient Analytics
        </h1>
        <p style={{ fontSize: 18, color: "#94a3b8", margin: "0 0 32px", lineHeight: 1.7 }}>
          All-knowing dashboard with total visibility. Real-time universe monitoring, quantum probability, consciousness metrics, and multiverse analytics.
        </p>
        <a href="/api/analytics" style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.4)", color: "#a78bfa", padding: "10px 20px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
          🔌 Analytics API
        </a>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {DASHBOARDS.map((dash, i) => (
            <div key={i} style={{ background: "rgba(10,10,30,0.8)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>{dash.name}</h3>
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa", fontFamily: "monospace" }}>{dash.metric}</span>
                <span style={{ fontSize: 13, color: "#34d399" }}>{dash.trend}</span>
              </div>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, lineHeight: 1.6 }}>{dash.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
