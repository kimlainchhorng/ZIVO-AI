"use client";

import { useState } from "react";
import Link from "next/link";

const packageSizes = [
  { id: "small", label: "Small", icon: "📦", dims: "12×12×6 in", maxWeight: "5 lbs", price: "$4.99" },
  { id: "medium", label: "Medium", icon: "📦", dims: "16×16×12 in", maxWeight: "20 lbs", price: "$8.99" },
  { id: "large", label: "Large", icon: "📦", dims: "24×24×18 in", maxWeight: "50 lbs", price: "$14.99" },
  { id: "xl", label: "Extra Large", icon: "📦", dims: "36×30×24 in", maxWeight: "100 lbs", price: "$24.99" },
];

const specialHandling = [
  { id: "fragile", label: "Fragile", icon: "🥂" },
  { id: "cold", label: "Temperature Control", icon: "❄️" },
  { id: "adult", label: "Adult Signature Required", icon: "🪪" },
  { id: "signature", label: "Signature Required", icon: "✍️" },
  { id: "insured", label: "Insurance", icon: "🛡️" },
];

const trackingSteps = [
  { status: "Picked Up", time: "2:15 PM", icon: "📦", done: true },
  { status: "At Sorting Facility", time: "4:30 PM", icon: "🏭", done: true },
  { status: "Out for Delivery", time: "8:45 AM", icon: "🚚", done: true },
  { status: "Delivered", time: "Expected 2:00 PM", icon: "🏠", done: false },
];

const features = [
  { icon: "📍", title: "Real-time GPS Tracking", desc: "Live map view of your package with push notifications at every checkpoint." },
  { icon: "📸", title: "Proof of Delivery", desc: "Photo documentation and digital signature capture at the door." },
  { icon: "❄️", title: "Cold Chain Management", desc: "Temperature-controlled delivery for pharmaceuticals, food, and perishables." },
  { icon: "↩️", title: "Return Logistics", desc: "Easy return label generation, pickup scheduling, and refund processing." },
  { icon: "🛡️", title: "Package Insurance", desc: "Declare item value and get coverage up to $10,000 for loss or damage." },
  { icon: "🔔", title: "Smart Notifications", desc: "SMS, email, and in-app alerts for every delivery milestone." },
];

export default function PackagesPage() {
  const [activeTab, setActiveTab] = useState<"send" | "track">("send");
  const [selectedSize, setSelectedSize] = useState("medium");
  const [selectedHandling, setSelectedHandling] = useState<string[]>([]);
  const [trackingNum, setTrackingNum] = useState("");
  const [showTracking, setShowTracking] = useState(false);

  const toggleHandling = (id: string) => {
    setSelectedHandling((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-yellow-600 text-white py-10 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/services" className="text-yellow-200 text-sm hover:text-white mb-2 block">← All Services</Link>
            <div className="flex items-center gap-3">
              <span className="text-4xl">📦</span>
              <div>
                <h1 className="text-3xl font-bold">Package Delivery</h1>
                <p className="text-yellow-100">Roadies · Amazon-style · Cold chain · Real-time tracking</p>
              </div>
            </div>
          </div>
          <span className="bg-white text-yellow-600 text-xs font-bold px-3 py-1 rounded-full">#55</span>
        </div>
      </header>

      <div className="bg-white border-b px-6">
        <div className="max-w-5xl mx-auto flex">
          {(["send", "track"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 font-semibold text-sm border-b-2 transition-colors ${
                activeTab === tab ? "border-yellow-600 text-yellow-700" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "send" ? "📤 Send Package" : "🔍 Track Package"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "send" && (
        <section className="py-8 px-6">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-lg mb-4">Select Package Size</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {packageSizes.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSize(s.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedSize === s.id
                        ? "border-yellow-500 bg-yellow-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="text-2xl mb-1">{s.icon}</div>
                    <div className="font-bold text-sm">{s.label}</div>
                    <div className="text-xs text-gray-500">{s.dims}</div>
                    <div className="text-xs text-gray-500">Max {s.maxWeight}</div>
                    <div className="font-bold text-yellow-600 text-sm mt-1">{s.price}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-lg mb-4">Special Handling</h3>
              <div className="flex flex-wrap gap-3">
                {specialHandling.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => toggleHandling(h.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                      selectedHandling.includes(h.id)
                        ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <span>{h.icon}</span> {h.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-lg mb-4">Delivery Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Address</label>
                  <input type="text" placeholder="123 Sender St, City" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                  <input type="text" placeholder="456 Recipient Ave, City" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Declared Value ($)</label>
                  <input type="number" placeholder="0.00" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                  <input type="text" placeholder="e.g. Leave at door" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                </div>
              </div>
              <button className="mt-4 w-full bg-yellow-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-yellow-700">
                Schedule Pickup
              </button>
            </div>
          </div>
        </section>
      )}

      {activeTab === "track" && (
        <section className="py-8 px-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-3 mb-6">
              <input
                type="text"
                value={trackingNum}
                onChange={(e) => setTrackingNum(e.target.value)}
                placeholder="Enter tracking number"
                className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              <button
                onClick={() => setShowTracking(true)}
                className="bg-yellow-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-yellow-700"
              >
                Track
              </button>
            </div>
            {showTracking && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-xl mb-1">PKG-{trackingNum || "TRK8827"}</h3>
                <p className="text-gray-500 text-sm mb-6">Medium package · New York → Los Angeles</p>
                <div className="space-y-4">
                  {trackingSteps.map((step, i) => (
                    <div key={step.status} className="flex gap-4">
                      <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                        step.done ? "bg-yellow-500 text-white" : "bg-gray-100 text-gray-400"
                      }`}>
                        {step.done ? "✓" : i + 1}
                      </div>
                      <div>
                        <div className={`font-semibold text-sm ${step.done ? "text-gray-900" : "text-gray-400"}`}>
                          {step.icon} {step.status}
                        </div>
                        <div className="text-xs text-gray-400">{step.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="py-12 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Platform Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat) => (
              <div key={feat.title} className="bg-yellow-50 rounded-xl p-5">
                <div className="text-2xl mb-2">{feat.icon}</div>
                <h3 className="font-bold mb-1">{feat.title}</h3>
                <p className="text-gray-600 text-sm">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-black text-gray-500 text-center py-6 text-sm">
        <Link href="/services" className="text-gray-400 hover:text-white">← Back to all services</Link>
      </footer>
    </div>
  );
}
