import Link from "next/link";

const MODULES = [
  { name: "Global 24/7 Availability", desc: "Multi-region active-active deployment with zero-downtime deployments and automatic failover." },
  { name: "99.99999% Uptime SLA", desc: "Seven-nines reliability through redundant infrastructure, chaos engineering, and self-healing automation." },
  { name: "Every Continent Coverage", desc: "Points of presence on all 7 continents including Antarctica research stations for true global coverage." },
  { name: "Every Region Redundancy", desc: "N+2 redundancy in every geographic region with independent failure domains and isolated blast zones." },
  { name: "Disaster Recovery (Every Region)", desc: "RTO < 1 minute, RPO = 0 with continuous replication and automated disaster recovery runbooks." },
  { name: "Climate-Controlled Data Centers", desc: "AI-optimized cooling systems maintaining optimal temperature/humidity with 100% uptime guarantees." },
  { name: "Renewable Energy Powered", desc: "100% renewable energy sourcing with solar, wind, hydro, and on-site generation with carbon-negative operations." },
  { name: "Planetary Mesh Network", desc: "Low-latency global mesh with adaptive routing, traffic shaping, and automatic congestion avoidance." },
  { name: "Satellite Backup Links", desc: "LEO constellation backup connectivity with sub-50ms global latency and automatic terrestrial failover." },
  { name: "Submarine Cable Integration", desc: "Direct peering at major submarine cable landing stations for ultra-low latency intercontinental transit." },
  { name: "Atmospheric Distribution", desc: "High-altitude platform station (HAPS) nodes providing coverage for remote and underserved regions." },
  { name: "Ground Station Network", desc: "Global network of satellite ground stations for deep space telemetry and satellite fleet management." },
  { name: "Planetary API Gateway", desc: "Unified API entry point with global anycast routing, DDoS protection, and intelligent traffic distribution." },
  { name: "Earth Monitoring Systems", desc: "Integration with environmental sensors, seismic networks, and satellite imagery for planetary monitoring." },
];

export default function PlanetaryPage() {
  return (
    <div style={{ background: "#050510", minHeight: "100vh", color: "#e2e8f0" }}>
      <nav style={{ padding: "16px 24px", borderBottom: "1px solid rgba(34,197,94,0.2)" }}>
        <Link href="/" style={{ color: "#4ade80", textDecoration: "none", fontSize: 14 }}>← Back to ZIVO AI</Link>
      </nav>
      <header style={{ padding: "60px 24px 48px", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🌍</div>
        <h1 style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 900, background: "linear-gradient(135deg, #4ade80, #38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "0 0 16px" }}>
          Planetary Scale Infrastructure
        </h1>
        <p style={{ fontSize: 18, color: "#94a3b8", margin: "0 0 32px", lineHeight: 1.7 }}>
          Global 24/7 availability with 99.99999% uptime. Every continent, every region, powered by renewables, backed by satellites and submarine cables.
        </p>
      </header>
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {MODULES.map((mod, i) => (
            <div key={i} style={{ background: "rgba(10,10,30,0.8)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", margin: "0 0 8px" }}>{mod.name}</h3>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, lineHeight: 1.6 }}>{mod.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
