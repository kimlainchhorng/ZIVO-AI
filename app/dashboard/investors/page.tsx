import Link from "next/link";

const financialMetrics = [
  { label: "MRR", value: "$124,800", change: "+18.4%", color: "text-emerald-400" },
  { label: "ARR", value: "$1.50M", change: "+18.4%", color: "text-indigo-400" },
  { label: "MoM Growth", value: "18.4%", change: "+2.1%", color: "text-amber-400" },
  { label: "Runway", value: "28 mo", change: "—", color: "text-purple-400" },
  { label: "Burn Rate", value: "$84K/mo", change: "-$8K", color: "text-rose-400" },
  { label: "Gross Margin", value: "72%", change: "+3%", color: "text-cyan-400" },
];

const fundingRounds = [
  { round: "Pre-Seed", amount: "$350K", date: "Mar 2024", investors: "Angels + FFF", status: "Closed" },
  { round: "Seed", amount: "$2.1M", date: "Nov 2024", investors: "Catalyst Ventures, 4 angels", status: "Closed" },
  { round: "Series A", amount: "—", date: "Q3 2026 (target)", investors: "—", status: "Upcoming" },
];

const investorUpdates = [
  { title: "December 2025 Monthly Update", date: "Jan 3, 2026", highlights: "Reached $100K MRR, 520 paying customers" },
  { title: "November 2025 Monthly Update", date: "Dec 2, 2025", highlights: "Launched enterprise tier, 3 new channel partners" },
  { title: "Q4 2025 Quarterly Review", date: "Nov 5, 2025", highlights: "210% QoQ revenue growth, team expanded to 12" },
];

const capTable = [
  { stakeholder: "Founders", ownership: "68.4%", type: "Common" },
  { stakeholder: "Catalyst Ventures", ownership: "14.2%", type: "Preferred" },
  { stakeholder: "Angel Investors", ownership: "8.6%", type: "Preferred" },
  { stakeholder: "Employee Option Pool", ownership: "8.8%", type: "Options" },
];

const roundStatusColor: Record<string, string> = {
  Closed: "bg-emerald-900/40 text-emerald-400",
  Upcoming: "bg-indigo-900/40 text-indigo-400",
};

export default function InvestorsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-700 bg-gray-800/50 px-8 py-6">
        <div className="mx-auto max-w-7xl">
          <Link href="/dashboard" className="text-sm text-indigo-400 hover:text-indigo-300">← Back to Dashboard</Link>
          <h1 className="mt-1 text-3xl font-bold text-white">Investor Dashboard</h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-8 py-10 space-y-10">
        {/* Financial Metrics */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Key Financial Metrics</h2>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
            {financialMetrics.map((m) => (
              <div key={m.label} className="rounded-xl bg-gray-800 p-5">
                <p className="text-xs text-gray-400 uppercase tracking-wider">{m.label}</p>
                <p className={`mt-2 text-2xl font-bold ${m.color}`}>{m.value}</p>
                {m.change !== "—" && (
                  <p className={`mt-1 text-xs ${m.change.startsWith("+") ? "text-emerald-400" : "text-rose-400"}`}>{m.change}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* MRR Chart */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">MRR Growth</h2>
          <div className="rounded-xl bg-gray-800 p-6">
            <div className="flex items-end gap-3 h-40">
              {[18, 24, 29, 36, 44, 52, 61, 72, 83, 96, 112, 125].map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t bg-emerald-500/70 hover:bg-emerald-400 transition-colors" style={{ height: `${(v / 125) * 100}%` }} />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              {["J","F","M","A","M","J","J","A","S","O","N","D"].map((m) => (
                <span key={m} className="flex-1 text-center">{m}</span>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500 text-center">MRR ($K) — 2025</p>
          </div>
        </section>

        {/* Funding Rounds */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Funding Rounds</h2>
          <div className="overflow-x-auto rounded-xl bg-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-left text-gray-400">
                  <th className="px-6 py-4 font-medium">Round</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Investors</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {fundingRounds.map((r) => (
                  <tr key={r.round} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="px-6 py-3 font-bold text-white">{r.round}</td>
                    <td className="px-6 py-3 font-semibold text-emerald-400">{r.amount}</td>
                    <td className="px-6 py-3 text-gray-300">{r.date}</td>
                    <td className="px-6 py-3 text-gray-300">{r.investors}</td>
                    <td className="px-6 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${roundStatusColor[r.status]}`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Investor Updates */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">Investor Updates</h2>
            <div className="space-y-4">
              {investorUpdates.map((u) => (
                <div key={u.title} className="rounded-xl bg-gray-800 p-5">
                  <p className="font-semibold text-white">{u.title}</p>
                  <p className="text-xs text-indigo-400 mt-0.5">{u.date}</p>
                  <p className="mt-2 text-sm text-gray-400">{u.highlights}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Cap Table */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">Cap Table Summary</h2>
            <div className="rounded-xl bg-gray-800 p-6 space-y-4">
              {capTable.map((row) => (
                <div key={row.stakeholder}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-300">{row.stakeholder}</span>
                    <div>
                      <span className="font-semibold text-white">{row.ownership}</span>
                      <span className="ml-2 text-xs text-gray-500">{row.type}</span>
                    </div>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-700">
                    <div className="h-2.5 rounded-full bg-indigo-500" style={{ width: row.ownership }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
