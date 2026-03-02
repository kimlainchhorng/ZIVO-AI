"use client";

import { useState } from "react";
import Link from "next/link";
import type { ServiceCategory } from "@/lib/services-types";

const categories: { category: ServiceCategory; label: string; icon: string }[] = [
  { category: "plumbing", label: "Plumbing", icon: "🔧" },
  { category: "electrical", label: "Electrical", icon: "⚡" },
  { category: "hvac", label: "HVAC", icon: "❄️" },
  { category: "appliance", label: "Appliance", icon: "🫙" },
  { category: "carpentry", label: "Carpentry", icon: "🪵" },
  { category: "painting", label: "Painting", icon: "🎨" },
  { category: "cleaning", label: "Cleaning", icon: "🧹" },
  { category: "pest_control", label: "Pest Control", icon: "🐛" },
  { category: "landscaping", label: "Landscaping", icon: "🌿" },
  { category: "general", label: "General", icon: "🔨" },
];

export default function MaintenancePage() {
  const [activeTab, setActiveTab] = useState<"request" | "technician" | "dashboard">("request");
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>("plumbing");
  const [urgency, setUrgency] = useState<"routine" | "urgent" | "emergency">("routine");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [requestId, setRequestId] = useState("");

  async function handleSubmit() {
    setLoading(true);
    try {
      await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: selectedCategory, urgency }),
      });
    } catch { /* intentional */ }
    setRequestId(`SR-2026-${Math.floor(Math.random() * 9000) + 1000}`);
    setSubmitted(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔧</span>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Field Service &amp; Maintenance</h1>
            <p className="text-xs text-zinc-500">Technician assignment · Parts management · SLA tracking</p>
          </div>
        </div>
        <Link href="/services" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white">← Services</Link>
      </header>

      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 flex gap-6">
          {(["request", "technician", "dashboard"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`py-3 text-sm font-semibold capitalize border-b-2 transition-colors ${activeTab === tab ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white" : "border-transparent text-zinc-500 hover:text-zinc-700"}`}>
              {tab === "request" ? "🛠️ Request Service" : tab === "technician" ? "👷 Technician" : "📊 Admin Dashboard"}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {activeTab === "request" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-5">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Request a Service</h2>

              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2 block">Service Category</label>
                <div className="grid grid-cols-5 gap-2">
                  {categories.map(({ category, label, icon }) => (
                    <button key={category} onClick={() => setSelectedCategory(category)} className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all ${selectedCategory === category ? "border-zinc-900 dark:border-white bg-zinc-100 dark:bg-zinc-800" : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"}`}>
                      <span className="text-lg">{icon}</span>
                      <span className="text-xs mt-0.5 text-zinc-600 dark:text-zinc-400 text-center leading-tight">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2 block">Urgency</label>
                <div className="flex gap-2">
                  {(["routine", "urgent", "emergency"] as const).map((u) => (
                    <button key={u} onClick={() => setUrgency(u)} className={`flex-1 py-2 rounded-xl border-2 text-sm font-semibold capitalize transition-all ${urgency === u ? "border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400"}`}>
                      {u === "emergency" ? "🚨 " : u === "urgent" ? "⚠️ " : "📅 "}{u}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Service Address</label>
                  <input className="mt-1 w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900" placeholder="123 Main Street, Apt 4B" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Description</label>
                  <textarea className="mt-1 w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 h-24 resize-none" placeholder="Describe the issue in detail…" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Preferred Date/Time</label>
                  <input type="datetime-local" className="mt-1 w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900" />
                </div>
              </div>

              {submitted ? (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                  <p className="text-lg mb-1">✅</p>
                  <p className="text-sm font-bold text-green-700 dark:text-green-400">Service request submitted!</p>
                  <p className="text-xs text-zinc-500 mt-1">Request #{requestId} · Technician being assigned</p>
                </div>
              ) : (
                <button onClick={handleSubmit} disabled={loading} className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm hover:bg-zinc-700 transition-colors disabled:opacity-60">
                  {loading ? "Submitting…" : "Submit Service Request"}
                </button>
              )}
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-4">Platform Features</h3>
              <ul className="space-y-3">
                {[
                  { icon: "👷", title: "Smart Technician Matching", desc: "AI matches the best available technician by skill and proximity" },
                  { icon: "🔩", title: "Parts Management", desc: "Real-time parts inventory with automatic reorder triggers" },
                  { icon: "🧾", title: "Automated Invoicing", desc: "Digital invoices with labor, parts, and tax calculations" },
                  { icon: "📜", title: "Service History", desc: "Complete audit trail of all maintenance activities" },
                  { icon: "🛡️", title: "Warranty Tracking", desc: "Track warranty coverage across parts and workmanship" },
                  { icon: "⏱️", title: "SLA Management", desc: "Configurable SLA tiers with escalation and breach alerts" },
                  { icon: "📸", title: "Photo Documentation", desc: "Before/after photos for every job automatically stored" },
                  { icon: "⭐", title: "Customer Reviews", desc: "Post-service ratings and feedback collection" },
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

        {activeTab === "technician" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Jobs Today", value: "7", icon: "🔧" },
                { label: "Earnings Today", value: "$420", icon: "💰" },
                { label: "Avg Rating", value: "4.96 ⭐", icon: "⭐" },
                { label: "Parts Used", value: "12 items", icon: "🔩" },
              ].map(({ label, value, icon }) => (
                <div key={label} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 text-center">
                  <p className="text-2xl mb-1">{icon}</p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-white">{value}</p>
                  <p className="text-xs text-zinc-500">{label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Assigned Jobs</h2>
              <div className="space-y-3">
                {[
                  { id: "SR-2026-4521", type: "Plumbing", address: "742 Oak St, Unit 12", time: "9:00 AM", status: "In Progress", urgency: "urgent" },
                  { id: "SR-2026-4519", type: "Electrical", address: "88 Elm Ave, Suite 3", time: "11:30 AM", status: "Pending", urgency: "routine" },
                  { id: "SR-2026-4517", type: "HVAC", address: "321 Maple Dr", time: "2:00 PM", status: "Pending", urgency: "routine" },
                ].map((job) => (
                  <div key={job.id} className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{job.id} · {job.type}</p>
                        <p className="text-xs text-zinc-500">{job.address} · {job.time}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${job.urgency === "urgent" ? "bg-orange-100 text-orange-700" : "bg-zinc-100 text-zinc-500"}`}>
                          {job.urgency}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${job.status === "In Progress" ? "bg-blue-100 text-blue-700" : "bg-zinc-100 text-zinc-500"}`}>
                          {job.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-xs font-bold hover:bg-zinc-700 transition-colors">Start Job</button>
                      <button className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 transition-colors">Add Parts</button>
                      <button className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 transition-colors">Navigate</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Open Requests", value: "84", icon: "📋" },
                { label: "In Progress", value: "31", icon: "🔧" },
                { label: "SLA Breaches", value: "2", icon: "🚨" },
                { label: "Completed Today", value: "127", icon: "✅" },
              ].map(({ label, value, icon }) => (
                <div key={label} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 text-center">
                  <p className="text-2xl mb-1">{icon}</p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-white">{value}</p>
                  <p className="text-xs text-zinc-500">{label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-3">SLA Performance</h3>
                <div className="space-y-3">
                  {[
                    { tier: "Emergency (2h SLA)", met: 98.5, color: "bg-red-500" },
                    { tier: "Urgent (24h SLA)", met: 94.2, color: "bg-orange-500" },
                    { tier: "Routine (72h SLA)", met: 99.1, color: "bg-green-500" },
                  ].map(({ tier, met, color }) => (
                    <div key={tier}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-zinc-600 dark:text-zinc-400 text-xs">{tier}</span>
                        <span className="font-bold text-zinc-900 dark:text-white text-xs">{met}%</span>
                      </div>
                      <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full`} style={{ width: `${met}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-3">Top Technicians</h3>
                <div className="space-y-2">
                  {[
                    { name: "Carlos Rivera", specialty: "Plumbing", rating: 4.98, jobs: 312 },
                    { name: "Amy Chen", specialty: "Electrical", rating: 4.96, jobs: 284 },
                    { name: "James Wilson", specialty: "HVAC", rating: 4.95, jobs: 261 },
                  ].map((t) => (
                    <div key={t.name} className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">{t.name}</p>
                        <p className="text-xs text-zinc-500">{t.specialty} · {t.jobs} jobs</p>
                      </div>
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">⭐ {t.rating}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
