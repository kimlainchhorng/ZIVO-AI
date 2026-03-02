"use client";

import { useState } from "react";
import Link from "next/link";
import type { DeliverySpeed } from "@/lib/services-types";

const speeds: { speed: DeliverySpeed; label: string; icon: string; eta: string; price: string }[] = [
  { speed: "next_hour", label: "Next Hour", icon: "⚡", eta: "Within 60 min", price: "$14.99" },
  { speed: "same_day", label: "Same Day", icon: "🏃", eta: "By 9 PM today", price: "$7.99" },
  { speed: "scheduled", label: "Scheduled", icon: "📅", eta: "Choose window", price: "$4.99" },
  { speed: "standard", label: "Standard", icon: "📦", eta: "1–3 business days", price: "$2.99" },
];

export default function LastMilePage() {
  const [activeTab, setActiveTab] = useState<"dispatch" | "courier" | "analytics">("dispatch");
  const [selectedSpeed, setSelectedSpeed] = useState<DeliverySpeed>("same_day");
  const [loading, setLoading] = useState(false);
  const [dispatched, setDispatched] = useState(false);

  async function handleDispatch() {
    setLoading(true);
    try {
      await fetch("/api/last-mile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ speed: selectedSpeed }),
      });
    } catch { /* intentional */ }
    setDispatched(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📍</span>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Last-Mile Delivery</h1>
            <p className="text-xs text-zinc-500">Same-day · Next-hour · Batch optimization · Geofencing</p>
          </div>
        </div>
        <Link href="/services" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white">← Services</Link>
      </header>

      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 flex gap-6">
          {(["dispatch", "courier", "analytics"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`py-3 text-sm font-semibold capitalize border-b-2 transition-colors ${activeTab === tab ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white" : "border-transparent text-zinc-500 hover:text-zinc-700"}`}>
              {tab === "dispatch" ? "📤 Dispatch" : tab === "courier" ? "🚴 Courier" : "📊 Analytics"}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {activeTab === "dispatch" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-5">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Create Delivery</h2>

              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2 block">Delivery Speed</label>
                <div className="grid grid-cols-2 gap-2">
                  {speeds.map((s) => (
                    <button key={s.speed} onClick={() => setSelectedSpeed(s.speed)} className={`p-3 rounded-xl border-2 text-left transition-all ${selectedSpeed === s.speed ? "border-zinc-900 dark:border-white bg-zinc-100 dark:bg-zinc-800" : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span>{s.icon}</span>
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">{s.label}</span>
                      </div>
                      <p className="text-xs text-zinc-500">{s.eta}</p>
                      <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mt-1">{s.price}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {[["Pickup Address", "789 Warehouse Blvd, Oakland, CA"], ["Delivery Address", "321 Customer Lane, Berkeley, CA"], ["Contact Phone", "+1 (510) 555-0199"]].map(([label, placeholder]) => (
                  <div key={label}>
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{label}</label>
                    <input className="mt-1 w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900" placeholder={placeholder} />
                  </div>
                ))}
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                <h4 className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-2">Advanced Options</h4>
                <div className="space-y-2">
                  {["Require photo proof of delivery", "Enable geofence alerts", "Allow safe drop", "Contactless delivery"].map((opt) => (
                    <label key={opt} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer">
                      <input type="checkbox" className="rounded" defaultChecked={opt.includes("photo") || opt.includes("geofence")} />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>

              {dispatched ? (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                  <p className="text-lg mb-1">🎉</p>
                  <p className="text-sm font-bold text-green-700 dark:text-green-400">Delivery dispatched!</p>
                  <p className="text-xs text-zinc-500 mt-1">Courier assigned · ETA: 45 minutes</p>
                </div>
              ) : (
                <button onClick={handleDispatch} disabled={loading} className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm hover:bg-zinc-700 transition-colors disabled:opacity-60">
                  {loading ? "Dispatching…" : "Dispatch Delivery"}
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-zinc-800 dark:to-zinc-700 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-6 h-48 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-4xl mb-2">🗺️</p>
                  <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">Live Delivery Map</p>
                  <p className="text-xs text-zinc-400">Real-time courier tracking with geofencing</p>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-3">Platform Features</h3>
                <ul className="grid grid-cols-2 gap-2">
                  {["Same-day delivery", "Next-hour delivery", "Batch route optimization", "Geofencing alerts", "Photo proof of delivery", "Electronic signature", "Failed delivery handling", "Re-delivery scheduling", "SMS/email notifications", "API webhooks"].map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                      <span className="text-green-500 mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === "courier" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Deliveries Today", value: "23", icon: "📦" },
                { label: "Earnings", value: "$142.50", icon: "💰" },
                { label: "Success Rate", value: "99.1%", icon: "✅" },
                { label: "Avg Rating", value: "4.97", icon: "⭐" },
              ].map(({ label, value, icon }) => (
                <div key={label} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 text-center">
                  <p className="text-2xl mb-1">{icon}</p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-white">{value}</p>
                  <p className="text-xs text-zinc-500">{label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Active Deliveries (Batch)</h2>
              <div className="space-y-3">
                {[
                  { id: "LM-001", address: "321 Customer Lane, Berkeley", eta: "12 min", priority: "⚡ Next Hour" },
                  { id: "LM-002", address: "88 Park Ave, Oakland", eta: "28 min", priority: "🏃 Same Day" },
                  { id: "LM-003", address: "456 College Ave, Berkeley", eta: "41 min", priority: "🏃 Same Day" },
                ].map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white">{d.id}</p>
                      <p className="text-xs text-zinc-500">{d.address}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{d.priority}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-blue-600">{d.eta}</span>
                      <button className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-xs font-bold hover:bg-zinc-700 transition-colors">Navigate</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Performance Metrics</h2>
              <div className="space-y-4">
                {[
                  { metric: "On-Time Delivery Rate", value: 96.8, color: "bg-green-500" },
                  { metric: "First Attempt Success", value: 91.2, color: "bg-blue-500" },
                  { metric: "Customer Satisfaction", value: 98.4, color: "bg-purple-500" },
                  { metric: "Courier Utilization", value: 78.6, color: "bg-yellow-500" },
                ].map(({ metric, value, color }) => (
                  <div key={metric}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-600 dark:text-zinc-400">{metric}</span>
                      <span className="font-bold text-zinc-900 dark:text-white">{value}%</span>
                    </div>
                    <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Today&apos;s Summary</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Total Deliveries", value: "4,821" },
                  { label: "Avg Delivery Time", value: "34 min" },
                  { label: "Active Couriers", value: "312" },
                  { label: "Failed Deliveries", value: "43 (0.9%)" },
                  { label: "Revenue", value: "$38,420" },
                  { label: "Batches Optimized", value: "1,204" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3">
                    <p className="text-xs text-zinc-500">{label}</p>
                    <p className="text-base font-bold text-zinc-900 dark:text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
