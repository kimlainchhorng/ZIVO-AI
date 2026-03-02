import Link from "next/link";

const feedbackItems = [
  { user: "sarah_dev", type: "Bug", message: "Export to CSV fails for large datasets (>10K rows)", sentiment: "Negative", date: "2h ago" },
  { user: "mark_j", type: "Feature Request", message: "Would love dark mode customization options", sentiment: "Positive", date: "4h ago" },
  { user: "priya_t", type: "Praise", message: "The analytics dashboard is incredibly well-designed!", sentiment: "Positive", date: "6h ago" },
  { user: "anonUser42", type: "Bug", message: "Dashboard sometimes shows stale data after refresh", sentiment: "Negative", date: "1d ago" },
  { user: "omar_k", type: "Feature Request", message: "Please add Slack notifications for key events", sentiment: "Neutral", date: "1d ago" },
];

const sentimentDistribution = [
  { label: "Positive", count: 312, pct: 58, color: "bg-emerald-500" },
  { label: "Neutral", count: 148, pct: 28, color: "bg-amber-500" },
  { label: "Negative", count: 78, pct: 14, color: "bg-rose-500" },
];

const typeColor: Record<string, string> = {
  Bug: "bg-rose-900/40 text-rose-400",
  "Feature Request": "bg-indigo-900/40 text-indigo-400",
  Praise: "bg-emerald-900/40 text-emerald-400",
};

const sentimentColor: Record<string, string> = {
  Positive: "text-emerald-400",
  Neutral: "text-amber-400",
  Negative: "text-rose-400",
};

export default function FeedbackPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-700 bg-gray-800/50 px-8 py-6">
        <div className="mx-auto max-w-7xl">
          <Link href="/dashboard" className="text-sm text-indigo-400 hover:text-indigo-300">← Back to Dashboard</Link>
          <h1 className="mt-1 text-3xl font-bold text-white">Feedback</h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-8 py-10 space-y-10">
        {/* Stats */}
        <section>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {[
              { label: "Total Feedback", value: "538", color: "text-indigo-400" },
              { label: "This Week", value: "42", color: "text-emerald-400" },
              { label: "Feature Requests", value: "184", color: "text-amber-400" },
              { label: "Bug Reports", value: "78", color: "text-rose-400" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-gray-800 p-6">
                <p className="text-sm text-gray-400">{s.label}</p>
                <p className={`mt-2 text-3xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Sentiment Analysis */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Sentiment Analysis</h2>
          <div className="rounded-xl bg-gray-800 p-6 space-y-4">
            {sentimentDistribution.map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-300">{s.label}</span>
                  <span className="text-gray-400">{s.count} responses ({s.pct}%)</span>
                </div>
                <div className="h-3 rounded-full bg-gray-700">
                  <div className={`h-3 rounded-full ${s.color}`} style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Feedback */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Recent Feedback</h2>
          <div className="space-y-4">
            {feedbackItems.map((f) => (
              <div key={f.message} className="rounded-xl bg-gray-800 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${typeColor[f.type]}`}>{f.type}</span>
                      <span className="text-xs text-gray-400">@{f.user}</span>
                      <span className="text-xs text-gray-500">{f.date}</span>
                    </div>
                    <p className="text-gray-200">{f.message}</p>
                  </div>
                  <span className={`text-sm font-semibold flex-shrink-0 ${sentimentColor[f.sentiment]}`}>{f.sentiment}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
