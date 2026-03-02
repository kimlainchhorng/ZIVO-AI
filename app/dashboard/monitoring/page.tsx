import Link from "next/link";

const services = [
  { name: "API Gateway", uptime: "99.98%", latency: "42ms", status: "healthy" },
  { name: "Web App", uptime: "99.96%", latency: "210ms", status: "healthy" },
  { name: "Database (Primary)", uptime: "100%", latency: "8ms", status: "healthy" },
  { name: "Database (Replica)", uptime: "99.92%", latency: "12ms", status: "healthy" },
  { name: "Background Workers", uptime: "99.8%", latency: "—", status: "warning" },
  { name: "CDN", uptime: "100%", latency: "18ms", status: "healthy" },
];

const alerts = [
  { severity: "Warning", message: "Background worker queue depth elevated", time: "14m ago" },
  { severity: "Info", message: "Scheduled maintenance window in 3 days", time: "2h ago" },
];

const errorRates = [
  { endpoint: "POST /api/projects", rate: "0.12%", count: 48 },
  { endpoint: "GET /api/analytics", rate: "0.08%", count: 31 },
  { endpoint: "POST /api/export", rate: "0.31%", count: 122 },
  { endpoint: "GET /api/users", rate: "0.02%", count: 8 },
];

const statusStyle: Record<string, { badge: string; dot: string }> = {
  healthy: { badge: "bg-emerald-900/40 text-emerald-400", dot: "bg-emerald-400" },
  warning: { badge: "bg-amber-900/40 text-amber-400", dot: "bg-amber-400" },
  down: { badge: "bg-rose-900/40 text-rose-400", dot: "bg-rose-400" },
};

const severityStyle: Record<string, string> = {
  Warning: "border-l-amber-500 bg-amber-900/20",
  Info: "border-l-indigo-500 bg-indigo-900/20",
  Critical: "border-l-rose-500 bg-rose-900/20",
};

export default function MonitoringPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-700 bg-gray-800/50 px-8 py-6">
        <div className="mx-auto max-w-7xl">
          <Link href="/dashboard" className="text-sm text-indigo-400 hover:text-indigo-300">← Back to Dashboard</Link>
          <h1 className="mt-1 text-3xl font-bold text-white">Performance Monitoring</h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-8 py-10 space-y-10">
        {/* Overall Stats */}
        <section>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {[
              { label: "Overall Uptime", value: "99.9%", color: "text-emerald-400" },
              { label: "Avg Response Time", value: "186ms", color: "text-indigo-400" },
              { label: "Error Rate", value: "0.12%", color: "text-amber-400" },
              { label: "Active Alerts", value: "2", color: "text-rose-400" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-gray-800 p-6">
                <p className="text-sm text-gray-400">{s.label}</p>
                <p className={`mt-2 text-3xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Active Alerts */}
        {alerts.length > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">Active Alerts</h2>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.message} className={`rounded-xl border-l-4 p-4 ${severityStyle[alert.severity]}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{alert.severity}</span>
                      <p className="mt-1 text-gray-200">{alert.message}</p>
                    </div>
                    <span className="text-sm text-gray-400">{alert.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Service Health */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Infrastructure Health</h2>
          <div className="overflow-x-auto rounded-xl bg-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-left text-gray-400">
                  <th className="px-6 py-4 font-medium">Service</th>
                  <th className="px-6 py-4 font-medium">Uptime</th>
                  <th className="px-6 py-4 font-medium">Latency</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {services.map((svc) => (
                  <tr key={svc.name} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="px-6 py-3 font-medium text-white flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${statusStyle[svc.status].dot}`} />
                      {svc.name}
                    </td>
                    <td className="px-6 py-3 text-gray-300">{svc.uptime}</td>
                    <td className="px-6 py-3 text-gray-300">{svc.latency}</td>
                    <td className="px-6 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusStyle[svc.status].badge}`}>{svc.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Response Time Chart */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Response Time (last 24h)</h2>
          <div className="rounded-xl bg-gray-800 p-6">
            <div className="flex items-end gap-1.5 h-36">
              {[180, 192, 188, 210, 204, 198, 186, 174, 182, 195, 240, 218, 196, 184, 178, 186, 192, 188, 182, 176, 184, 190, 188, 185].map((v, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-t transition-colors ${v > 210 ? "bg-amber-500/70" : "bg-indigo-500/70"}`}
                  style={{ height: `${(v / 240) * 100}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>Now</span>
            </div>
          </div>
        </section>

        {/* Error Rates */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Error Rates by Endpoint</h2>
          <div className="overflow-x-auto rounded-xl bg-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-left text-gray-400">
                  <th className="px-6 py-4 font-medium">Endpoint</th>
                  <th className="px-6 py-4 font-medium">Error Rate</th>
                  <th className="px-6 py-4 font-medium">Count (24h)</th>
                </tr>
              </thead>
              <tbody>
                {errorRates.map((e) => (
                  <tr key={e.endpoint} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="px-6 py-3 font-mono text-gray-300">{e.endpoint}</td>
                    <td className="px-6 py-3">
                      <span className={`font-semibold ${parseFloat(e.rate) > 0.2 ? "text-rose-400" : "text-amber-400"}`}>{e.rate}</span>
                    </td>
                    <td className="px-6 py-3 text-gray-300">{e.count}</td>
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
