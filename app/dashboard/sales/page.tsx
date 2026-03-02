import Link from "next/link";

const stages = [
  { name: "Lead", count: 84, value: "$420K", color: "bg-gray-600" },
  { name: "Qualified", count: 42, value: "$310K", color: "bg-indigo-600" },
  { name: "Proposal", count: 18, value: "$218K", color: "bg-blue-600" },
  { name: "Negotiation", count: 9, value: "$134K", color: "bg-amber-600" },
  { name: "Closed Won", count: 24, value: "$182K", color: "bg-emerald-600" },
  { name: "Closed Lost", count: 11, value: "$76K", color: "bg-rose-600" },
];

const topDeals = [
  { company: "Acme Corp", contact: "James T.", stage: "Negotiation", value: "$48,000", close: "Jan 15" },
  { company: "TechFlow Inc.", contact: "Maria S.", stage: "Proposal", value: "$36,000", close: "Jan 20" },
  { company: "DataStream Co.", contact: "Lena K.", stage: "Qualified", value: "$29,500", close: "Feb 1" },
  { company: "BuildFast Ltd.", contact: "Omar J.", stage: "Negotiation", value: "$22,000", close: "Jan 18" },
  { company: "NovaSoft", contact: "Priya R.", stage: "Proposal", value: "$18,400", close: "Jan 28" },
];

const stageColor: Record<string, string> = {
  Lead: "bg-gray-700 text-gray-300",
  Qualified: "bg-indigo-900/40 text-indigo-400",
  Proposal: "bg-blue-900/40 text-blue-400",
  Negotiation: "bg-amber-900/40 text-amber-400",
  "Closed Won": "bg-emerald-900/40 text-emerald-400",
  "Closed Lost": "bg-rose-900/40 text-rose-400",
};

export default function SalesPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-700 bg-gray-800/50 px-8 py-6">
        <div className="mx-auto max-w-7xl">
          <Link href="/dashboard" className="text-sm text-indigo-400 hover:text-indigo-300">← Back to Dashboard</Link>
          <h1 className="mt-1 text-3xl font-bold text-white">Sales Pipeline</h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-8 py-10 space-y-10">
        {/* Monthly Revenue */}
        <section>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="rounded-xl bg-gray-800 p-6">
              <p className="text-sm text-gray-400">MRR</p>
              <p className="mt-2 text-3xl font-bold text-emerald-400">$124,800</p>
              <p className="mt-1 text-xs text-emerald-500">↑ 18.4% vs last month</p>
            </div>
            <div className="rounded-xl bg-gray-800 p-6">
              <p className="text-sm text-gray-400">Pipeline Value</p>
              <p className="mt-2 text-3xl font-bold text-indigo-400">$1.36M</p>
              <p className="mt-1 text-xs text-gray-500">Across all stages</p>
            </div>
            <div className="rounded-xl bg-gray-800 p-6">
              <p className="text-sm text-gray-400">Win Rate</p>
              <p className="mt-2 text-3xl font-bold text-amber-400">68.6%</p>
              <p className="mt-1 text-xs text-emerald-500">↑ 3.2% vs last quarter</p>
            </div>
          </div>
        </section>

        {/* Pipeline Stages */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Pipeline Stages</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {stages.map((stage) => (
              <div key={stage.name} className="rounded-xl bg-gray-800 p-5 text-center">
                <div className={`mx-auto mb-3 h-2 w-16 rounded-full ${stage.color}`} />
                <p className="text-xs text-gray-400 uppercase tracking-wider">{stage.name}</p>
                <p className="mt-2 text-2xl font-bold text-white">{stage.count}</p>
                <p className="mt-1 text-sm text-gray-400">{stage.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Monthly Revenue Chart */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Monthly Revenue</h2>
          <div className="rounded-xl bg-gray-800 p-6">
            <div className="flex items-end gap-3 h-40">
              {[62, 71, 68, 84, 91, 88, 104, 112, 108, 119, 124, 131].map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-emerald-500/70 hover:bg-emerald-400 transition-colors"
                    style={{ height: `${(v / 131) * 100}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              {["J","F","M","A","M","J","J","A","S","O","N","D"].map((m) => (
                <span key={m} className="flex-1 text-center">{m}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Top Deals */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Top Deals</h2>
          <div className="overflow-x-auto rounded-xl bg-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-left text-gray-400">
                  <th className="px-6 py-4 font-medium">Company</th>
                  <th className="px-6 py-4 font-medium">Contact</th>
                  <th className="px-6 py-4 font-medium">Stage</th>
                  <th className="px-6 py-4 font-medium">Value</th>
                  <th className="px-6 py-4 font-medium">Expected Close</th>
                </tr>
              </thead>
              <tbody>
                {topDeals.map((d) => (
                  <tr key={d.company} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="px-6 py-3 font-medium text-white">{d.company}</td>
                    <td className="px-6 py-3 text-gray-300">{d.contact}</td>
                    <td className="px-6 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${stageColor[d.stage]}`}>{d.stage}</span>
                    </td>
                    <td className="px-6 py-3 font-semibold text-emerald-400">{d.value}</td>
                    <td className="px-6 py-3 text-gray-400">{d.close}</td>
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
