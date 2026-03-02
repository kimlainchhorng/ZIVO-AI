import Link from "next/link";

const teamMembers = [
  { name: "Alex Chen", role: "CEO & Co-founder", dept: "Leadership", status: "Active", since: "Jan 2024" },
  { name: "Maya Patel", role: "CTO & Co-founder", dept: "Engineering", status: "Active", since: "Jan 2024" },
  { name: "Jordan Kim", role: "Head of Product", dept: "Product", status: "Active", since: "Mar 2024" },
  { name: "Sam Rivera", role: "Lead Engineer", dept: "Engineering", status: "Active", since: "Apr 2024" },
  { name: "Taylor Brooks", role: "Head of Marketing", dept: "Marketing", status: "Active", since: "Jun 2024" },
  { name: "Chris Nguyen", role: "Customer Success", dept: "Success", status: "Active", since: "Aug 2024" },
];

const okrs = [
  { objective: "Reach $200K MRR", progress: 62, keyResults: ["$124K current MRR", "18.4% MoM growth", "520 paying customers"] },
  { objective: "Launch mobile app beta", progress: 35, keyResults: ["UI designs complete", "Backend API in progress", "Beta testers recruited"] },
  { objective: "Achieve NPS > 60", progress: 95, keyResults: ["Current NPS: 57", "Target: 60 by Q1 end"] },
];

const openPositions = [
  { title: "Senior Full-Stack Engineer", dept: "Engineering", location: "Remote", urgency: "High" },
  { title: "Head of Sales", dept: "Sales", location: "Remote / NYC", urgency: "High" },
  { title: "Product Designer", dept: "Design", location: "Remote", urgency: "Medium" },
  { title: "DevOps Engineer", dept: "Engineering", location: "Remote", urgency: "Medium" },
];

const meetings = [
  { name: "All-Hands", cadence: "Bi-weekly", next: "Jan 10", attendees: 12 },
  { name: "Engineering Standup", cadence: "Daily", next: "Jan 6", attendees: 5 },
  { name: "Product Review", cadence: "Weekly", next: "Jan 7", attendees: 6 },
  { name: "1-on-1s", cadence: "Weekly", next: "Jan 6–7", attendees: 2 },
];

const urgencyColor: Record<string, string> = {
  High: "bg-rose-900/40 text-rose-400",
  Medium: "bg-amber-900/40 text-amber-400",
};

const deptColor: Record<string, string> = {
  Leadership: "bg-purple-900/40 text-purple-400",
  Engineering: "bg-indigo-900/40 text-indigo-400",
  Product: "bg-blue-900/40 text-blue-400",
  Marketing: "bg-pink-900/40 text-pink-400",
  Success: "bg-emerald-900/40 text-emerald-400",
  Sales: "bg-amber-900/40 text-amber-400",
  Design: "bg-cyan-900/40 text-cyan-400",
};

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-700 bg-gray-800/50 px-8 py-6">
        <div className="mx-auto max-w-7xl">
          <Link href="/dashboard" className="text-sm text-indigo-400 hover:text-indigo-300">← Back to Dashboard</Link>
          <h1 className="mt-1 text-3xl font-bold text-white">Team Management</h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-8 py-10 space-y-10">
        {/* Stats */}
        <section>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {[
              { label: "Team Size", value: "12", color: "text-indigo-400" },
              { label: "Open Positions", value: "4", color: "text-amber-400" },
              { label: "Avg OKR Progress", value: "64%", color: "text-emerald-400" },
              { label: "Productivity Score", value: "8.4/10", color: "text-purple-400" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-gray-800 p-6">
                <p className="text-sm text-gray-400">{s.label}</p>
                <p className={`mt-2 text-3xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Team Members */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Team Members</h2>
          <div className="overflow-x-auto rounded-xl bg-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-left text-gray-400">
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Department</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Since</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((m) => (
                  <tr key={m.name} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="px-6 py-3 font-medium text-white">{m.name}</td>
                    <td className="px-6 py-3 text-gray-300">{m.role}</td>
                    <td className="px-6 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${deptColor[m.dept] ?? "bg-gray-700 text-gray-300"}`}>{m.dept}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-emerald-900/40 text-emerald-400">{m.status}</span>
                    </td>
                    <td className="px-6 py-3 text-gray-400">{m.since}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* OKR Progress */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">OKR Progress</h2>
          <div className="space-y-5">
            {okrs.map((okr) => (
              <div key={okr.objective} className="rounded-xl bg-gray-800 p-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-white">{okr.objective}</p>
                  <span className="text-sm font-bold text-indigo-400">{okr.progress}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-gray-700 mb-4">
                  <div
                    className={`h-2.5 rounded-full ${okr.progress >= 80 ? "bg-emerald-500" : okr.progress >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
                    style={{ width: `${okr.progress}%` }}
                  />
                </div>
                <ul className="space-y-1">
                  {okr.keyResults.map((kr) => (
                    <li key={kr} className="flex items-center gap-2 text-sm text-gray-400">
                      <span className="text-gray-600">•</span> {kr}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Open Positions */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">Open Positions</h2>
            <div className="space-y-3">
              {openPositions.map((p) => (
                <div key={p.title} className="flex items-center justify-between rounded-xl bg-gray-800 p-5">
                  <div>
                    <p className="font-semibold text-white">{p.title}</p>
                    <p className="text-sm text-gray-400">{p.dept} · {p.location}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${urgencyColor[p.urgency]}`}>{p.urgency}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Meeting Schedule */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">Meeting Schedule</h2>
            <div className="rounded-xl bg-gray-800 p-6 space-y-4">
              {meetings.map((m) => (
                <div key={m.name} className="flex items-center justify-between border-b border-gray-700/50 pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-white">{m.name}</p>
                    <p className="text-xs text-gray-400">{m.cadence} · {m.attendees} attendees</p>
                  </div>
                  <span className="text-sm text-indigo-400 font-semibold">{m.next}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
