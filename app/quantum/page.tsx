import Link from "next/link";

const MODULES = [
  { name: "Quantum Algorithm Library", status: "active", desc: "Grover, Shor, Variational Quantum Eigensolver, QAOA, and 100+ pre-built quantum algorithms." },
  { name: "Quantum Circuit Designer", status: "active", desc: "Visual drag-and-drop quantum circuit builder with real-time simulation and gate composition." },
  { name: "IBM Qiskit Integration", status: "active", desc: "Direct integration with IBM Quantum hardware and Qiskit SDK for circuit compilation and execution." },
  { name: "Google Cirq Integration", status: "active", desc: "Run quantum programs on Google's quantum processors via Cirq framework integration." },
  { name: "Azure Quantum Integration", status: "active", desc: "Connect to Microsoft Azure Quantum service for multi-provider quantum execution." },
  { name: "Quantum Machine Learning", status: "active", desc: "Quantum neural networks, quantum kernel methods, and quantum-enhanced optimization for ML." },
  { name: "Quantum Cryptography", status: "active", desc: "QKD (Quantum Key Distribution), BB84 protocol, and quantum-secure communication channels." },
  { name: "Quantum Simulation Engine", status: "active", desc: "Simulate quantum systems: molecular dynamics, condensed matter, and quantum chemistry." },
  { name: "Quantum Error Correction", status: "active", desc: "Surface codes, Steane codes, and real-time syndrome measurement for fault-tolerant quantum computing." },
  { name: "Post-Quantum Encryption", status: "active", desc: "CRYSTALS-Kyber, CRYSTALS-Dilithium, and SPHINCS+ for post-quantum secure communications." },
  { name: "Quantum Advantage Detection", status: "active", desc: "Automatic benchmarking to identify problems where quantum provides computational advantage." },
  { name: "Hybrid Quantum-Classical", status: "active", desc: "VQE, QAOA, and tensor network methods for hybrid computation workloads." },
  { name: "Quantum Optimization", status: "active", desc: "Portfolio optimization, logistics routing, and scheduling via quantum optimization algorithms." },
  { name: "Quantum Annealing Support", status: "active", desc: "D-Wave integration and quantum annealing for combinatorial optimization problems." },
];

export default function QuantumPage() {
  return (
    <div style={{ background: "#050510", minHeight: "100vh", color: "#e2e8f0" }}>
      <nav style={{ padding: "16px 24px", borderBottom: "1px solid rgba(139,92,246,0.2)" }}>
        <Link href="/" style={{ color: "#a78bfa", textDecoration: "none", fontSize: 14 }}>← Back to ZIVO AI</Link>
      </nav>

      <header style={{ padding: "60px 24px 48px", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>⚛️</div>
        <h1 style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 900, background: "linear-gradient(135deg, #a78bfa, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "0 0 16px" }}>
          Quantum Computing
        </h1>
        <p style={{ fontSize: 18, color: "#94a3b8", margin: "0 0 32px", lineHeight: 1.7 }}>
          Harness the power of quantum mechanics for computation, cryptography, and optimization. Integrated with IBM Qiskit, Google Cirq, and Azure Quantum.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/api/quantum" style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.4)", color: "#a78bfa", padding: "10px 20px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
            🔌 API Reference
          </a>
          <Link href="/ai" style={{ background: "linear-gradient(135deg,#7c3aed,#2563eb)", color: "white", padding: "10px 20px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
            🤖 AI Builder
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {MODULES.map((mod, i) => (
            <div key={i} style={{ background: "rgba(10,10,30,0.8)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>{mod.name}</h3>
                <span style={{ background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 999, padding: "2px 8px", fontSize: 11, color: "#34d399", fontWeight: 600 }}>
                  {mod.status}
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
