import Link from "next/link";

const quarters = [
  {
    label: "Q1 2026",
    status: "In Progress",
    features: [
      { title: "Advanced analytics v2", status: "In Progress", votes: 284 },
      { title: "SSO / SAML support", status: "In Progress", votes: 198 },
      { title: "Custom dashboard builder", status: "Planned", votes: 176 },
    ],
  },
  {
    label: "Q2 2026",
    status: "Planned",
    features: [
      { title: "Mobile app (iOS & Android)", status: "Planned", votes: 341 },
      { title: "Zapier & Make integration", status: "Planned", votes: 212 },
      { title: "Advanced permissions & roles", status: "Planned", votes: 168 },
    ],
  },
  {
    label: "Q3 2026",
    status: "Planned",
    features: [
      { title: "AI-powered recommendations", status: "Planned", votes: 392 },
      { title: "White-label option", status: "Planned", votes: 158 },
      { title: "Multi-language support", status: "Planned", votes: 134 },
    ],
  },
  {
    label: "Q4 2026",
    status: "Planned",
    features: [
      { title: "Enterprise on-premise", status: "Planned", votes: 84 },
      { title: "Advanced audit logging", status: "Planned", votes: 72 },
    ],
  },
];

const milestones = [
  { title: "Public beta launch", date: "Nov 2025", votes: 0 },
  { title: "Payment & billing system", date: "Dec 2025", votes: 0 },
  { title: "First 100 paying customers", date: "Dec 2025", votes: 0 },
  { title: "SOC 2 Type I certification", date: "Jan 2026", votes: 0 },
];

const qStatusColor: Record<string, string> = {
  "In Progress": "bg-amber-900/40 text-amber-400",
  Planned: "bg-indigo-900/40 text-indigo-400",
  Completed: "bg-emerald-900/40 text-emerald-400",
};

const featureStatusColor: Record<string, string> = {
  "In Progress": "text-amber-400",
  Planned: "text-indigo-400",
  Completed: "text-emerald-400",
};

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-700 bg-gray-800/50 px-8 py-6">
        <div className="mx-auto max-w-7xl">
          <Link href="/dashboard" className="text-sm text-indigo-400 hover:text-indigo-300">← Back to Dashboard</Link>
          <h1 className="mt-1 text-3xl font-bold text-white">Product Roadmap</h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-8 py-10 space-y-10">
        {/* Quarterly Roadmap */}
        <section>
          <h2 className="mb-6 text-xl font-semibold text-white">Quarterly Roadmap</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {quarters.map((q) => (
              <div key={q.label} className="rounded-xl bg-gray-800 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white">{q.label}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${qStatusColor[q.status]}`}>{q.status}</span>
                </div>
                <div className="space-y-3">
                  {q.features.map((f) => (
                    <div key={f.title} className="rounded-lg bg-gray-700/50 p-3">
                      <p className={`text-sm font-medium ${featureStatusColor[f.status]}`}>{f.title}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-indigo-400 text-xs">▲</span>
                        <span className="text-xs text-gray-400">{f.votes} votes</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Completed Milestones */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Completed Milestones</h2>
          <div className="space-y-3">
            {milestones.map((m) => (
              <div key={m.title} className="flex items-center gap-4 rounded-xl bg-gray-800 p-4">
                <div className="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs">✓</span>
                </div>
                <div>
                  <p className="font-medium text-white">{m.title}</p>
                  <p className="text-sm text-gray-400">{m.date}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Top Voted Features */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Top Voted Upcoming Features</h2>
          <div className="rounded-xl bg-gray-800 p-6 space-y-3">
            {[
              { title: "AI-powered recommendations", votes: 392 },
              { title: "Mobile app (iOS & Android)", votes: 341 },
              { title: "Advanced analytics v2", votes: 284 },
              { title: "Zapier & Make integration", votes: 212 },
              { title: "SSO / SAML support", votes: 198 },
            ].map((f, i) => (
              <div key={f.title} className="flex items-center gap-4">
                <span className="text-2xl font-bold text-gray-600 w-6 text-center">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">{f.title}</span>
                    <span className="text-gray-400">{f.votes} votes</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-700">
                    <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${(f.votes / 392) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
