import Link from "next/link";

const MODULES = [
  { name: "Brain-Computer Interface Compatible", desc: "Standard BCI protocol support for Neuralink, OpenBCI, and custom neural interface hardware." },
  { name: "EEG Signal Processing", desc: "Real-time EEG artifact removal, source localization, and cognitive state classification from brainwave data." },
  { name: "fMRI Integration", desc: "BOLD signal processing pipeline with activation mapping, connectivity analysis, and mental state decoding." },
  { name: "Neural Implant Simulation", desc: "Biophysically accurate models of implanted electrode arrays and neural tissue interaction." },
  { name: "Thought-to-Action Conversion", desc: "Motor imagery classification and continuous cursor/device control from imagined movement neural signals." },
  { name: "Mind Reading (Simulation)", desc: "Semantic content reconstruction from neural activation patterns using neural encoding/decoding models." },
  { name: "Neural Augmentation Support", desc: "Closed-loop neurostimulation protocols for targeted cognitive enhancement and skill acquisition." },
  { name: "Cognitive Enhancement", desc: "tDCS, TMS, and neurofeedback protocol design for attention, memory, and executive function improvement." },
  { name: "Memory Augmentation", desc: "Hippocampal prosthetic models and memory encoding enhancement through precisely timed neural stimulation." },
  { name: "Attention Enhancement", desc: "Real-time attention state monitoring with adaptive environment control and neurofeedback training." },
  { name: "Processing Speed Boost", desc: "Neural pathway optimization models and brain-computer synergy for enhanced information processing." },
  { name: "Telepathy Simulation", desc: "Brain-to-brain communication via shared neural encoding spaces and BCI-mediated semantic transfer." },
  { name: "Neural Network (Literal)", desc: "Biological neural network modeling with compartmental neurons, synaptic plasticity, and network dynamics." },
  { name: "Brain-Cloud Sync", desc: "Secure neural data upload, storage, and retrieval for continuous cognitive state preservation." },
];

export default function NeuralPage() {
  return (
    <div style={{ background: "#050510", minHeight: "100vh", color: "#e2e8f0" }}>
      <nav style={{ padding: "16px 24px", borderBottom: "1px solid rgba(168,85,247,0.2)" }}>
        <Link href="/" style={{ color: "#c084fc", textDecoration: "none", fontSize: 14 }}>← Back to ZIVO AI</Link>
      </nav>
      <header style={{ padding: "60px 24px 48px", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🧩</div>
        <h1 style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 900, background: "linear-gradient(135deg, #c084fc, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "0 0 16px" }}>
          Neural Interface Ready
        </h1>
        <p style={{ fontSize: 18, color: "#94a3b8", margin: "0 0 32px", lineHeight: 1.7 }}>
          Brain-computer interface compatible, EEG/fMRI processing, thought-to-action conversion, cognitive enhancement, and brain-cloud synchronization.
        </p>
      </header>
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {MODULES.map((mod, i) => (
            <div key={i} style={{ background: "rgba(10,10,30,0.8)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", margin: "0 0 8px" }}>{mod.name}</h3>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, lineHeight: 1.6 }}>{mod.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
