"use client";

import { useState } from "react";
import Link from "next/link";

const loadTypes = [
  { id: "ftl", name: "Full Truckload (FTL)", icon: "🚛", desc: "Dedicated truck for your load", capacity: "Up to 48,000 lbs" },
  { id: "ltl", name: "Less-Than-Truckload (LTL)", icon: "📦", desc: "Share trailer space with others", capacity: "Up to 10,000 lbs" },
  { id: "hazmat", name: "Hazmat", icon: "⚠️", desc: "Certified hazardous materials transport", capacity: "Varies by class" },
  { id: "temp", name: "Temperature-Controlled", icon: "❄️", desc: "Refrigerated or frozen cargo", capacity: "Up to 44,000 lbs" },
];

const complianceItems = [
  { icon: "📄", name: "Bill of Lading", desc: "Auto-generated BOL with carrier and shipper details." },
  { icon: "🧾", name: "Proof of Delivery", desc: "Digital POD with signature and geo-timestamp." },
  { icon: "📋", name: "Hazmat Documentation", desc: "DOT-compliant hazmat manifests and placards." },
  { icon: "💰", name: "Invoice Generation", desc: "Automated freight invoices with line-item breakdowns." },
  { icon: "📊", name: "Customs Clearance", desc: "International shipment documentation support." },
  { icon: "🔍", name: "Audit Trail", desc: "Complete chain-of-custody records for every shipment." },
];

const sensorTypes = [
  { icon: "🌡️", name: "Temperature", value: "34°F", status: "OK", color: "green" },
  { icon: "💧", name: "Humidity", value: "62%", status: "OK", color: "green" },
  { icon: "📳", name: "Impact", value: "0 events", status: "OK", color: "green" },
  { icon: "📍", name: "GPS Location", value: "I-80 Mile 245", status: "Live", color: "blue" },
];

export default function LogisticsPage() {
  const [activeTab, setActiveTab] = useState<"post" | "track" | "compliance">("post");
  const [selectedLoad, setSelectedLoad] = useState("ftl");
  const [origin, setOrigin] = useState("");
  const [dest, setDest] = useState("");
  const [weight, setWeight] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-800 text-white py-10 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/services" className="text-gray-400 text-sm hover:text-white mb-2 block">← All Services</Link>
            <div className="flex items-center gap-3">
              <span className="text-4xl">🚛</span>
              <div>
                <h1 className="text-3xl font-bold">Logistics & Freight</h1>
                <p className="text-gray-300">FTL · LTL · Hazmat · Temperature-controlled · Compliance</p>
              </div>
            </div>
          </div>
          <span className="bg-white text-gray-800 text-xs font-bold px-3 py-1 rounded-full">#58</span>
        </div>
      </header>

      <div className="bg-white border-b px-6">
        <div className="max-w-5xl mx-auto flex">
          {(["post", "track", "compliance"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 font-semibold text-sm border-b-2 transition-colors capitalize ${
                activeTab === tab ? "border-gray-800 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "post" ? "📤 Post Load" : tab === "track" ? "📍 Track Shipment" : "📋 Compliance"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "post" && (
        <section className="py-8 px-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {!submitted ? (
              <>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-lg mb-4">Load Type</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {loadTypes.map((lt) => (
                      <button
                        key={lt.id}
                        onClick={() => setSelectedLoad(lt.id)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          selectedLoad === lt.id ? "border-gray-700 bg-gray-50" : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="text-2xl mb-1">{lt.icon}</div>
                        <div className="font-bold text-sm">{lt.name}</div>
                        <div className="text-xs text-gray-500">{lt.desc}</div>
                        <div className="text-xs text-gray-400 mt-1">{lt.capacity}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <form onSubmit={handlePost} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
                  <h3 className="font-bold text-lg">Shipment Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
                      <input
                        type="text"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        placeholder="City, state or zip"
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                      <input
                        type="text"
                        value={dest}
                        onChange={(e) => setDest(e.target.value)}
                        placeholder="City, state or zip"
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Weight (lbs)</label>
                      <input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="Total shipment weight"
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Commodity</label>
                      <input
                        type="text"
                        placeholder="e.g. Electronics, Produce"
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                      />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-gray-800 text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-900">
                    Post Load & Get Quotes
                  </button>
                </form>
              </>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-green-800 mb-2">Load Posted Successfully!</h3>
                <p className="text-green-700 mb-2">{origin} → {dest} · {weight} lbs · {loadTypes.find((l) => l.id === selectedLoad)?.name}</p>
                <p className="text-green-600 mb-4">Load ID: FRT-{Math.floor(Math.random() * 90000 + 10000)} · 12 carriers notified</p>
                <button onClick={() => setSubmitted(false)} className="bg-gray-800 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-gray-900">
                  Post Another Load
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === "track" && (
        <section className="py-8 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
              <h3 className="font-bold text-lg mb-4">Live Shipment: FRT-48291</h3>
              <div className="flex items-center justify-between mb-6 text-sm">
                <div>
                  <div className="font-bold">Chicago, IL</div>
                  <div className="text-gray-500">Departed 6:00 AM</div>
                </div>
                <div className="flex-1 mx-4 border-t-2 border-dashed border-gray-300 relative">
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-lg">🚛</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">Los Angeles, CA</div>
                  <div className="text-gray-500">ETA: Tomorrow 8:00 AM</div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {sensorTypes.map((sensor) => (
                  <div key={sensor.name} className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-xl mb-1">{sensor.icon}</div>
                    <div className="text-xs text-gray-500 mb-1">{sensor.name}</div>
                    <div className="font-bold text-sm">{sensor.value}</div>
                    <div className={`text-xs font-semibold ${sensor.color === "green" ? "text-green-600" : "text-blue-600"}`}>
                      {sensor.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === "compliance" && (
        <section className="py-8 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Documentation & Compliance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {complianceItems.map((item) => (
                <div key={item.name} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <h3 className="font-bold mb-1">{item.name}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                  <button className="mt-3 text-sm text-gray-700 font-semibold hover:underline">Generate →</button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="bg-black text-gray-500 text-center py-6 text-sm">
        <Link href="/services" className="text-gray-400 hover:text-white">← Back to all services</Link>
      </footer>
    </div>
  );
}
