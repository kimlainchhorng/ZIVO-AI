"use client";

import { useState } from "react";
import Link from "next/link";
import type { PackageSize, DeliveryStatus } from "@/lib/services-types";

const packageSizes: { size: PackageSize; label: string; icon: string; desc: string }[] = [
  { size: "envelope", label: "Envelope", icon: "✉️", desc: "Up to 0.5 lbs" },
  { size: "small", label: "Small Box", icon: "📦", desc: "Up to 5 lbs" },
  { size: "medium", label: "Medium Box", icon: "📦", desc: "Up to 20 lbs" },
  { size: "large", label: "Large Box", icon: "📦", desc: "Up to 70 lbs" },
  { size: "xl", label: "XL Box", icon: "🗃️", desc: "Up to 150 lbs" },
  { size: "freight", label: "Freight", icon: "🚛", desc: "150+ lbs" },
];

const trackingSteps: { status: DeliveryStatus; label: string }[] = [
  { status: "scheduled", label: "Scheduled" },
  { status: "picked_up", label: "Picked Up" },
  { status: "in_transit", label: "In Transit" },
  { status: "out_for_delivery", label: "Out for Delivery" },
  { status: "delivered", label: "Delivered" },
];

export default function PackagesPage() {
  const [activeTab, setActiveTab] = useState<"send" | "track" | "partner">("send");
  const [packageSize, setPackageSize] = useState<PackageSize>("small");
  const [trackingNumber, setTrackingNumber] = useState("ZIVO-2026-8821");
  const [currentStatus] = useState<DeliveryStatus>("in_transit");
  const [loading, setLoading] = useState(false);
  const [booked, setBooked] = useState(false);
  const [trackingId, setTrackingId] = useState("");
  const [specialHandling, setSpecialHandling] = useState<string[]>([]);

  function toggleHandling(h: string) {
    setSpecialHandling((prev) => prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h]);
  }

  async function handleBook() {
    setLoading(true);
    try {
      await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageSize, specialHandling }),
      });
    } catch { /* intentional */ }
    setTrackingId(`ZIVO-2026-${Math.floor(Math.random() * 9000) + 1000}`);
    setBooked(true);
    setLoading(false);
  }

  const currentStep = trackingSteps.findIndex((s) => s.status === currentStatus);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📦</span>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Package Delivery</h1>
            <p className="text-xs text-zinc-500">Roadies-style · Real-time tracking · Proof of delivery</p>
          </div>
        </div>
        <Link href="/services" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white">← Services</Link>
      </header>

      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 flex gap-6">
          {(["send", "track", "partner"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`py-3 text-sm font-semibold capitalize border-b-2 transition-colors ${activeTab === tab ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white" : "border-transparent text-zinc-500 hover:text-zinc-700"}`}>
              {tab === "send" ? "📤 Send Package" : tab === "track" ? "🔍 Track" : "🚴 Delivery Partner"}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {activeTab === "send" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-5">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Ship a Package</h2>

              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2 block">Package Size</label>
                <div className="grid grid-cols-3 gap-2">
                  {packageSizes.map((s) => (
                    <button key={s.size} onClick={() => setPackageSize(s.size)} className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${packageSize === s.size ? "border-zinc-900 dark:border-white bg-zinc-100 dark:bg-zinc-800" : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"}`}>
                      <span className="text-lg">{s.icon}</span>
                      <span className="text-xs font-semibold mt-1 text-zinc-700 dark:text-zinc-300">{s.label}</span>
                      <span className="text-xs text-zinc-400">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[["Pickup Address", "123 Oak Street, Austin, TX"], ["Delivery Address", "456 Pine Ave, Houston, TX"], ["Recipient Name", "John Smith"], ["Recipient Phone", "+1 (512) 555-0100"]].map(([label, placeholder]) => (
                  <div key={label}>
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{label}</label>
                    <input className="mt-1 w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900" placeholder={placeholder} />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2 block">Special Handling</label>
                <div className="flex flex-wrap gap-2">
                  {["Fragile", "Temperature Controlled", "Signature Required", "Adult Signature", "Hazmat"].map((h) => (
                    <button key={h} onClick={() => toggleHandling(h)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${specialHandling.includes(h) ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent" : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400"}`}>
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              {booked ? (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                  <p className="text-lg mb-1">📬</p>
                  <p className="text-sm font-bold text-green-700 dark:text-green-400">Shipment booked!</p>
                  <p className="text-xs text-zinc-500 mt-1">Tracking: {trackingId}</p>
                </div>
              ) : (
                <button onClick={handleBook} disabled={loading} className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm hover:bg-zinc-700 transition-colors disabled:opacity-60">
                  {loading ? "Booking…" : "Get Quote & Book"}
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-3">Platform Features</h3>
                <ul className="space-y-2">
                  {[
                    { icon: "📍", text: "Real-time GPS tracking" },
                    { icon: "✍️", text: "Electronic signature & photo proof" },
                    { icon: "🌡️", text: "Temperature-controlled shipping" },
                    { icon: "🛡️", text: "Insurance up to $10,000" },
                    { icon: "↩️", text: "Easy returns management" },
                    { icon: "⚠️", text: "Damage claims portal" },
                    { icon: "📦", text: "Fragile & special handling" },
                    { icon: "🔔", text: "SMS & email notifications" },
                  ].map(({ icon, text }) => (
                    <li key={text} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <span>{icon}</span>
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === "track" && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Track Your Package</h2>
            <div className="flex gap-3 mb-6">
              <input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                placeholder="Enter tracking number"
              />
              <button className="px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-bold hover:bg-zinc-700 transition-colors">Track</button>
            </div>

            <div className="mb-6">
              <div className="flex items-center mb-2">
                <p className="text-sm font-bold text-zinc-900 dark:text-white">{trackingNumber}</p>
                <span className="ml-auto px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold">In Transit</span>
              </div>
              <p className="text-xs text-zinc-500">Estimated delivery: Tomorrow by 8 PM</p>
            </div>

            <div className="space-y-4">
              {trackingSteps.map((step, i) => {
                const isDone = i <= currentStep;
                const isCurrent = i === currentStep;
                return (
                  <div key={step.status} className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isDone ? "bg-green-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"}`}>
                      {isDone ? "✓" : i + 1}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${isDone ? "text-zinc-900 dark:text-white" : "text-zinc-400"}`}>{step.label}</p>
                      {isCurrent && <p className="text-xs text-zinc-400">Austin Distribution Center · 2 hours ago</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "partner" && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Delivery Partner Dashboard</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Deliveries Today", value: "14", icon: "📦" },
                { label: "Earnings Today", value: "$187.50", icon: "💰" },
                { label: "On-Time Rate", value: "98.2%", icon: "⏱️" },
                { label: "Rating", value: "4.94 ⭐", icon: "⭐" },
              ].map(({ label, value, icon }) => (
                <div key={label} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 text-center">
                  <p className="text-2xl mb-1">{icon}</p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-white">{value}</p>
                  <p className="text-xs text-zinc-500">{label}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Pending Pickups</h3>
              {[
                { id: "PKG-001", address: "742 Oak St → 123 Elm Ave", size: "Medium", earnings: "$12.50" },
                { id: "PKG-002", address: "88 Pine Rd → 456 Maple Dr", size: "Small", earnings: "$8.00" },
              ].map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">{p.id} · {p.size}</p>
                    <p className="text-xs text-zinc-500">{p.address}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-green-600">{p.earnings}</span>
                    <button className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-xs font-bold hover:bg-zinc-700 transition-colors">Accept</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
