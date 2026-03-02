import Link from "next/link";

const ticketStats = [
  { label: "Open Tickets", value: "84", color: "text-rose-400" },
  { label: "In Progress", value: "31", color: "text-amber-400" },
  { label: "Resolved Today", value: "47", color: "text-emerald-400" },
  { label: "Escalated", value: "6", color: "text-purple-400" },
];

const recentTickets = [
  { id: "#4821", subject: "Cannot connect to API", priority: "High", status: "Open", time: "12m ago" },
  { id: "#4820", subject: "Billing charge discrepancy", priority: "High", status: "In Progress", time: "34m ago" },
  { id: "#4819", subject: "Export feature not working", priority: "Medium", status: "Open", time: "1h ago" },
  { id: "#4818", subject: "Password reset email not received", priority: "Medium", status: "Resolved", time: "2h ago" },
  { id: "#4817", subject: "Dashboard loading slowly", priority: "Low", status: "Resolved", time: "3h ago" },
];

const channels = [
  { name: "Email", tickets: 42, pct: 50 },
  { name: "Live Chat", tickets: 28, pct: 33 },
  { name: "In-App", tickets: 10, pct: 12 },
  { name: "Phone", tickets: 4, pct: 5 },
];

const priorityColor: Record<string, string> = {
  High: "bg-rose-900/40 text-rose-400",
  Medium: "bg-amber-900/40 text-amber-400",
  Low: "bg-gray-700 text-gray-400",
};

const statusColor: Record<string, string> = {
  Open: "bg-rose-900/40 text-rose-300",
  "In Progress": "bg-amber-900/40 text-amber-300",
  Resolved: "bg-emerald-900/40 text-emerald-300",
};

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-700 bg-gray-800/50 px-8 py-6">
        <div className="mx-auto max-w-7xl">
          <Link href="/dashboard" className="text-sm text-indigo-400 hover:text-indigo-300">← Back to Dashboard</Link>
          <h1 className="mt-1 text-3xl font-bold text-white">Support Dashboard</h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-8 py-10 space-y-10">
        {/* Ticket Stats */}
        <section>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {ticketStats.map((s) => (
              <div key={s.label} className="rounded-xl bg-gray-800 p-6">
                <p className="text-sm text-gray-400">{s.label}</p>
                <p className={`mt-2 text-3xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SLA, CSAT, Response Time */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="rounded-xl bg-gray-800 p-6 text-center">
            <p className="text-sm text-gray-400">SLA Compliance</p>
            <p className="mt-3 text-5xl font-bold text-emerald-400">94.2%</p>
            <p className="mt-1 text-xs text-gray-500">Target: 95%</p>
            <div className="mt-3 h-2 rounded-full bg-gray-700">
              <div className="h-2 rounded-full bg-emerald-500" style={{ width: "94.2%" }} />
            </div>
          </div>
          <div className="rounded-xl bg-gray-800 p-6 text-center">
            <p className="text-sm text-gray-400">Customer Satisfaction</p>
            <p className="mt-3 text-5xl font-bold text-amber-400">4.6<span className="text-2xl">/5</span></p>
            <div className="mt-2 flex justify-center gap-1 text-amber-400 text-xl">
              {"★★★★★".split("").map((s, i) => (
                <span key={i} className={i < 4 ? "text-amber-400" : "text-gray-600"}>{s}</span>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-gray-800 p-6 text-center">
            <p className="text-sm text-gray-400">Avg. First Response</p>
            <p className="mt-3 text-5xl font-bold text-indigo-400">1.8<span className="text-2xl">h</span></p>
            <p className="mt-1 text-xs text-gray-500">Target: &lt;2h</p>
          </div>
        </div>

        {/* Ticket Queue */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Recent Tickets</h2>
          <div className="overflow-x-auto rounded-xl bg-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-left text-gray-400">
                  <th className="px-6 py-4 font-medium">ID</th>
                  <th className="px-6 py-4 font-medium">Subject</th>
                  <th className="px-6 py-4 font-medium">Priority</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentTickets.map((t) => (
                  <tr key={t.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="px-6 py-3 font-mono text-gray-400">{t.id}</td>
                    <td className="px-6 py-3 text-white">{t.subject}</td>
                    <td className="px-6 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${priorityColor[t.priority]}`}>{t.priority}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor[t.status]}`}>{t.status}</span>
                    </td>
                    <td className="px-6 py-3 text-gray-400">{t.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Support Channels */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Support Channels</h2>
          <div className="rounded-xl bg-gray-800 p-6 space-y-4">
            {channels.map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">{c.name}</span>
                  <span className="text-gray-400">{c.tickets} tickets ({c.pct}%)</span>
                </div>
                <div className="h-3 rounded-full bg-gray-700">
                  <div className="h-3 rounded-full bg-indigo-500" style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
