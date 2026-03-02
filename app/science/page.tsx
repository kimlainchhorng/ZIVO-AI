import Link from "next/link";

const MODULES = [
  { name: "Physics Simulation Engine", desc: "Multi-scale physics from Planck length to cosmic distances, including quantum, relativistic, and classical regimes." },
  { name: "Drug Discovery Automation", desc: "AI-driven molecular screening, lead optimization, ADMET prediction, and clinical trial design." },
  { name: "Protein Folding Prediction", desc: "AlphaFold-integrated pipeline for structure prediction, docking simulation, and drug target identification." },
  { name: "Molecular Dynamics Simulation", desc: "Large-scale MD simulations of biomolecular systems with GPU-accelerated force field calculations." },
  { name: "Climate Modeling Engine", desc: "High-resolution climate models with ocean-atmosphere coupling, carbon cycle modeling, and scenario analysis." },
  { name: "Weather Prediction", desc: "Ensemble weather forecasting with AI-enhanced numerical weather prediction and nowcasting." },
  { name: "Earthquake Forecasting", desc: "Seismic network analysis with machine learning for aftershock sequence modeling and rupture prediction." },
  { name: "Tsunami Detection", desc: "Real-time deep-ocean pressure sensor analysis with early warning system and evacuation route optimization." },
  { name: "Hurricane Tracking", desc: "Intensity forecasting, track prediction, and storm surge modeling with real-time satellite data integration." },
  { name: "Pandemic Modeling", desc: "Compartmental and agent-based epidemic models with genomic surveillance and intervention scenario planning." },
  { name: "Genetic Sequencing", desc: "Automated sequencing pipeline from raw reads to variant annotation with clinical reporting." },
  { name: "CRISPR Automation", desc: "End-to-end CRISPR screening automation including library design, data analysis, and hit identification." },
  { name: "Biomedical Research AI", desc: "Literature mining, hypothesis generation, and experimental design assistance for biomedical researchers." },
  { name: "Lab Automation Integration", desc: "Robotic liquid handling, plate reader, and analytical instrument integration for automated experiments." },
];

export default function SciencePage() {
  return (
    <div style={{ background: "#050510", minHeight: "100vh", color: "#e2e8f0" }}>
      <nav style={{ padding: "16px 24px", borderBottom: "1px solid rgba(20,184,166,0.2)" }}>
        <Link href="/" style={{ color: "#2dd4bf", textDecoration: "none", fontSize: 14 }}>← Back to ZIVO AI</Link>
      </nav>
      <header style={{ padding: "60px 24px 48px", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔬</div>
        <h1 style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 900, background: "linear-gradient(135deg, #2dd4bf, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "0 0 16px" }}>
          Scientific Innovation Suite
        </h1>
        <p style={{ fontSize: 18, color: "#94a3b8", margin: "0 0 32px", lineHeight: 1.7 }}>
          Physics simulations from Planck scale to cosmic distances, drug discovery, protein folding, climate modeling, and pandemic prediction.
        </p>
      </header>
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {MODULES.map((mod, i) => (
            <div key={i} style={{ background: "rgba(10,10,30,0.8)", border: "1px solid rgba(20,184,166,0.2)", borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", margin: "0 0 8px" }}>{mod.name}</h3>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, lineHeight: 1.6 }}>{mod.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
