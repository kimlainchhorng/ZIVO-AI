import Link from "next/link";

const keyMetrics = [
  { label: "DAU", value: "12,840", change: "+8.3%", color: "text-indigo-400" },
  { label: "MAU", value: "94,220", change: "+14.1%", color: "text-emerald-400" },
  { label: "Retention Rate", value: "68.4%", change: "+2.1%", color: "text-amber-400" },
  { label: "Churn Rate", value: "3.2%", change: "-0.4%", color: "text-rose-400" },
  { label: "LTV", value: "$1,840", change: "+$120", color: "text-purple-400" },
  { label: "CAC", value: "$42", change: "-$6", color: "text-cyan-400" },
];

const cohortData = [
  { cohort: "Jan 2025", month1: "100%", month2: "72%", month3: "61%", month4: "54%", month5: "49%", month6: "44%" },
  { cohort: "Feb 2025", month1: "100%", month2: "74%", month3: "63%", month4: "56%", month5: "51%", month6: "—" },
  { cohort: "Mar 2025", month1: "100%", month2: "76%", month3: "65%", month4: "58%", month5: "—", month6: "—" },
  { cohort: "Apr 2025", month1: "100%", month2: "78%", month3: "66%", month4: "—", month5: "—", month6: "—" },
  { cohort: "May 2025", month1: "100%", month2: "79%", month3: "—", month4: "—", month5: "—", month6: "—" },
];

const funnelSteps = [
  { step: "Visitors", count: 240000, pct: 100 },
  { step: "Sign-ups", count: 18400, pct: 7.7 },
  { step: "Activated", count: 12100, pct: 5.0 },
  { step: "Engaged (7d)", count: 8840, pct: 3.7 },
  { step: "Paid", count: 2960, pct: 1.2 },
];

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-700 bg-gray-800/50 px-8 py-6">
        <div className="mx-auto max-w-7xl">
          <Link href="/dashboard" className="text-sm text-indigo-400 hover:text-indigo-300">← Back to Dashboard</Link>
          <h1 className="mt-1 text-3xl font-bold text-white">Analytics Hub</h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-8 py-10 space-y-10">
        {/* Key Metrics */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Key Metrics</h2>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
            {keyMetrics.map((m) => (
              <div key={m.label} className="rounded-xl bg-gray-800 p-5">
                <p className="text-xs text-gray-400 uppercase tracking-wider">{m.label}</p>
                <p className={`mt-2 text-2xl font-bold ${m.color}`}>{m.value}</p>
                <p className={`mt-1 text-xs ${m.change.startsWith("-") && !m.label.includes("Churn") && !m.label.includes("CAC") ? "text-rose-400" : "text-emerald-400"}`}>
                  {m.change}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Chart Placeholders */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">DAU / MAU Trend</h2>
            <div className="rounded-xl bg-gray-800 p-6 h-48 flex items-end gap-2">
              {[42, 55, 48, 62, 70, 65, 78, 83, 79, 88, 92, 96].map((v, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-indigo-500/70 hover:bg-indigo-400 transition-colors"
                  style={{ height: `${(v / 96) * 100}%` }}
                  title={`Month ${i + 1}`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500 px-1">
              <span>Jan</span><span>Jun</span><span>Dec</span>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">Growth Rate Tracking</h2>
            <div className="rounded-xl bg-gray-800 p-6 h-48 flex items-end gap-2">
              {[5.1, 6.2, 5.8, 7.4, 8.1, 7.9, 9.2, 10.4, 11.1, 12.3, 13.8, 14.1].map((v, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-emerald-500/70 hover:bg-emerald-400 transition-colors"
                  style={{ height: `${(v / 14.1) * 100}%` }}
                  title={`${v}%`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500 px-1">
              <span>Jan</span><span>Jun</span><span>Dec</span>
            </div>
          </section>
        </div>

        {/* Funnel Analysis */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Funnel Analysis</h2>
          <div className="rounded-xl bg-gray-800 p-6 space-y-3">
            {funnelSteps.map((step, i) => (
              <div key={step.step}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">{step.step}</span>
                  <span className="text-gray-400">{step.count.toLocaleString()} ({step.pct}%)</span>
                </div>
                <div className="h-8 rounded-lg bg-gray-700 overflow-hidden">
                  <div
                    className="h-8 rounded-lg flex items-center pl-3 text-xs font-semibold text-white"
                    style={{
                      width: `${step.pct === 100 ? 100 : Math.max(step.pct * 10, 8)}%`,
                      backgroundColor: `hsl(${240 - i * 30}, 70%, 50%)`,
                    }}
                  >
                    {step.pct}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cohort Analysis */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Cohort Retention Analysis</h2>
          <div className="overflow-x-auto rounded-xl bg-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400">
                  <th className="px-6 py-4 text-left font-medium">Cohort</th>
                  {["Month 1", "Month 2", "Month 3", "Month 4", "Month 5", "Month 6"].map((m) => (
                    <th key={m} className="px-4 py-4 text-center font-medium">{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohortData.map((row) => (
                  <tr key={row.cohort} className="border-b border-gray-700/50">
                    <td className="px-6 py-3 font-medium text-white">{row.cohort}</td>
                    {[row.month1, row.month2, row.month3, row.month4, row.month5, row.month6].map((val, i) => (
                      <td
                        key={i}
                        className={`px-4 py-3 text-center text-xs font-semibold rounded ${val === "—" ? "text-gray-600" : "text-white"}`}
                        style={val !== "—" ? { backgroundColor: `rgba(99, 102, 241, ${parseFloat(val) / 200})` } : {}}
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
      </main>
    </div>
  );
}
