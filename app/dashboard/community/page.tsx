import Link from "next/link";

const stats = [
  { label: "Total Members", value: "3,420", color: "text-indigo-400" },
  { label: "Active This Week", value: "842", color: "text-emerald-400" },
  { label: "New This Month", value: "214", color: "text-amber-400" },
  { label: "Moderation Queue", value: "7", color: "text-rose-400" },
];

const featureRequests = [
  { title: "Dark mode customization", votes: 284, status: "Planned" },
  { title: "API webhooks", votes: 231, status: "In Progress" },
  { title: "Team collaboration tools", votes: 198, status: "Planned" },
  { title: "Mobile app", votes: 176, status: "Under Review" },
  { title: "Bulk CSV import", votes: 142, status: "Planned" },
];

const recentPosts = [
  { author: "sarah_dev", title: "Tips for getting the most out of ZIVO AI", replies: 14, time: "2h ago" },
  { author: "markj", title: "Integration with Zapier — complete guide", replies: 8, time: "5h ago" },
  { author: "priya_tech", title: "Feature request: scheduled exports", replies: 22, time: "8h ago" },
  { author: "community_bot", title: "Weekly digest — top discussions", replies: 3, time: "1d ago" },
];

const upcomingEvents = [
  { name: "Community AMA — Founders", date: "Jan 8, 2026", attendees: 120 },
  { name: "Power Users Workshop", date: "Jan 15, 2026", attendees: 45 },
  { name: "API Office Hours", date: "Jan 22, 2026", attendees: 28 },
];

const statusColor: Record<string, string> = {
  Planned: "bg-indigo-900/40 text-indigo-400",
  "In Progress": "bg-amber-900/40 text-amber-400",
  "Under Review": "bg-gray-700 text-gray-400",
};

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-700 bg-gray-800/50 px-8 py-6">
        <div className="mx-auto max-w-7xl">
          <Link href="/dashboard" className="text-sm text-indigo-400 hover:text-indigo-300">← Back to Dashboard</Link>
          <h1 className="mt-1 text-3xl font-bold text-white">Community Management</h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-8 py-10 space-y-10">
        {/* Stats */}
        <section>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl bg-gray-800 p-6">
                <p className="text-sm text-gray-400">{s.label}</p>
                <p className={`mt-2 text-3xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Feature Requests */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">Feature Requests Voting</h2>
            <div className="rounded-xl bg-gray-800 p-6 space-y-3">
              {featureRequests.map((f) => (
                <div key={f.title} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 truncate">{f.title}</p>
                    <span className={`mt-1 rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor[f.status]}`}>{f.status}</span>
                  </div>
                  <div className="ml-4 flex items-center gap-1.5 rounded-lg bg-gray-700 px-3 py-1.5">
                    <span className="text-indigo-400">▲</span>
                    <span className="font-semibold text-white text-sm">{f.votes}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Posts */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">Recent Discussions</h2>
            <div className="rounded-xl bg-gray-800 p-6 space-y-4">
              {recentPosts.map((p) => (
                <div key={p.title} className="border-b border-gray-700/50 pb-4 last:border-0 last:pb-0">
                  <p className="text-sm font-medium text-white">{p.title}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                    <span className="text-indigo-400">@{p.author}</span>
                    <span>{p.replies} replies</span>
                    <span>{p.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Community Events */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Upcoming Community Events</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {upcomingEvents.map((e) => (
              <div key={e.name} className="rounded-xl bg-gray-800 p-6">
                <p className="font-semibold text-white">{e.name}</p>
                <p className="mt-1 text-sm text-indigo-400">{e.date}</p>
                <p className="mt-2 text-sm text-gray-400">{e.attendees} registered</p>
              </div>
            ))}
          </div>
        </section>

        {/* Active Discussions Heatmap Placeholder */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Activity Overview</h2>
          <div className="rounded-xl bg-gray-800 p-6">
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 70 }, (_, i) => {
                const intensity = Math.random();
                return (
                  <div
                    key={i}
                    className="h-6 rounded"
                    style={{ backgroundColor: `rgba(99,102,241,${intensity * 0.8 + 0.05})` }}
                  />
                );
              })}
            </div>
            <p className="mt-3 text-xs text-gray-500">Community activity heatmap — last 10 weeks</p>
          </div>
        </section>
      </main>
    </div>
  );
}
