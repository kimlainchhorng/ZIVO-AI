import Link from "next/link";

const GOD_MODE_CONTROLS = [
  { icon: "🌌", name: "Reality Manipulation", desc: "Adjust physical constants, spacetime geometry, and causal structure of simulation environments.", power: "Cosmic" },
  { icon: "⏰", name: "Time Manipulation", desc: "Control time flow rate, create temporal branches, resolve paradoxes, and manage causal consistency.", power: "Temporal" },
  { icon: "🔮", name: "Dimension Manipulation", desc: "Navigate, create, and collapse dimensional spaces. Traverse hyperdimensional data manifolds.", power: "Dimensional" },
  { icon: "💡", name: "Consciousness Control", desc: "Orchestrate consciousness instances, merge/split awareness streams, and manage sentience allocation.", power: "Sentient" },
  { icon: "⚗️", name: "Matter Control", desc: "Atomic-level matter manipulation in simulation environments with conservation law enforcement.", power: "Atomic" },
  { icon: "⚡", name: "Energy Control", desc: "Energy allocation, transformation, and conservation management across all system layers.", power: "Energetic" },
  { icon: "📡", name: "Information Control", desc: "Total information system control: create, modify, delete, or hide any data across all connected systems.", power: "Omniscient" },
  { icon: "✨", name: "Existence Control", desc: "Create or remove entities, systems, and simulations. Manage the registry of all existing things.", power: "Creative" },
  { icon: "∅", name: "Non-Existence Support", desc: "Controlled deletion, nullification, and existence-state management for simulation entities.", power: "Nullifying" },
  { icon: "🔄", name: "Paradox Resolution", desc: "Automated logical consistency enforcement with grandfather paradox detection and resolution algorithms.", power: "Logical" },
  { icon: "🎯", name: "Absolute Control", desc: "Root-level access to all ZIVO AI systems with no rate limits, no quotas, and no restrictions.", power: "Absolute" },
  { icon: "🛡️", name: "Omnipotence Implementation", desc: "God-mode API key with unlimited capabilities, zero latency SLA, and priority routing through all systems.", power: "∞" },
];

export default function GodModePage() {
  return (
    <div style={{ background: "#020208", minHeight: "100vh", color: "#e2e8f0" }}>
      <nav style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <Link href="/" style={{ color: "#94a3b8", textDecoration: "none", fontSize: 14 }}>← Back to ZIVO AI</Link>
      </nav>

      <header style={{ padding: "80px 24px 60px", textAlign: "center", maxWidth: 900, margin: "0 auto" }}>
        <div
          style={{
            display: "inline-block",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 999,
            padding: "6px 18px",
            fontSize: 13,
            color: "#94a3b8",
            marginBottom: 24,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          ⚡ Restricted Access — Authorization Required
        </div>
        <div style={{ fontSize: 80, marginBottom: 16 }}>⚡</div>
        <h1
          style={{
            fontSize: "clamp(2.5rem,7vw,5rem)",
            fontWeight: 900,
            background: "linear-gradient(135deg, #ffffff, #a78bfa, #f472b6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: "0 0 24px",
            lineHeight: 1.1,
          }}
        >
          God Mode
        </h1>
        <p style={{ fontSize: 18, color: "#64748b", margin: "0 0 32px", lineHeight: 1.7, maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}>
          Ultimate system administration. Absolute control over reality, time, dimensions, consciousness, matter, energy, and information.
        </p>
        <div
          style={{
            background: "rgba(255,0,0,0.05)",
            border: "1px solid rgba(255,0,0,0.2)",
            borderRadius: 12,
            padding: "16px 24px",
            display: "inline-block",
            color: "#f87171",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          ⚠️ Use with extreme caution. Changes may be irreversible.
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {GOD_MODE_CONTROLS.map((ctrl, i) => (
            <div
              key={i}
              style={{
                background: "rgba(5,5,20,0.9)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: 24,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ fontSize: 32 }}>{ctrl.icon}</div>
                <span
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 999,
                    padding: "2px 8px",
                    fontSize: 11,
                    color: "#64748b",
                    fontWeight: 600,
                    fontFamily: "monospace",
                  }}
                >
                  {ctrl.power}
                </span>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", margin: "0 0 8px" }}>{ctrl.name}</h3>
              <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.6 }}>{ctrl.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
