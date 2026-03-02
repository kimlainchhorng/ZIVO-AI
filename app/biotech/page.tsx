import Link from "next/link";

const MODULES = [
  { name: "DNA Sequence Analysis", desc: "Next-generation sequencing data analysis with variant calling, annotation, and pathogenicity prediction." },
  { name: "Gene Therapy Planning", desc: "AI-assisted gene therapy design including vector selection, target identification, and off-target risk assessment." },
  { name: "CRISPR Editing Automation", desc: "Guide RNA design, off-target prediction, delivery optimization, and outcome simulation for CRISPR-Cas9 editing." },
  { name: "Biohacking Platform", desc: "Citizen science tools for biohacking experiments with safety protocols, community sharing, and regulatory compliance." },
  { name: "Longevity Research", desc: "Aging pathway analysis, senolytic compound screening, and longevity intervention simulation." },
  { name: "Anti-Aging Optimization", desc: "Personalized anti-aging protocols based on genomics, biomarkers, and intervention efficacy data." },
  { name: "Health Tracking Integration", desc: "Integration with wearables, continuous glucose monitors, and health APIs for comprehensive biomarker monitoring." },
  { name: "Medical Imaging AI", desc: "Deep learning models for radiology, pathology, and dermatology image analysis with expert-level accuracy." },
  { name: "Pathology Analysis", desc: "Digital pathology slide analysis with cell counting, tumor grading, and biomarker quantification." },
  { name: "Genomics Database", desc: "Comprehensive multi-species genomics database with population genetics, GWAS data, and phenotype associations." },
  { name: "Personalized Medicine", desc: "Pharmacogenomics-driven drug selection and dosing recommendations based on individual genetic profiles." },
  { name: "Precision Health Recommendations", desc: "Individualized health interventions combining genomics, proteomics, metabolomics, and lifestyle data." },
  { name: "Bioprinting Support", desc: "3D bioprinting workflow management including bioink formulation, scaffold design, and cell viability optimization." },
  { name: "Organ Simulation", desc: "Digital twin organs with physiological modeling for drug testing, surgical planning, and disease progression." },
];

export default function BiotechPage() {
  return (
    <div style={{ background: "#050510", minHeight: "100vh", color: "#e2e8f0" }}>
      <nav style={{ padding: "16px 24px", borderBottom: "1px solid rgba(16,185,129,0.2)" }}>
        <Link href="/" style={{ color: "#34d399", textDecoration: "none", fontSize: 14 }}>← Back to ZIVO AI</Link>
      </nav>

      <header style={{ padding: "60px 24px 48px", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🧬</div>
        <h1 style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 900, background: "linear-gradient(135deg, #34d399, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "0 0 16px" }}>
          Biotech Integration Platform
        </h1>
        <p style={{ fontSize: 18, color: "#94a3b8", margin: "0 0 32px", lineHeight: 1.7 }}>
          From DNA sequencing to organ simulation. CRISPR automation, longevity research, medical imaging AI, and personalized medicine at your fingertips.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/api/biotech" style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", color: "#34d399", padding: "10px 20px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
            🔌 API Reference
          </a>
          <Link href="/ai" style={{ background: "linear-gradient(135deg,#059669,#2563eb)", color: "white", padding: "10px 20px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
            🤖 AI Builder
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {MODULES.map((mod, i) => (
            <div key={i} style={{ background: "rgba(10,10,30,0.8)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>{mod.name}</h3>
                <span style={{ background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 999, padding: "2px 8px", fontSize: 11, color: "#34d399", fontWeight: 600 }}>
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
