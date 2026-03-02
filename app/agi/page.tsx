import Link from "next/link";

const MODULES = [
  { name: "General Intelligence Framework", desc: "Multi-domain AGI core enabling reasoning across mathematics, science, language, arts, and engineering." },
  { name: "Multi-Domain Reasoning", desc: "Cross-domain inference engine that connects knowledge from disparate fields to solve complex problems." },
  { name: "Self-Improving Systems", desc: "Autonomous code generation and model fine-tuning loops that improve system performance over time." },
  { name: "Emergent Behavior Detection", desc: "Monitoring and analysis of unexpected emergent capabilities arising from complex system interactions." },
  { name: "Consciousness Simulation Framework", desc: "Computational models of awareness, self-reflection, and metacognition for AGI research." },
  { name: "Theory of Mind Models", desc: "AI systems that model other agents' beliefs, goals, and intentions for social reasoning." },
  { name: "Common Sense Reasoning", desc: "Large-scale common sense knowledge base with probabilistic inference for everyday reasoning." },
  { name: "Symbolic Reasoning Engine", desc: "Hybrid neurosymbolic architecture combining neural networks with first-order logic and theorem proving." },
  { name: "Causal Inference Models", desc: "Structural causal models, do-calculus, and counterfactual reasoning for understanding cause-effect." },
  { name: "Transfer Learning Across Domains", desc: "Zero-shot and few-shot generalization across domains using foundation models and meta-learning." },
  { name: "Meta-Learning Systems", desc: "Learning-to-learn architectures that rapidly adapt to new tasks with minimal examples." },
  { name: "Recursive Self-Improvement", desc: "Safe recursive improvement loops with formal verification and capability containment protocols." },
  { name: "AGI Safety Framework", desc: "Constitutional AI, RLHF, and formal verification methods for safe AGI development and deployment." },
  { name: "Alignment Verification", desc: "Automated tools for verifying that AGI systems remain aligned with human values and intentions." },
];

export default function AGIPage() {
  return (
    <div style={{ background: "#050510", minHeight: "100vh", color: "#e2e8f0" }}>
      <nav style={{ padding: "16px 24px", borderBottom: "1px solid rgba(96,165,250,0.2)" }}>
        <Link href="/" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 14 }}>← Back to ZIVO AI</Link>
      </nav>

      <header style={{ padding: "60px 24px 48px", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🧠</div>
        <h1 style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 900, background: "linear-gradient(135deg, #60a5fa, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "0 0 16px" }}>
          AGI-Ready Architecture
        </h1>
        <p style={{ fontSize: 18, color: "#94a3b8", margin: "0 0 32px", lineHeight: 1.7 }}>
          The foundation for Artificial General Intelligence. Multi-domain reasoning, self-improving systems, causal inference, and alignment-first safety framework.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/api/agi" style={{ background: "rgba(96,165,250,0.15)", border: "1px solid rgba(96,165,250,0.4)", color: "#60a5fa", padding: "10px 20px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
            🔌 API Reference
          </a>
          <Link href="/ai" style={{ background: "linear-gradient(135deg,#2563eb,#7c3aed)", color: "white", padding: "10px 20px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
            🤖 AI Builder
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {MODULES.map((mod, i) => (
            <div key={i} style={{ background: "rgba(10,10,30,0.8)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>{mod.name}</h3>
                <span style={{ background: "rgba(96,165,250,0.15)", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 999, padding: "2px 8px", fontSize: 11, color: "#60a5fa", fontWeight: 600 }}>
                  active
                </span>
              </div>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, lineHeight: 1.6 }}>{mod.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
