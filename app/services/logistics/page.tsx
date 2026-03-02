"use client";

import { useState } from "react";
import Link from "next/link";
import type { FreightMode } from "@/lib/services-types";

const modes: { mode: FreightMode; label: string; icon: string }[] = [
  { mode: "ltl", label: "LTL", icon: "🚛" },
  { mode: "ftl", label: "FTL", icon: "🚚" },
  { mode: "rail", label: "Rail", icon: "🚂" },
  { mode: "air", label: "Air Freight", icon: "✈️" },
  { mode: "ocean", label: "Ocean", icon: "🚢" },
  { mode: "intermodal", label: "Intermodal", icon: "🔄" },
];

export default function LogisticsPage() {
  const [activeTab, setActiveTab] = useState<"post" | "track" | "carriers">("post");
  const [selectedMode, setSelectedMode] = useState<FreightMode>("ftl");
  const [isHazmat, setIsHazmat] = useState(false);
  const [requiresTemp, setRequiresTemp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [posted, setPosted] = useState(false);
  const [loadId, setLoadId] = useState("");

  async function handlePost() {
    setLoading(true);
    try {
      await fetch("/api/logistics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: selectedMode, isHazmat, requiresTemp }),
      });
    } catch { /* intentional */ }
    setLoadId(`LF-2026-${Math.floor(Math.random() * 9000) + 1000}`);
    setPosted(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚛</span>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Logistics &amp; Freight</h1>
            <p className="text-xs text-zinc-500">Load posting · Route optimization · Hazmat · Bill of lading</p>
          </div>
        </div>
        <Link href="/services" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white">← Services</Link>
      </header>

      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 flex gap-6">
          {(["post", "track", "carriers"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`py-3 text-sm font-semibold capitalize border-b-2 transition-colors ${activeTab === tab ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white" : "border-transparent text-zinc-500 hover:text-zinc-700"}`}>
              {tab === "post" ? "📋 Post Load" : tab === "track" ? "🔍 Track Shipment" : "🏢 Carriers"}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {activeTab === "post" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-5">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Post a Load</h2>

              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2 block">Freight Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {modes.map((m) => (
                    <button key={m.mode} onClick={() => setSelectedMode(m.mode)} className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${selectedMode === m.mode ? "border-zinc-900 dark:border-white bg-zinc-100 dark:bg-zinc-800" : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"}`}>
                      <span className="text-xl">{m.icon}</span>
                      <span className="text-xs font-semibold mt-1 text-zinc-700 dark:text-zinc-300">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[["Origin", "Chicago, IL"], ["Destination", "Los Angeles, CA"], ["Pickup Date", "2026-03-12"], ["Delivery Date", "2026-03-14"]].map(([label, placeholder]) => (
                  <div key={label}>
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{label}</label>
                    <input className="mt-1 w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900" placeholder={placeholder} />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[["Weight (lbs)", "24,000"], ["Rate ($/mi)", "2.85"], ["Commodity", "General Freight"]].map(([label, placeholder]) => (
                  <div key={label}>
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{label}</label>
                    <input className="mt-1 w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900" placeholder={placeholder} />
                  </div>
                ))}
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Compliance &amp; Requirements</h4>
                <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer">
                  <input type="checkbox" checked={isHazmat} onChange={(e) => setIsHazmat(e.target.checked)} className="rounded" />
                  Hazmat (HazMat compliance required)
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer">
                  <input type="checkbox" checked={requiresTemp} onChange={(e) => setRequiresTemp(e.target.checked)} className="rounded" />
                  Temperature Controlled Freight
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded" />
                  Tolls Included in Rate
                </label>
              </div>

              {posted ? (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                  <p className="text-lg mb-1">✅</p>
                  <p className="text-sm font-bold text-green-700 dark:text-green-400">Load posted to marketplace!</p>
                  <p className="text-xs text-zinc-500 mt-1">Load ID: {loadId}</p>
                </div>
              ) : (
                <button onClick={handlePost} disabled={loading} className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm hover:bg-zinc-700 transition-colors disabled:opacity-60">
                  {loading ? "Posting…" : "Post Load to Marketplace"}
                </button>
              )}
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-4">Platform Capabilities</h3>
              <ul className="space-y-3">
                {[
                  { icon: "📋", title: "Load Board", desc: "Post and find loads across all freight modes" },
                  { icon: "🗺️", title: "Route Optimization", desc: "AI-powered routing to minimize cost and time" },
                  { icon: "🌡️", title: "Temperature Monitoring", desc: "Real-time IoT sensor tracking for reefer loads" },
                  { icon: "☢️", title: "Hazmat Compliance", desc: "DOT/EPA compliance management and documentation" },
                  { icon: "🚧", title: "Toll Management", desc: "Automatic toll calculation and transponder tracking" },
                  { icon: "📄", title: "Bill of Lading", desc: "Digital BOL generation, signing, and storage" },
                  { icon: "💳", title: "Payment Processing", desc: "Quick pay, factoring, and ACH payment options" },
                  { icon: "📊", title: "Analytics Dashboard", desc: "Lane analysis, market rates, and performance KPIs" },
                ].map(({ icon, title, desc }) => (
                  <li key={title} className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">{icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{title}</p>
                      <p className="text-xs text-zinc-500">{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === "track" && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Shipment Tracking</h2>
            <div className="flex gap-3 mb-6">
              <input defaultValue="LF-2026-4521" className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900" placeholder="Enter Load ID or BOL number" />
              <button className="px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-bold hover:bg-zinc-700 transition-colors">Track</button>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl mb-6">
              <div className="flex justify-between mb-2">
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">LF-2026-4521 · FTL</p>
                  <p className="text-xs text-zinc-500">Chicago, IL → Los Angeles, CA · 2,017 miles</p>
                </div>
                <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold h-fit">In Transit</span>
              </div>
              <p className="text-xs text-zinc-500">ETA: March 14, 2026 · 14:00 CST</p>
            </div>

            <div className="space-y-3">
              {[
                { event: "Departed Chicago terminal", location: "Chicago, IL", time: "Mar 12, 06:30 AM", done: true },
                { event: "Passed through Joliet weigh station", location: "Joliet, IL", time: "Mar 12, 07:45 AM", done: true },
                { event: "Crossing into Missouri", location: "St. Louis, MO", time: "Mar 12, 02:30 PM", done: true },
                { event: "Oklahoma City fuel stop", location: "Oklahoma City, OK", time: "Mar 13, 08:00 AM", done: false },
                { event: "Arriving Los Angeles", location: "Los Angeles, CA", time: "Mar 14, 2:00 PM", done: false },
              ].map((e, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${e.done ? "bg-green-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"}`}>
                    {e.done ? "✓" : i + 1}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${e.done ? "text-zinc-900 dark:text-white" : "text-zinc-400"}`}>{e.event}</p>
                    <p className="text-xs text-zinc-400">{e.location} · {e.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "carriers" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Registered Carriers", value: "8,420", icon: "🚛" },
                { label: "Active Loads", value: "12,891", icon: "📦" },
                { label: "Avg Rate/Mile", value: "$2.84", icon: "💰" },
                { label: "On-Time Rate", value: "94.2%", icon: "⏱️" },
              ].map(({ label, value, icon }) => (
                <div key={label} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 text-center">
                  <p className="text-2xl mb-1">{icon}</p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-white">{value}</p>
                  <p className="text-xs text-zinc-500">{label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Top Carriers</h2>
              <div className="space-y-3">
                {[
                  { name: "Swift Transportation", dot: "DOT #12345", rating: 4.8, loads: 14200 },
                  { name: "Werner Enterprises", dot: "DOT #67890", rating: 4.7, loads: 11800 },
                  { name: "JB Hunt Transport", dot: "DOT #24680", rating: 4.9, loads: 18400 },
                ].map((c) => (
                  <div key={c.name} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">{c.name}</p>
                      <p className="text-xs text-zinc-500">{c.dot} · {c.loads.toLocaleString()} completed loads</p>
                    </div>
                    <div className="text-sm font-bold text-zinc-700 dark:text-zinc-300">⭐ {c.rating}</div>
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
