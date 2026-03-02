import Link from "next/link";

const checklist = [
  { item: "Finalize product feature set", done: true },
  { item: "Complete security audit", done: true },
  { item: "Set up production infrastructure", done: true },
  { item: "Configure monitoring & alerting", done: true },
  { item: "Create onboarding flow", done: true },
  { item: "Write documentation & help center", done: true },
  { item: "Set up customer support system", done: false },
  { item: "Prepare marketing launch assets", done: false },
  { item: "Schedule press outreach", done: false },
  { item: "Configure payment & billing", done: false },
  { item: "Run load testing", done: false },
  { item: "Final QA pass across all features", done: false },
];

const betaStats = [
  { label: "Beta Users", value: "284", color: "text-indigo-400" },
  { label: "Feedback Received", value: "1,038", color: "text-emerald-400" },
  { label: "Bugs Reported", value: "47", color: "text-rose-400" },
  { label: "Bugs Resolved", value: "39", color: "text-amber-400" },
];

const completedCount = checklist.filter((c) => c.done).length;
const progressPct = Math.round((completedCount / checklist.length) * 100);

export default function LaunchPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-700 bg-gray-800/50 px-8 py-6">
        <div className="mx-auto max-w-7xl">
          <Link href="/dashboard" className="text-sm text-indigo-400 hover:text-indigo-300">← Back to Dashboard</Link>
          <h1 className="mt-1 text-3xl font-bold text-white">Launch Command Center</h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-8 py-10 space-y-10">
        {/* Countdown Timer */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Launch Countdown</h2>
          <div className="rounded-xl bg-gray-800 p-8 text-center">
            <p className="text-sm text-gray-400 mb-6 uppercase tracking-widest">Target Launch Date — Jan 15, 2026</p>
            <div className="flex items-center justify-center gap-6">
              {[
                { value: "12", label: "Days" },
                { value: "08", label: "Hours" },
                { value: "34", label: "Minutes" },
                { value: "52", label: "Seconds" },
              ].map((unit) => (
                <div key={unit.label} className="flex flex-col items-center">
                  <span className="rounded-xl bg-gray-900 px-6 py-4 text-5xl font-bold text-indigo-400 font-mono">{unit.value}</span>
                  <span className="mt-2 text-xs text-gray-400 uppercase tracking-widest">{unit.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pre-launch Status */}
        <section>
          <div className="rounded-xl bg-gray-800 p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold text-white">Pre-launch Readiness</h2>
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${progressPct >= 75 ? "bg-amber-900/40 text-amber-400" : "bg-rose-900/40 text-rose-400"}`}>
                {progressPct}% Ready
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-700">
              <div
                className="h-3 rounded-full bg-indigo-500 transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-gray-400">{completedCount} of {checklist.length} tasks completed</p>
          </div>
        </section>

        {/* Checklist & Beta Stats */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">Launch Checklist</h2>
            <div className="rounded-xl bg-gray-800 p-6 space-y-3">
              {checklist.map((item) => (
                <div key={item.item} className="flex items-center gap-3">
                  <div className={`h-5 w-5 rounded flex items-center justify-center flex-shrink-0 ${item.done ? "bg-emerald-500" : "border-2 border-gray-600"}`}>
                    {item.done && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className={item.done ? "text-gray-400 line-through" : "text-gray-200"}>{item.item}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">Beta Program Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              {betaStats.map((s) => (
                <div key={s.label} className="rounded-xl bg-gray-800 p-6">
                  <p className="text-sm text-gray-400">{s.label}</p>
                  <p className={`mt-2 text-3xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl bg-gray-800 p-6">
              <h3 className="font-semibold text-white mb-3">Top Beta Feedback Themes</h3>
              {[
                { theme: "UI/UX Improvements", count: 312 },
                { theme: "Performance Issues", count: 198 },
                { theme: "Missing Features", count: 274 },
                { theme: "Positive Feedback", count: 254 },
              ].map((f) => (
                <div key={f.theme} className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">{f.theme}</span>
                    <span className="text-gray-400">{f.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-700">
                    <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${(f.count / 312) * 100}%` }} />
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
