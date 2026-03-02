import Link from "next/link";

const MODULES = [
  { name: "Advanced Augmented Reality", desc: "Real-time AR overlay with object recognition, spatial anchoring, and persistent AR content at millimeter precision." },
  { name: "Immersive Virtual Reality", desc: "Full-presence VR environments with photorealistic rendering, 6DOF tracking, and haptic integration." },
  { name: "Mixed Reality Integration", desc: "Seamless blending of physical and digital worlds with real-time occlusion, physics, and lighting matching." },
  { name: "Extended Reality (XR) Platform", desc: "Universal XR SDK supporting all headsets, smart glasses, and mobile AR with single codebase deployment." },
  { name: "Holographic Interface", desc: "Lightfield holographic displays with depth perception, multi-user viewing, and interactive hologram manipulation." },
  { name: "Spatial Computing", desc: "3D UI/UX framework for placing and interacting with digital content in physical space." },
  { name: "Advanced Gesture Recognition", desc: "Sub-centimeter hand and finger tracking with gesture vocabulary of 1,000+ distinct commands." },
  { name: "Eye-Tracking Interface", desc: "Foveated rendering with gaze-based interaction, attention analytics, and accessibility eye control." },
  { name: "Brain Interface Ready", desc: "BCI protocol support with signal preprocessing pipelines for EEG, ECoG, and neural implant data streams." },
  { name: "Haptic Feedback System", desc: "Full-body haptic suit integration with pressure, texture, temperature, and vibration feedback synthesis." },
  { name: "Sensory Feedback Simulation", desc: "Multi-modal sensory simulation including proprioception, vestibular, and olfactory feedback channels." },
  { name: "Reality Blending", desc: "Dynamic continuum between physical and virtual reality with programmable reality density controls." },
  { name: "Digital Twin Creation", desc: "Photogrammetric and lidar-based creation of high-fidelity digital twins of physical spaces and objects." },
  { name: "Reality Simulation Engine", desc: "Real-time physics-accurate simulation of any physical environment for training, planning, and entertainment." },
];

export default function RealityPage() {
  return (
    <div style={{ background: "#050510", minHeight: "100vh", color: "#e2e8f0" }}>
      <nav style={{ padding: "16px 24px", borderBottom: "1px solid rgba(249,115,22,0.2)" }}>
        <Link href="/" style={{ color: "#fb923c", textDecoration: "none", fontSize: 14 }}>← Back to ZIVO AI</Link>
      </nav>
      <header style={{ padding: "60px 24px 48px", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🥽</div>
        <h1 style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 900, background: "linear-gradient(135deg, #fb923c, #f472b6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "0 0 16px" }}>
          Reality Engineering
        </h1>
        <p style={{ fontSize: 18, color: "#94a3b8", margin: "0 0 32px", lineHeight: 1.7 }}>
          Advanced AR/VR/MR/XR, holographic interfaces, spatial computing, brain interface ready, and digital twin creation.
        </p>
      </header>
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {MODULES.map((mod, i) => (
            <div key={i} style={{ background: "rgba(10,10,30,0.8)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", margin: "0 0 8px" }}>{mod.name}</h3>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, lineHeight: 1.6 }}>{mod.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
