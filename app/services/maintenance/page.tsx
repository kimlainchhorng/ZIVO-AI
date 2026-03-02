"use client";

import { useState } from "react";
import Link from "next/link";

const serviceCategories = [
  { id: "hvac", name: "HVAC", icon: "❄️", basePrice: 89 },
  { id: "plumbing", name: "Plumbing", icon: "🔧", basePrice: 79 },
  { id: "electrical", name: "Electrical", icon: "⚡", basePrice: 99 },
  { id: "appliance", name: "Appliance Repair", icon: "🏠", basePrice: 79 },
  { id: "pest", name: "Pest Control", icon: "🐛", basePrice: 129 },
  { id: "cleaning", name: "Deep Cleaning", icon: "🧹", basePrice: 149 },
  { id: "locksmith", name: "Locksmith", icon: "🔑", basePrice: 69 },
  { id: "automotive", name: "Auto Service", icon: "🚗", basePrice: 109 },
];

const timeSlots = ["8:00 AM", "10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM", "6:00 PM"];

const technicianFeatures = [
  { icon: "🗺️", title: "Route Optimization", desc: "Smart scheduling minimizes drive time and maximizes jobs per day." },
  { icon: "📱", title: "Mobile Technician App", desc: "Job details, navigation, parts inventory, and customer communication in one app." },
  { icon: "📸", title: "Photo Documentation", desc: "Before/after photos and service evidence attached to every work order." },
  { icon: "✍️", title: "Digital Signature", desc: "Customer approval and sign-off captured digitally at job completion." },
  { icon: "💳", title: "On-Site Payment", desc: "Accept card, cash, or invoice directly from the mobile app." },
  { icon: "📋", title: "Service Checklist", desc: "Guided checklists ensure consistent, high-quality service delivery." },
];

export default function MaintenancePage() {
  const [selectedService, setSelectedService] = useState("hvac");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [address, setAddress] = useState("");
  const [booked, setBooked] = useState(false);
  const [activeTab, setActiveTab] = useState<"book" | "history">("book");

  const service = serviceCategories.find((s) => s.id === selectedService)!;

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (address && selectedSlot) setBooked(true);
  };

  const serviceHistory = [
    { service: "HVAC Tune-Up", date: "Jan 15, 2026", tech: "Mike R.", rating: 5, cost: "$129" },
    { service: "Plumbing Repair", date: "Dec 3, 2025", tech: "Sarah L.", rating: 4, cost: "$210" },
    { service: "Deep Cleaning", date: "Nov 10, 2025", tech: "Alex T.", rating: 5, cost: "$189" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-teal-700 text-white py-10 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/services" className="text-teal-200 text-sm hover:text-white mb-2 block">← All Services</Link>
            <div className="flex items-center gap-3">
              <span className="text-4xl">🔧</span>
              <div>
                <h1 className="text-3xl font-bold">Maintenance & Service</h1>
                <p className="text-teal-200">Field service marketplace · Technician dispatch · Warranty tracking</p>
              </div>
            </div>
          </div>
          <span className="bg-white text-teal-700 text-xs font-bold px-3 py-1 rounded-full">#60</span>
        </div>
      </header>

      <div className="bg-white border-b px-6">
        <div className="max-w-5xl mx-auto flex">
          {(["book", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 font-semibold text-sm border-b-2 transition-colors ${
                activeTab === tab ? "border-teal-600 text-teal-700" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "book" ? "📅 Book Service" : "📋 Service History"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "book" && (
        <section className="py-8 px-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {!booked ? (
              <>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-lg mb-4">Select Service Type</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {serviceCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedService(cat.id)}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          selectedService === cat.id
                            ? "border-teal-500 bg-teal-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="text-2xl mb-1">{cat.icon}</div>
                        <div className="font-semibold text-xs">{cat.name}</div>
                        <div className="text-teal-600 text-xs font-bold mt-0.5">From ${cat.basePrice}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleBook} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
                  <h3 className="font-bold text-lg">Book {service.icon} {service.name}</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Address</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter your address"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Available Time Slots — Today</label>
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2 px-3 rounded-xl border text-sm font-medium transition-all ${
                            selectedSlot === slot
                              ? "border-teal-500 bg-teal-50 text-teal-700"
                              : "border-gray-200 hover:border-teal-300"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issue Description</label>
                    <textarea
                      placeholder="Describe the problem or what service you need..."
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 h-24 resize-none"
                    />
                  </div>
                  <div className="bg-teal-50 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <div className="font-semibold">Estimated Cost</div>
                      <div className="text-xs text-gray-500">Final price after technician assessment</div>
                    </div>
                    <div className="text-2xl font-black text-teal-700">From ${service.basePrice}</div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-teal-700 text-white py-4 rounded-xl font-bold text-lg hover:bg-teal-800"
                  >
                    Book Service
                  </button>
                </form>
              </>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-2xl font-bold text-green-800 mb-2">Service Booked!</h3>
                <p className="text-green-700 mb-1">{service.icon} {service.name} at {address}</p>
                <p className="text-green-600 mb-4">Time slot: {selectedSlot} · Confirmation #SVC-{Math.floor(Math.random() * 90000 + 10000)}</p>
                <div className="flex justify-center gap-3">
                  <button className="bg-teal-700 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-teal-800">
                    Track Technician
                  </button>
                  <button
                    onClick={() => { setBooked(false); setSelectedSlot(""); setAddress(""); }}
                    className="border border-gray-300 px-6 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50"
                  >
                    Book Another
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === "history" && (
        <section className="py-8 px-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {serviceHistory.map((entry) => (
              <div key={entry.date} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <div className="font-bold">{entry.service}</div>
                  <div className="text-sm text-gray-500">{entry.date} · Technician: {entry.tech}</div>
                  <div className="flex mt-1">
                    {Array.from({ length: entry.rating }).map((_, i) => (
                      <span key={i} className="text-yellow-400 text-sm">⭐</span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{entry.cost}</div>
                  <button className="text-xs text-teal-600 hover:underline mt-1">View Receipt</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="py-12 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Field Service Technology</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {technicianFeatures.map((feat) => (
              <div key={feat.title} className="bg-teal-50 rounded-xl p-5">
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
