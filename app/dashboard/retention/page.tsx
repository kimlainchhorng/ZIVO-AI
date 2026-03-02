import Link from "next/link";

const churnTrend = [
  { month: "Jul", rate: 4.8 },
  { month: "Aug", rate: 4.4 },
  { month: "Sep", rate: 4.1 },
  { month: "Oct", rate: 3.8 },
  { month: "Nov", rate: 3.5 },
  { month: "Dec", rate: 3.2 },
];

const cohortRetention = [
  { cohort: "Jan 2025", w1: "100%", w2: "82%", w4: "71%", m2: "64%", m3: "58%" },
  { cohort: "Feb 2025", w1: "100%", w2: "84%", w4: "73%", m2: "66%", m3: "60%" },
  { cohort: "Mar 2025", w1: "100%", w2: "85%", w4: "74%", m2: "68%", m3: "61%" },
  { cohort: "Apr 2025", w1: "100%", w2: "86%", w4: "76%", m2: "69%", m3: "—" },
  { cohort: "May 2025", w1: "100%", w2: "87%", w4: "77%", m2: "—", m3: "—" },
];

const interventions = [
  { name: "Re-engagement email series", reach: 420, opened: "38%", converted: "12%" },
  { name: "In-app feature nudges", reach: 840, opened: "62%", converted: "18%" },
  { name: "30-day check-in calls", reach: 48, opened: "100%", converted: "42%" },
];

const featureAdoption = [
  { feature: "Analytics Dashboard", adoption: 84, trend: "+6%" },
  { feature: "Team Collaboration", adoption: 62, trend: "+12%" },
  { feature: "API Integrations", adoption: 41, trend: "+18%" },
  { feature: "Custom Reports", adoption: 35, trend: "+9%" },
  { feature: "Automations", adoption: 28, trend: "+24%" },
];

export default function RetentionPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-700 bg-gray-800/50 px-8 py-6">
        <div className="mx-auto max-w-7xl">
          <Link href="/dashboard" className="text-sm text-indigo-400 hover:text-indigo-300">← Back to Dashboard</Link>
          <h1 className="mt-1 text-3xl font-bold text-white">Retention Analytics</h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-8 py-10 space-y-10">
        {/* Summary */}
        <section>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {[
              { label: "Current Churn Rate", value: "3.2%", color: "text-rose-400" },
              { label: "30-Day Retention", value: "74.8%", color: "text-emerald-400" },
              { label: "Win-back Rate", value: "18.4%", color: "text-indigo-400" },
              { label: "Avg Engagement Score", value: "7.2/10", color: "text-amber-400" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-gray-800 p-6">
                <p className="text-sm text-gray-400">{s.label}</p>
                <p className={`mt-2 text-3xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Churn Rate Trend */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Churn Rate Trend</h2>
          <div className="rounded-xl bg-gray-800 p-6">
            <div className="flex items-end gap-6 h-36">
              {churnTrend.map((d) => (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-rose-400 font-semibold">{d.rate}%</span>
                  <div
                    className="w-full rounded-t bg-rose-500/70 hover:bg-rose-400 transition-colors"
                    style={{ height: `${(d.rate / 5) * 100}%` }}
                  />
                  <span className="text-xs text-gray-400">{d.month}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cohort Retention Table */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Cohort Retention Table</h2>
          <div className="overflow-x-auto rounded-xl bg-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400">
                  <th className="px-6 py-4 text-left font-medium">Cohort</th>
                  {["Week 1", "Week 2", "Week 4", "Month 2", "Month 3"].map((h) => (
                    <th key={h} className="px-4 py-4 text-center font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohortRetention.map((row) => (
                  <tr key={row.cohort} className="border-b border-gray-700/50">
                    <td className="px-6 py-3 font-medium text-white">{row.cohort}</td>
                    {[row.w1, row.w2, row.w4, row.m2, row.m3].map((val, i) => (
                      <td
                        key={i}
                        className={`px-4 py-3 text-center text-xs font-semibold ${val === "—" ? "text-gray-600" : "text-white"}`}
                        style={val !== "—" ? { backgroundColor: `rgba(239,68,68,${(100 - parseFloat(val)) / 200})` } : {}}
                      >
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Intervention Campaigns */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Intervention Campaigns</h2>
          <div className="space-y-3">
            {interventions.map((c) => (
              <div key={c.name} className="rounded-xl bg-gray-800 p-5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-white">{c.name}</p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-gray-400">Reach: <span className="text-white font-semibold">{c.reach}</span></span>
                    <span className="text-gray-400">Opened: <span className="text-indigo-400 font-semibold">{c.opened}</span></span>
                    <span className="text-gray-400">Converted: <span className="text-emerald-400 font-semibold">{c.converted}</span></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Feature Adoption */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Feature Adoption</h2>
          <div className="rounded-xl bg-gray-800 p-6 space-y-4">
            {featureAdoption.map((f) => (
              <div key={f.feature}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-300">{f.feature}</span>
                  <div>
                    <span className="text-white font-semibold">{f.adoption}%</span>
                    <span className="ml-2 text-xs text-emerald-400">{f.trend}</span>
                  </div>
                </div>
                <div className="h-2.5 rounded-full bg-gray-700">
                  <div className="h-2.5 rounded-full bg-indigo-500" style={{ width: `${f.adoption}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
