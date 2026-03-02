import Link from "next/link";

const MODULES = [
  { name: "Exoplanet Colonization Builder", desc: "Design complete colonization missions for exoplanets including habitat, resource extraction, and population planning." },
  { name: "Mars Settlement Simulator", desc: "Full simulation of Mars settlement including life support, food production, energy generation, and population growth." },
  { name: "Moon Base Planner", desc: "Lunar surface base design with crater avoidance, solar power optimization, and regolith resource utilization." },
  { name: "Space Station Designer", desc: "Orbital station design tool with module composition, orbital mechanics, and crew capacity planning." },
  { name: "Interstellar Travel Planner", desc: "Route planning for interstellar missions using relativistic mechanics, fuel calculations, and journey time estimation." },
  { name: "Alien Contact Protocol (Hypothetical)", desc: "Speculative communication protocols based on mathematical/physical universal constants and SETI signal analysis." },
  { name: "Space Exploration Automation", desc: "Autonomous rover and probe mission planning with AI-driven obstacle avoidance and science target selection." },
  { name: "Universe Mapping Engine", desc: "3D interactive map of known and modeled universe with star systems, galaxy clusters, and void regions." },
  { name: "Stellar Navigation", desc: "Precise stellar cartography for navigation using pulsar timing, parallax, and gravitational reference frames." },
  { name: "Cosmic Ray Protection", desc: "Shielding design tools and real-time cosmic ray flux monitoring for spacecraft and space habitats." },
  { name: "Space Debris Tracking", desc: "Real-time orbital debris catalog with conjunction analysis, collision probability, and avoidance maneuver planning." },
  { name: "Satellite Management", desc: "Fleet management for satellite constellations with telemetry, station-keeping, and deorbit planning." },
  { name: "Space Elevator Support", desc: "Engineering design and operational planning for equatorial space elevator tether systems." },
  { name: "Intergalactic Infrastructure", desc: "Speculative engineering models for megastructures, Dyson spheres, and intergalactic communication arrays." },
];

export default function CosmicPage() {
  return (
    <div style={{ background: "#050510", minHeight: "100vh", color: "#e2e8f0" }}>
      <nav style={{ padding: "16px 24px", borderBottom: "1px solid rgba(99,102,241,0.2)" }}>
        <Link href="/" style={{ color: "#818cf8", textDecoration: "none", fontSize: 14 }}>← Back to ZIVO AI</Link>
      </nav>

      <header style={{ padding: "60px 24px 48px", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🚀</div>
        <h1 style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 900, background: "linear-gradient(135deg, #818cf8, #38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "0 0 16px" }}>
          Cosmic Scale Systems
        </h1>
        <p style={{ fontSize: 18, color: "#94a3b8", margin: "0 0 32px", lineHeight: 1.7 }}>
          From Mars settlements to interstellar travel planning. Design space habitats, track debris, map the universe, and plan humanity&apos;s expansion into the cosmos.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/api/cosmic" style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.4)", color: "#818cf8", padding: "10px 20px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
            🔌 API Reference
          </a>
          <Link href="/ai" style={{ background: "linear-gradient(135deg,#4f46e5,#0284c7)", color: "white", padding: "10px 20px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
            🤖 AI Builder
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {MODULES.map((mod, i) => (
            <div key={i} style={{ background: "rgba(10,10,30,0.8)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>{mod.name}</h3>
                <span style={{ background: "rgba(129,140,248,0.15)", border: "1px solid rgba(129,140,248,0.3)", borderRadius: 999, padding: "2px 8px", fontSize: 11, color: "#818cf8", fontWeight: 600 }}>
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
