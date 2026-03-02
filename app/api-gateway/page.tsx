import Link from "next/link";

const CAPABILITIES = [
  { icon: "🌌", name: "Query Any Universe", desc: "Access data and execute operations across simulated and modeled universes in the multiverse registry." },
  { icon: "🔮", name: "Access Any Dimension", desc: "Navigate hyperdimensional data spaces and execute cross-dimensional queries through unified API calls." },
  { icon: "⚙️", name: "Control Any System", desc: "Universal system control plane with adapters for every known computing paradigm and protocol." },
  { icon: "🎭", name: "Manipulate Any Reality", desc: "Reality parameter adjustment APIs for simulation environments with physics constant configuration." },
  { icon: "📚", name: "Access Any Information", desc: "Universal information retrieval spanning all indexed knowledge bases, databases, and data streams." },
  { icon: "⚡", name: "Execute Any Command", desc: "Polyglot command execution across quantum, classical, neuromorphic, and analog computing substrates." },
  { icon: "✨", name: "Create Any Object", desc: "Digital and simulated object instantiation with arbitrary properties, behaviors, and existence rules." },
  { icon: "💫", name: "Modify Any Law of Physics", desc: "Simulation physics engine with configurable constants, force laws, and dimensional topology." },
];

const ENDPOINT_GROUPS = [
  { group: "Quantum APIs", count: "100+", endpoints: ["POST /quantum/circuit/run", "GET /quantum/algorithms", "POST /quantum/optimize", "POST /quantum/ml/train"] },
  { group: "AGI APIs", count: "100+", endpoints: ["POST /agi/reason", "POST /agi/causal-infer", "GET /agi/knowledge-graph", "POST /agi/meta-learn"] },
  { group: "Cosmic APIs", count: "100+", endpoints: ["GET /cosmic/universe-map", "POST /cosmic/settlement/plan", "GET /cosmic/debris-track", "POST /cosmic/navigate"] },
  { group: "Reality APIs", count: "100+", endpoints: ["POST /reality/ar/overlay", "POST /reality/twin/create", "POST /reality/hologram/render", "GET /reality/bci/stream"] },
  { group: "Biotech APIs", count: "100+", endpoints: ["POST /biotech/dna/analyze", "POST /biotech/crispr/design", "POST /biotech/protein/fold", "GET /biotech/drug/screen"] },
  { group: "Consciousness APIs", count: "100+", endpoints: ["GET /consciousness/state", "POST /consciousness/simulate", "GET /consciousness/sentience-score", "POST /consciousness/merge"] },
  { group: "Time APIs", count: "100+", endpoints: ["POST /time/timeline/branch", "GET /time/predict", "POST /time/causality/detect", "GET /time/historical"] },
  { group: "Universal APIs", count: "400+", endpoints: ["POST /universal/optimize", "POST /universal/translate", "GET /universal/knowledge", "POST /universal/create"] },
];

export default function APIGatewayPage() {
  return (
    <div style={{ background: "#050510", minHeight: "100vh", color: "#e2e8f0" }}>
      <nav style={{ padding: "16px 24px", borderBottom: "1px solid rgba(139,92,246,0.2)" }}>
        <Link href="/" style={{ color: "#a78bfa", textDecoration: "none", fontSize: 14 }}>← Back to ZIVO AI</Link>
      </nav>

      <header style={{ padding: "60px 24px 48px", textAlign: "center", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🌟</div>
        <h1 style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 900, background: "linear-gradient(135deg, #a78bfa, #f472b6, #fbbf24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "0 0 16px" }}>
          The Omnipotent API
        </h1>
        <p style={{ fontSize: 18, color: "#94a3b8", margin: "0 0 16px", lineHeight: 1.7 }}>
          Single unified API gateway for everything. Query any universe, access any dimension, control any system, manipulate any reality.
        </p>
        <div style={{ display: "inline-block", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 8, padding: "8px 16px", fontSize: 13, color: "#a78bfa", fontFamily: "monospace", marginBottom: 32 }}>
          Base URL: https://api.zivo.ai/v1
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        {/* Capabilities */}
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#e2e8f0", marginBottom: 24 }}>Core Capabilities</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginBottom: 60 }}>
          {CAPABILITIES.map((cap, i) => (
            <div key={i} style={{ background: "rgba(10,10,30,0.8)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{cap.icon}</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", margin: "0 0 6px" }}>{cap.name}</h3>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, lineHeight: 1.6 }}>{cap.desc}</p>
            </div>
          ))}
        </div>

        {/* Endpoint Groups */}
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#e2e8f0", marginBottom: 24 }}>API Endpoint Groups</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {ENDPOINT_GROUPS.map((group, i) => (
            <div key={i} style={{ background: "rgba(10,10,30,0.8)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>{group.group}</h3>
                <span style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 999, padding: "2px 8px", fontSize: 11, color: "#a78bfa", fontWeight: 600 }}>
                  {group.count}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {group.endpoints.map((ep, j) => (
                  <code key={j} style={{ fontSize: 12, color: "#34d399", background: "rgba(52,211,153,0.08)", padding: "4px 8px", borderRadius: 4, display: "block" }}>
                    {ep}
                  </code>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
