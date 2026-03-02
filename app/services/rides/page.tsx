"use client";

import { useState } from "react";
import Link from "next/link";
import type { RideType, RideStatus, Driver } from "@/lib/services-types";

const rideTypes: { type: RideType; label: string; icon: string; basePrice: number }[] = [
  { type: "economy", label: "Economy", icon: "🚗", basePrice: 8 },
  { type: "pool", label: "Pool", icon: "🚐", basePrice: 5 },
  { type: "xl", label: "XL", icon: "🚙", basePrice: 14 },
  { type: "premium", label: "Premium", icon: "🚘", basePrice: 22 },
  { type: "black", label: "Black", icon: "🖤", basePrice: 35 },
  { type: "moto", label: "Moto", icon: "🏍️", basePrice: 4 },
];

const mockDrivers: Driver[] = [
  {
    id: "d1",
    name: "Alex Thompson",
    rating: 4.92,
    totalTrips: 3847,
    vehicle: { make: "Toyota", model: "Camry", year: 2022, licensePlate: "ABC-1234", color: "White", type: "economy" },
    location: { lat: 37.774, lng: -122.419 },
    isOnline: true,
    earnings: { today: 142.50, thisWeek: 847.20, thisMonth: 3250.80, totalLifetime: 48920.00 },
  },
  {
    id: "d2",
    name: "Maria Garcia",
    rating: 4.87,
    totalTrips: 2103,
    vehicle: { make: "Tesla", model: "Model 3", year: 2023, licensePlate: "XYZ-5678", color: "Black", type: "premium" },
    location: { lat: 37.778, lng: -122.415 },
    isOnline: true,
    earnings: { today: 210.00, thisWeek: 1120.50, thisMonth: 4380.00, totalLifetime: 29050.00 },
  },
];

const mockStatuses: { status: RideStatus; label: string; color: string }[] = [
  { status: "requested", label: "Searching for driver…", color: "text-yellow-600" },
  { status: "matched", label: "Driver matched!", color: "text-blue-600" },
  { status: "en_route", label: "Driver en route", color: "text-blue-600" },
  { status: "arrived", label: "Driver has arrived", color: "text-green-600" },
  { status: "in_progress", label: "Ride in progress", color: "text-green-600" },
  { status: "completed", label: "Ride completed ✓", color: "text-green-700" },
];

