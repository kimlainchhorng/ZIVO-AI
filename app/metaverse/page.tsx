import Link from "next/link";

const MODULES = [
  { name: "Metaverse Builder Platform", desc: "Drag-and-drop world creation tools with physics simulation, environmental design, and procedural generation." },
  { name: "Avatar Generation Engine", desc: "AI-powered 3D avatar creation from photos, text descriptions, or procedural generation with full customization." },
  { name: "Avatar Personality Systems", desc: "Behavioral AI models that give avatars unique personalities, speech patterns, emotional responses, and memories." },
  { name: "Virtual World Creation", desc: "Scalable persistent virtual environments with realistic physics, dynamic weather, and ecosystem simulation." },
  { name: "Persistent World Storage", desc: "Distributed state management for maintaining world state across sessions with eventual consistency guarantees." },
  { name: "Cross-Metaverse Travel", desc: "Universal identity and asset portability protocols enabling seamless movement between different metaverse platforms." },
  { name: "Avatar Commerce System", desc: "P2P marketplace for avatar customizations, skills, experiences, and digital goods with escrow protection." },
  { name: "Virtual Real Estate", desc: "Blockchain-backed virtual land ownership with zoning, development rights, and revenue sharing mechanisms." },
  { name: "Digital Assets Marketplace", desc: "NFT-powered marketplace for all digital assets with provenance tracking, royalty automation, and fraud prevention." },
  { name: "Avatar Authentication", desc: "Multi-factor biometric and cryptographic authentication for secure avatar identity verification." },
  { name: "Identity Management", desc: "Decentralized identity (DID) system for cross-platform avatar identity with privacy controls." },
  { name: "Social Networking (Metaverse)", desc: "Spatial social graph enabling proximity-based connections, group formation, and community building in 3D space." },
  { name: "Event Hosting (Metaverse)", desc: "Infrastructure for hosting virtual concerts, conferences, sporting events, and experiences for millions simultaneously." },
  { name: "Economic Systems (Virtual)", desc: "Complete virtual economy with supply/demand dynamics, monetary policy, taxation, and wealth distribution." },
  { name: "Currency Support (Multiple Virtual)", desc: "Support for 100+ virtual currencies with inter-currency exchange, liquidity pools, and stable coin options." },
];

export default function MetaversePage() {
  return (
    <div style={{ background: "#050510", minHeight: "100vh", color: "#e2e8f0" }}>
      <nav style={{ padding: "16px 24px", borderBottom: "1px solid rgba(236,72,153,0.2)" }}>
        <Link href="/" style={{ color: "#f472b6", textDecoration: "none", fontSize: 14 }}>← Back to ZIVO AI</Link>
      </nav>

      <header style={{ padding: "60px 24px 48px", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🌐</div>
        <h1 style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 900, background: "linear-gradient(135deg, #f472b6, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "0 0 16px" }}>
          Full Metaverse Suite
        </h1>
        <p style={{ fontSize: 18, color: "#94a3b8", margin: "0 0 32px", lineHeight: 1.7 }}>
          Build, deploy, and monetize immersive virtual worlds. Complete platform for avatar creation, virtual economies, cross-metaverse travel, and social experiences.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/api/metaverse" style={{ background: "rgba(236,72,153,0.15)", border: "1px solid rgba(236,72,153,0.4)", color: "#f472b6", padding: "10px 20px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
            🔌 API Reference
          </a>
          <Link href="/ai" style={{ background: "linear-gradient(135deg,#db2777,#9333ea)", color: "white", padding: "10px 20px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
            🤖 AI Builder
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {MODULES.map((mod, i) => (
            <div key={i} style={{ background: "rgba(10,10,30,0.8)", border: "1px solid rgba(236,72,153,0.2)", borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>{mod.name}</h3>
                <span style={{ background: "rgba(244,114,182,0.15)", border: "1px solid rgba(244,114,182,0.3)", borderRadius: 999, padding: "2px 8px", fontSize: 11, color: "#f472b6", fontWeight: 600 }}>
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
