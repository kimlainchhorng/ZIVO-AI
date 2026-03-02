import Link from "next/link";

const experiments = [
  { name: "Onboarding flow v2", variant: "B", uplift: "+14.2%", status: "Running", confidence: "91%" },
  { name: "Pricing page redesign", variant: "A", uplift: "+6.8%", status: "Running", confidence: "84%" },
  { name: "Email subject line test", variant: "B", uplift: "+22.1%", status: "Completed", confidence: "99%" },
  { name: "CTA button color", variant: "A", uplift: "-1.2%", status: "Completed", confidence: "62%" },
];

const referralStats = [
  { label: "Referral Links Active", value: "842", color: "text-indigo-400" },
  { label: "Referrals Sent", value: "3,120", color: "text-emerald-400" },
  { label: "Conversions", value: "284", color: "text-amber-400" },
  { label: "Viral Coefficient (K)", value: "1.4", color: "text-purple-400" },
];

const seoRankings = [
  { keyword: "AI project management", rank: 4, change: "+2" },
  { keyword: "startup analytics tool", rank: 8, change: "+5" },
  { keyword: "team productivity AI", rank: 12, change: "-1" },
  { keyword: "SaaS growth platform", rank: 6, change: "+3" },
  { keyword: "AI business intelligence", rank: 18, change: "+7" },
];

const contentMetrics = [
  { metric: "Blog Posts Published", value: "42", trend: "↑ 8 this month" },
  { metric: "Organic Traffic", value: "48,200", trend: "↑ 18%" },
  { metric: "Avg. Time on Page", value: "4m 32s", trend: "↑ 0:24" },
  { metric: "Email Click-Through", value: "9.4%", trend: "↑ 1.2%" },
];

const statusColor: Record<string, string> = {
  Running: "bg-indigo-900/40 text-indigo-400",
  Completed: "bg-gray-700 text-gray-400",
};

export default function GrowthPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-700 bg-gray-800/50 px-8 py-6">
        <div className="mx-auto max-w-7xl">
          <Link href="/dashboard" className="text-sm text-indigo-400 hover:text-indigo-300">← Back to Dashboard</Link>
          <h1 className="mt-1 text-3xl font-bold text-white">Growth Dashboard</h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-8 py-10 space-y-10">
        {/* Referral Stats */}
        <section>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {referralStats.map((s) => (
              <div key={s.label} className="rounded-xl bg-gray-800 p-6">
                <p className="text-sm text-gray-400">{s.label}</p>
                <p className={`mt-2 text-3xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* A/B Tests */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Growth Experiments & A/B Tests</h2>
          <div className="overflow-x-auto rounded-xl bg-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-left text-gray-400">
                  <th className="px-6 py-4 font-medium">Experiment</th>
                  <th className="px-6 py-4 font-medium">Winner</th>
                  <th className="px-6 py-4 font-medium">Uplift</th>
                  <th className="px-6 py-4 font-medium">Confidence</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {experiments.map((e) => (
                  <tr key={e.name} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="px-6 py-3 font-medium text-white">{e.name}</td>
                    <td className="px-6 py-3 text-gray-300">Variant {e.variant}</td>
                    <td className={`px-6 py-3 font-semibold ${e.uplift.startsWith("+") ? "text-emerald-400" : "text-rose-400"}`}>{e.uplift}</td>
                    <td className="px-6 py-3 text-gray-300">{e.confidence}</td>
                    <td className="px-6 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor[e.status]}`}>{e.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Content Marketing */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">Content Marketing Metrics</h2>
            <div className="rounded-xl bg-gray-800 p-6 space-y-4">
              {contentMetrics.map((m) => (
                <div key={m.metric} className="flex items-center justify-between">
                  <span className="text-gray-300">{m.metric}</span>
                  <div className="text-right">
                    <span className="font-semibold text-white">{m.value}</span>
                    <p className="text-xs text-emerald-400">{m.trend}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SEO Rankings */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">SEO Rankings</h2>
            <div className="rounded-xl bg-gray-800 p-6 space-y-3">
              {seoRankings.map((r) => (
                <div key={r.keyword} className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">{r.keyword}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-white">#{r.rank}</span>
                    <span className={`text-xs font-semibold ${r.change.startsWith("+") ? "text-emerald-400" : "text-rose-400"}`}>{r.change}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Referral Program */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Referral Program Performance</h2>
          <div className="rounded-xl bg-gray-800 p-6">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-4xl font-bold text-indigo-400">1.4</p>
                <p className="mt-1 text-sm text-gray-400">Viral Coefficient (K)</p>
                <p className="mt-0.5 text-xs text-emerald-400">↑ Viral growth</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-emerald-400">9.1%</p>
                <p className="mt-1 text-sm text-gray-400">Referral Conversion Rate</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-amber-400">$18</p>
                <p className="mt-1 text-sm text-gray-400">Avg. Referral Reward</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
