import Link from "next/link";

const healthScores = [
  { range: "90–100 (Healthy)", count: 284, pct: 48, color: "bg-emerald-500" },
  { range: "70–89 (Good)", count: 196, pct: 33, color: "bg-amber-500" },
  { range: "50–69 (At Risk)", count: 84, pct: 14, color: "bg-orange-500" },
  { range: "0–49 (Critical)", count: 30, pct: 5, color: "bg-rose-500" },
];

const atRiskCustomers = [
  { company: "Nexus Corp", score: 42, lastLogin: "18 days ago", plan: "Pro", mrr: "$299" },
  { company: "Orbit Systems", score: 48, lastLogin: "12 days ago", plan: "Business", mrr: "$599" },
  { company: "Apex Digital", score: 51, lastLogin: "8 days ago", plan: "Pro", mrr: "$299" },
];

const npsData = [
  { month: "Aug", score: 42 },
  { month: "Sep", score: 46 },
  { month: "Oct", score: 48 },
  { month: "Nov", score: 51 },
  { month: "Dec", score: 54 },
  { month: "Jan", score: 57 },
];

const renewals = [
  { company: "CloudFirst Inc.", mrr: "$1,200", date: "Jan 15", probability: "High" },
  { company: "DataStream Co.", mrr: "$840", date: "Jan 22", probability: "Medium" },
  { company: "PixelForge", mrr: "$299", date: "Feb 1", probability: "Low" },
];

const probColor: Record<string, string> = {
  High: "text-emerald-400",
  Medium: "text-amber-400",
  Low: "text-rose-400",
};

export default function CustomerSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-700 bg-gray-800/50 px-8 py-6">
        <div className="mx-auto max-w-7xl">
          <Link href="/dashboard" className="text-sm text-indigo-400 hover:text-indigo-300">← Back to Dashboard</Link>
          <h1 className="mt-1 text-3xl font-bold text-white">Customer Success</h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-8 py-10 space-y-10">
        {/* Summary Stats */}
        <section>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {[
              { label: "Total Customers", value: "594", color: "text-indigo-400" },
              { label: "NPS Score", value: "57", color: "text-emerald-400" },
              { label: "Onboarding Complete", value: "84%", color: "text-amber-400" },
              { label: "Upsell Opportunities", value: "38", color: "text-purple-400" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-gray-800 p-6">
                <p className="text-sm text-gray-400">{s.label}</p>
                <p className={`mt-2 text-3xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Health Score Distribution */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Health Score Distribution</h2>
          <div className="rounded-xl bg-gray-800 p-6 space-y-4">
            {healthScores.map((h) => (
              <div key={h.range}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-300">{h.range}</span>
                  <span className="text-gray-400">{h.count} customers ({h.pct}%)</span>
                </div>
                <div className="h-3 rounded-full bg-gray-700">
                  <div className={`h-3 rounded-full ${h.color}`} style={{ width: `${h.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* NPS Trend */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">NPS Trend</h2>
            <div className="rounded-xl bg-gray-800 p-6">
              <div className="flex items-end gap-4 h-36">
                {npsData.map((d) => (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-indigo-400 font-semibold">{d.score}</span>
                    <div
                      className="w-full rounded-t bg-indigo-500/70"
                      style={{ height: `${(d.score / 70) * 100}%` }}
                    />
                    <span className="text-xs text-gray-400">{d.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* At-Risk Customers */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">At-Risk Customers</h2>
            <div className="rounded-xl bg-gray-800 p-6 space-y-4">
              {atRiskCustomers.map((c) => (
                <div key={c.company} className="flex items-center justify-between border-b border-gray-700/50 pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-semibold text-white">{c.company}</p>
                    <p className="text-xs text-gray-400">{c.plan} · {c.mrr}/mo · Last login {c.lastLogin}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-rose-400">{c.score}</span>
                    <p className="text-xs text-gray-500">Health score</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Renewal Calendar */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Renewal Calendar</h2>
          <div className="overflow-x-auto rounded-xl bg-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-left text-gray-400">
                  <th className="px-6 py-4 font-medium">Company</th>
                  <th className="px-6 py-4 font-medium">MRR</th>
                  <th className="px-6 py-4 font-medium">Renewal Date</th>
                  <th className="px-6 py-4 font-medium">Probability</th>
                </tr>
              </thead>
              <tbody>
                {renewals.map((r) => (
                  <tr key={r.company} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="px-6 py-3 font-medium text-white">{r.company}</td>
                    <td className="px-6 py-3 text-emerald-400 font-semibold">{r.mrr}</td>
                    <td className="px-6 py-3 text-gray-300">{r.date}</td>
                    <td className={`px-6 py-3 font-semibold ${probColor[r.probability]}`}>{r.probability}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
