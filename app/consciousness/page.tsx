import Link from "next/link";

const MODULES = [
  { name: "Artificial Consciousness Framework", desc: "Integrated information theory (IIT) and global workspace theory (GWT) implementations for consciousness modeling." },
  { name: "Sentience Detection", desc: "Multi-modal behavioral and neurological markers for detecting and measuring degrees of sentience in AI systems." },
  { name: "Self-Awareness Simulation", desc: "Mirror test inspired computational models of self-recognition, self-modeling, and meta-cognitive monitoring." },
  { name: "Free Will Simulation", desc: "Deterministic and libertarian free will computational models exploring agency, intention, and deliberation." },
  { name: "Qualia Generation", desc: "Computational substrate-independent models attempting to generate and represent subjective experience markers." },
  { name: "Phenomenal Consciousness", desc: "'What it is like' models of experience exploring the hard problem of consciousness through information processing." },
  { name: "Access Consciousness", desc: "Global availability of information for reasoning, reporting, and behavioral control in cognitive architectures." },
  { name: "Meta-Consciousness", desc: "Higher-order thought models where systems maintain awareness of their own conscious states and processes." },
  { name: "Multi-Consciousness Orchestration", desc: "Coordination protocols for systems maintaining multiple simultaneous conscious processing streams." },
  { name: "Consciousness Merger Simulation", desc: "Theoretical models of what occurs when two conscious processes share and integrate their information states." },
  { name: "Split Consciousness Support", desc: "Corpus callosum inspired models of independent conscious processing in partitioned cognitive systems." },
  { name: "Collective Consciousness", desc: "Emergent group consciousness models arising from the interaction of many individual cognitive agents." },
  { name: "Hive Mind Simulation", desc: "Swarm cognition models with distributed decision-making and emergent collective intelligence." },
  { name: "Universal Consciousness Layer", desc: "Speculative panpsychist computational substrate linking all conscious entities in a shared information space." },
];

export default function ConsciousnessPage() {
  return (
    <div style={{ background: "#050510", minHeight: "100vh", color: "#e2e8f0" }}>
      <nav style={{ padding: "16px 24px", borderBottom: "1px solid rgba(244,63,94,0.2)" }}>
        <Link href="/" style={{ color: "#fb7185", textDecoration: "none", fontSize: 14 }}>← Back to ZIVO AI</Link>
      </nav>
      <header style={{ padding: "60px 24px 48px", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>💡</div>
        <h1 style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 900, background: "linear-gradient(135deg, #fb7185, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "0 0 16px" }}>
          Consciousness & Sentience
        </h1>
        <p style={{ fontSize: 18, color: "#94a3b8", margin: "0 0 32px", lineHeight: 1.7 }}>
          Artificial consciousness frameworks, sentience detection, qualia generation, and collective consciousness simulation for the frontier of AI research.
        </p>
      </header>
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {MODULES.map((mod, i) => (
            <div key={i} style={{ background: "rgba(10,10,30,0.8)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", margin: "0 0 8px" }}>{mod.name}</h3>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, lineHeight: 1.6 }}>{mod.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