export default function RidesPage() {
  const [selectedRide, setSelectedRide] = useState<RideType>("economy");
  const [pickup, setPickup] = useState("123 Main Street, San Francisco, CA");
  const [dropoff, setDropoff] = useState("456 Market Street, San Francisco, CA");
  const [activeTab, setActiveTab] = useState<"passenger" | "driver" | "fleet">("passenger");
  const [bookingStatus, setBookingStatus] = useState<RideStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const selected = rideTypes.find((r) => r.type === selectedRide)!;
  const estimatedFare = (selected.basePrice * 1.2).toFixed(2);

  async function handleBook() {
    setLoading(true);
    try {
      const res = await fetch("/api/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rideType: selectedRide, pickup, dropoff }),
      });
      const data = await res.json();
      setBookingStatus(data.status ?? "requested");
    } catch {
      setBookingStatus("requested");
    } finally {
      setLoading(false);
    }
  }

  const statusInfo = mockStatuses.find((s) => s.status === bookingStatus);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚗</span>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Ride-Sharing Platform</h1>
            <p className="text-xs text-zinc-500">Uber / Lyft / Blacklane style</p>
          </div>
        </div>
        <Link href="/services" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white">← Services</Link>
      </header>

      {/* Tabs */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 flex gap-6">
          {(["passenger", "driver", "fleet"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-sm font-semibold capitalize border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white"
                  : "border-transparent text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {tab === "passenger" ? "🧍 Passenger" : tab === "driver" ? "🚗 Driver" : "🏢 Fleet"}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* ── Passenger Tab ── */}
        {activeTab === "passenger" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Booking Panel */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Request a Ride</h2>

              <div className="space-y-3 mb-6">
                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Pickup</label>
                  <input
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    className="mt-1 w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    placeholder="Enter pickup location"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Dropoff</label>
                  <input
                    value={dropoff}
                    onChange={(e) => setDropoff(e.target.value)}
                    className="mt-1 w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    placeholder="Enter dropoff location"
                  />
                </div>
              </div>

              {/* Ride Type Selection */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                {rideTypes.map((r) => (
                  <button
                    key={r.type}
                    onClick={() => setSelectedRide(r.type)}
                    className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                      selectedRide === r.type
                        ? "border-zinc-900 dark:border-white bg-zinc-100 dark:bg-zinc-800"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                    }`}
                  >
                    <span className="text-xl">{r.icon}</span>
                    <span className="text-xs font-semibold mt-1 text-zinc-700 dark:text-zinc-300">{r.label}</span>
                    <span className="text-xs text-zinc-500">${r.basePrice}+</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between mb-4 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Estimated fare</span>
                <span className="text-lg font-bold text-zinc-900 dark:text-white">${estimatedFare}</span>
              </div>

              {bookingStatus && statusInfo && (
                <div className={`mb-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-sm font-semibold ${statusInfo.color}`}>
                  {statusInfo.label}
                </div>
              )}

              <button
                onClick={handleBook}
                disabled={loading}
                className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors disabled:opacity-60"
              >
                {loading ? "Finding driver…" : `Book ${selected.label}`}
              </button>
            </div>

            {/* Map + Features */}
            <div className="space-y-4">
              {/* Mock Map */}
              <div className="bg-gradient-to-br from-blue-50 to-green-50 dark:from-zinc-800 dark:to-zinc-700 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-6 h-48 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-8 left-12 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <div className="absolute top-16 left-24 w-1 h-16 bg-zinc-400 transform -rotate-12" />
                  <div className="absolute top-24 left-40 w-1 h-12 bg-zinc-400 transform rotate-6" />
                </div>
                <div className="text-center">
                  <p className="text-4xl mb-2">🗺️</p>
                  <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">Real-time GPS Map</p>
                  <p className="text-xs text-zinc-400">Driver & route tracking</p>
                </div>
              </div>

              {/* Features */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-3">Platform Features</h3>
                <ul className="grid grid-cols-2 gap-2">
                  {[
                    "Real-time GPS tracking",
                    "Dynamic surge pricing",
                    "Driver matching algorithm",
                    "Multiple ride types",
                    "Rating & review system",
                    "Scheduled rides",
                    "Premium services",
                    "Vehicle management",
                    "Insurance integration",
                    "Emergency SOS",
                    "In-app payments",
                    "Route optimization",
                  ].map((f) => (
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

        {/* ── Driver Tab ── */}
        {activeTab === "driver" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockDrivers.map((driver) => (
                <div key={driver.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{driver.name}</h3>
                      <p className="text-sm text-zinc-500">
                        ⭐ {driver.rating} · {driver.totalTrips.toLocaleString()} trips
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${driver.isOnline ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"}`}>
                      {driver.isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                    🚘 {driver.vehicle.year} {driver.vehicle.make} {driver.vehicle.model} · {driver.vehicle.color} · {driver.vehicle.licensePlate}
                  </div>
                  {/* Earnings */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Today", value: driver.earnings.today },
                      { label: "This Week", value: driver.earnings.thisWeek },
                      { label: "This Month", value: driver.earnings.thisMonth },
                      { label: "Lifetime", value: driver.earnings.totalLifetime },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3">
                        <p className="text-xs text-zinc-500">{label}</p>
                        <p className="text-base font-bold text-zinc-900 dark:text-white">
                          ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Fleet Tab ── */}
        {activeTab === "fleet" && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Fleet Management Dashboard</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Vehicles", value: "1,284", icon: "🚗" },
                { label: "Active Now", value: "847", icon: "🟢" },
                { label: "Rides Today", value: "12,430", icon: "📊" },
                { label: "Revenue Today", value: "$98,412", icon: "💰" },
              ].map(({ label, value, icon }) => (
                <div key={label} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4">
                  <p className="text-2xl mb-2">{icon}</p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-white">{value}</p>
                  <p className="text-xs text-zinc-500">{label}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Fleet Capabilities</h3>
              {[
                { feature: "Vehicle Management", desc: "Track, maintain, and manage your entire fleet" },
                { feature: "Insurance Integration", desc: "Real-time insurance verification and claims" },
                { feature: "Maintenance Tracking", desc: "Scheduled and reactive maintenance alerts" },
                { feature: "Driver Assignment", desc: "Smart matching of drivers to vehicles" },
              ].map(({ feature, desc }) => (
                <div key={feature} className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  <span className="text-green-500 font-bold text-sm mt-0.5">✓</span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{feature}</p>
                    <p className="text-xs text-zinc-500">{desc}</p>
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
