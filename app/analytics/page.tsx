"use client";

import { useState, useEffect } from "react";
import Navigation from "../components/Navigation";

interface AnalyticsData {
  events: number;
  users: number;
  conversion: number;
  revenue: number;
  chartData: number[];
  topEvents: { name: string; count: number }[];
}

const ranges = ["7d", "30d", "90d", "1y"] as const;

const barColors = ["bg-purple-500", "bg-blue-500", "bg-emerald-500", "bg-yellow-500", "bg-pink-500", "bg-indigo-500", "bg-orange-500"];

export default function AnalyticsPage() {
  const [range, setRange] = useState<string>("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics?range=${range}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [range]);

  const stats = data
    ? [
        { label: "Total Events", value: data.events.toLocaleString(), change: "+12.3%" },
        { label: "Active Users", value: data.users.toLocaleString(), change: "+8.1%" },
        { label: "Conversion Rate", value: `${data.conversion}%`, change: "+2.4%" },
        { label: "Revenue", value: `$${data.revenue.toLocaleString()}`, change: "+18.7%" },
      ]
    : [];

  const maxChart = data ? Math.max(...data.chartData, 1) : 1;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Analytics
            </h1>
            <p className="text-gray-400 mt-1">Real-time insights and ML-driven forecasts</p>
          </div>
          <div className="flex gap-2">
            {ranges.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  range === r
                    ? "bg-purple-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white border border-gray-700"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((s) => (
                <div key={s.label} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <p className="text-gray-400 text-sm mb-1">{s.label}</p>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-emerald-400 text-sm mt-1">{s.change} vs prev period</p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Events over time */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="font-semibold mb-4">Events Over Time</h3>
                <div className="flex items-end gap-1 h-32">
                  {(data?.chartData ?? []).map((v, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-purple-600 rounded-t opacity-80 hover:opacity-100 transition-opacity"
                      style={{ height: `${(v / maxChart) * 100}%` }}
                      title={String(v)}
                    ></div>
                  ))}
                </div>
              </div>

              {/* Feature usage */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="font-semibold mb-4">Feature Usage</h3>
                <div className="flex flex-col gap-3">
                  {(data?.topEvents ?? []).slice(0, 5).map((e, i) => {
                    const maxVal = Math.max(...(data?.topEvents ?? []).map((x) => x.count), 1);
                    return (
                      <div key={e.name}>
                        <div className="flex justify-between text-sm text-gray-400 mb-1">
                          <span>{e.name}</span>
                          <span>{e.count.toLocaleString()}</span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${barColors[i % barColors.length]}`}
                            style={{ width: `${(e.count / maxVal) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Top events table */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="font-semibold mb-4">Top Events</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-700">
                      <th className="text-left pb-3 font-medium">Event</th>
                      <th className="text-right pb-3 font-medium">Count</th>
                      <th className="text-right pb-3 font-medium">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.topEvents ?? []).map((e) => {
                      const total = (data?.topEvents ?? []).reduce((a, x) => a + x.count, 0);
                      return (
                        <tr key={e.name} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                          <td className="py-3 text-gray-200">{e.name}</td>
                          <td className="py-3 text-right text-gray-300">{e.count.toLocaleString()}</td>
                          <td className="py-3 text-right text-purple-400">
                            {total > 0 ? `${((e.count / total) * 100).toFixed(1)}%` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
