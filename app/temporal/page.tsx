import Link from "next/link";

const MODULES = [
  { name: "Time Travel Simulation", desc: "Speculative closed timelike curve (CTC) models for visualizing temporal dynamics and causality preservation." },
  { name: "Temporal Data Structures", desc: "Bitemporal tables, valid-time and transaction-time support with efficient indexing for time-varying data." },
  { name: "Causality Detection", desc: "Granger causality, transfer entropy, and causal discovery algorithms for temporal data streams." },
  { name: "Time Loop Simulation", desc: "Grandfather paradox resolution models and consistent history simulations for closed timelike curves." },
  { name: "Alternate Timeline Simulation", desc: "Counterfactual branching simulations for policy analysis, risk assessment, and historical exploration." },
  { name: "Historical Data (Complete)", desc: "Comprehensive historical dataset repository with petabyte-scale storage and sub-millisecond query latency." },
  { name: "Future Prediction (Probabilistic)", desc: "Ensemble forecasting with uncertainty quantification and probability distribution over future states." },
  { name: "Temporal Reasoning", desc: "Allen interval algebra and temporal logic for reasoning about time-ordered events and durations." },
  { name: "Timeline Branching", desc: "Managed divergent timeline creation for scenario planning with merge and reconciliation capabilities." },
  { name: "Multiverse Support", desc: "Many-worlds interpretation models with decoherence simulation and branch probability calculations." },
  { name: "Temporal Paradox Resolution", desc: "Novikov self-consistency principle and constraint satisfaction for logically consistent time scenarios." },
  { name: "Time Manipulation Simulation", desc: "Special and general relativistic time dilation calculations for gravitational and velocity-based time effects." },
  { name: "Aging Simulation", desc: "Biological aging models integrating telomere dynamics, epigenetic clocks, and environmental factors." },
  { name: "Entropy Management", desc: "Thermodynamic entropy tracking and Maxwell's demon inspired information-theoretic entropy analysis." },
];

export default function TemporalPage() {
  return (
    <div style={{ background: "#050510", minHeight: "100vh", color: "#e2e8f0" }}>
      <nav style={{ padding: "16px 24px", borderBottom: "1px solid rgba(245,158,11,0.2)" }}>
        <Link href="/" style={{ color: "#fbbf24", textDecoration: "none", fontSize: 14 }}>← Back to ZIVO AI</Link>
      </nav>
      <header style={{ padding: "60px 24px 48px", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>⏳</div>
        <h1 style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 900, background: "linear-gradient(135deg, #fbbf24, #f87171)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "0 0 16px" }}>
          Time Series & Temporal Computing
        </h1>
        <p style={{ fontSize: 18, color: "#94a3b8", margin: "0 0 32px", lineHeight: 1.7 }}>
          Temporal data structures, causality detection, alternate timeline simulation, probabilistic future prediction, and multiverse support.
        </p>
      </header>
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {MODULES.map((mod, i) => (
            <div key={i} style={{ background: "rgba(10,10,30,0.8)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", margin: "0 0 8px" }}>{mod.name}</h3>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, lineHeight: 1.6 }}>{mod.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
