import Link from "next/link";

const stats = [
  { label: "Total Campaigns", value: "24", change: "+3 this month", color: "text-indigo-400" },
  { label: "Total Reach", value: "1.2M", change: "+18% vs last month", color: "text-emerald-400" },
  { label: "Active Campaigns", value: "7", change: "3 ending this week", color: "text-amber-400" },
  { label: "Scheduled", value: "11", change: "Next: Tomorrow 9 AM", color: "text-rose-400" },
];

const socialStats = [
  { platform: "Twitter / X", followers: "8,420", growth: "+340", engagement: "4.2%" },
  { platform: "LinkedIn", followers: "5,110", growth: "+210", engagement: "6.8%" },
  { platform: "Instagram", followers: "3,880", growth: "+95", engagement: "3.1%" },
  { platform: "YouTube", followers: "1,230", growth: "+60", engagement: "7.4%" },
];

const seoMetrics = [
  { metric: "Organic Sessions", value: "42,300", trend: "↑ 12%" },
  { metric: "Indexed Pages", value: "318", trend: "↑ 22" },
  { metric: "Avg. Position", value: "14.3", trend: "↓ 2.1" },
  { metric: "Backlinks", value: "2,840", trend: "↑ 140" },
];

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-700 bg-gray-800/50 px-8 py-6">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="text-sm text-indigo-400 hover:text-indigo-300">← Back to Dashboard</Link>
            <h1 className="mt-1 text-3xl font-bold text-white">Marketing Dashboard</h1>
          </div>
          <button className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors">
            + Create Campaign
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-8 py-10 space-y-10">
        {/* Campaign Overview */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Campaign Overview</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl bg-gray-800 p-6">
                <p className="text-sm text-gray-400">{s.label}</p>
                <p className={`mt-2 text-3xl font-bold ${s.color}`}>{s.value}</p>
                <p className="mt-1 text-xs text-gray-500">{s.change}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Social Media Content Calendar */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Social Media Content Calendar</h2>
          <div className="rounded-xl bg-gray-800 p-6">
            <div className="grid grid-cols-7 gap-2 text-center text-xs text-gray-400 mb-3">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="font-semibold">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 28 }, (_, i) => {
                const day = i + 1;
                const hasPost = [1, 3, 5, 8, 10, 12, 15, 17, 19, 22, 24, 26].includes(day);
                return (
                  <div
                    key={day}
                    className={`rounded-lg p-2 text-center text-sm ${hasPost ? "bg-indigo-900/50 text-indigo-300 font-semibold" : "bg-gray-700/30 text-gray-500"}`}
                  >
                    {day}
                    {hasPost && <div className="mt-1 h-1 w-1 rounded-full bg-indigo-400 mx-auto" />}
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-gray-500">● Scheduled posts highlighted</p>
          </div>
        </section>

        {/* SEO Metrics & Newsletter */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">SEO Metrics</h2>
            <div className="rounded-xl bg-gray-800 p-6 space-y-4">
              {seoMetrics.map((m) => (
                <div key={m.metric} className="flex items-center justify-between">
                  <span className="text-gray-300">{m.metric}</span>
                  <div className="text-right">
                    <span className="text-white font-semibold">{m.value}</span>
                    <span className={`ml-2 text-xs ${m.trend.startsWith("↑") ? "text-emerald-400" : "text-rose-400"}`}>{m.trend}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">Newsletter Stats</h2>
            <div className="rounded-xl bg-gray-800 p-6 space-y-4">
              {[
                { label: "Total Subscribers", value: "14,820", color: "text-indigo-400" },
                { label: "Open Rate", value: "38.4%", color: "text-emerald-400" },
                { label: "Click-Through Rate", value: "9.1%", color: "text-amber-400" },
                { label: "Unsubscribe Rate", value: "0.4%", color: "text-rose-400" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-gray-300">{item.label}</span>
                  <span className={`font-semibold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Social Media Stats */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Social Media Stats</h2>
          <div className="overflow-x-auto rounded-xl bg-gray-800">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700 text-left text-sm text-gray-400">
                  <th className="px-6 py-4 font-medium">Platform</th>
                  <th className="px-6 py-4 font-medium">Followers</th>
                  <th className="px-6 py-4 font-medium">Growth</th>
                  <th className="px-6 py-4 font-medium">Engagement Rate</th>
                </tr>
              </thead>
              <tbody>
                {socialStats.map((row, i) => (
                  <tr key={row.platform} className={i % 2 === 0 ? "bg-gray-800" : "bg-gray-750"}>
                    <td className="px-6 py-4 font-medium text-white">{row.platform}</td>
                    <td className="px-6 py-4 text-gray-300">{row.followers}</td>
                    <td className="px-6 py-4 text-emerald-400">+{row.growth}</td>
                    <td className="px-6 py-4 text-indigo-400">{row.engagement}</td>
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
