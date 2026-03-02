"use client";

import { useState, useEffect } from "react";
import Navigation from "../components/Navigation";

interface ServiceHealth {
  name: string;
  status: "healthy" | "degraded" | "down";
  uptime: number;
  responseTime: number;
}

interface MonitoringData {
  cpu: number;
  memory: number;
  apiLatency: number;
  errorRate: number;
  services: ServiceHealth[];
}

const alerts = [
  { level: "info", message: "Scheduled maintenance window in 3 days", time: "2h ago" },
  { level: "warning", message: "Memory usage exceeded 75% threshold", time: "4h ago" },
  { level: "info", message: "ML model retraining completed successfully", time: "6h ago" },
  { level: "warning", message: "API latency spike detected (p99: 850ms)", time: "8h ago" },
];

const alertColors: Record<string, string> = {
  info: "text-blue-400 border-blue-800 bg-blue-900/20",
  warning: "text-yellow-400 border-yellow-800 bg-yellow-900/20",
  error: "text-red-400 border-red-800 bg-red-900/20",
};

const statusDot: Record<string, string> = {
  healthy: "bg-emerald-400",
  degraded: "bg-yellow-400",
  down: "bg-red-400",
};

function MetricBar({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
      <div className="flex justify-between items-center mb-3">
        <span className="text-gray-400 text-sm">{label}</span>
        <span className="text-xl font-bold text-white">{value}{unit}</span>
      </div>
      <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        ></div>
      </div>
    </div>
  );
}

export default function MonitoringPage() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchMetrics = () => {
    fetch("/api/monitoring")
      .then((r) => r.json())
      .then((d) => { setData(d); setLastRefresh(new Date()); })
      .catch(() => {});
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              System Monitoring
            </h1>
            <p className="text-gray-400 mt-1">
              Last refresh: {lastRefresh.toLocaleTimeString()} · Auto-refreshes every 30s
            </p>
          </div>
          <button
            onClick={fetchMetrics}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors self-start"
          >
            Refresh Now
          </button>
        </div>

        {/* Live metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricBar label="CPU Usage" value={data?.cpu ?? 0} unit="%" color="bg-purple-500" />
          <MetricBar label="Memory Usage" value={data?.memory ?? 0} unit="%" color="bg-blue-500" />
          <MetricBar label="API Latency" value={data?.apiLatency ?? 0} unit="ms" color="bg-emerald-500" />
          <MetricBar label="Error Rate" value={data?.errorRate ?? 0} unit="%" color="bg-red-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Service health table */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold mb-4">Service Health</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="text-left pb-3 font-medium">Service</th>
                    <th className="text-center pb-3 font-medium">Status</th>
                    <th className="text-right pb-3 font-medium">Uptime</th>
                    <th className="text-right pb-3 font-medium">Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.services ?? []).map((svc) => (
                    <tr key={svc.name} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                      <td className="py-3 text-gray-200">{svc.name}</td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${statusDot[svc.status]}`}></span>
                          <span className="text-gray-300 capitalize">{svc.status}</span>
                        </div>
                      </td>
                      <td className="py-3 text-right text-emerald-400">{svc.uptime}%</td>
                      <td className="py-3 text-right text-gray-300">{svc.responseTime}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent alerts */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold mb-4">Recent Alerts</h2>
            <div className="flex flex-col gap-3">
              {alerts.map((a, i) => (
                <div key={i} className={`rounded-lg border p-3 text-sm ${alertColors[a.level]}`}>
                  <div className="flex justify-between gap-2">
                    <span>{a.message}</span>
                    <span className="text-gray-500 flex-shrink-0">{a.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
