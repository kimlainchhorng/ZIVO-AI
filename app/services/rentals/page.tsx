"use client";

import { useState } from "react";
import Link from "next/link";
import type { VehicleCategory, RentalCar } from "@/lib/services-types";

const mockCars: RentalCar[] = [
  {
    id: "c1",
    make: "Toyota",
    model: "Corolla",
    year: 2024,
    category: "economy",
    seats: 5,
    transmission: "automatic",
    fuelType: "gasoline",
    dailyRate: 45,
    isAvailable: true,
    location: "SFO Airport",
    mileageLimit: 250,
    features: ["Bluetooth", "Backup Camera", "Cruise Control"],
    gpsEnabled: true,
  },
  {
    id: "c2",
    make: "Ford",
    model: "Explorer",
    year: 2024,
    category: "suv",
    seats: 7,
    transmission: "automatic",
    fuelType: "gasoline",
    dailyRate: 89,
    isAvailable: true,
    location: "SFO Airport",
    mileageLimit: 300,
    features: ["3rd Row Seating", "Navigation", "Heated Seats", "Apple CarPlay"],
    gpsEnabled: true,
  },
  {
    id: "c3",
    make: "Tesla",
    model: "Model Y",
    year: 2024,
    category: "electric",
    seats: 5,
    transmission: "automatic",
    fuelType: "electric",
    dailyRate: 125,
    isAvailable: false,
    location: "SFO Airport",
    mileageLimit: 350,
    features: ["Autopilot", "17\" Touchscreen", "Over-the-Air Updates", "Supercharger Network"],
    gpsEnabled: true,
  },
  {
    id: "c4",
    make: "BMW",
    model: "5 Series",
    year: 2024,
    category: "luxury",
    seats: 5,
    transmission: "automatic",
    fuelType: "gasoline",
    dailyRate: 165,
    isAvailable: true,
    location: "SFO Airport",
    mileageLimit: 200,
    features: ["Leather Seats", "Harman Kardon Audio", "Night Vision", "Parking Assistant"],
    gpsEnabled: true,
  },
];

const categoryLabels: Record<VehicleCategory, string> = {
  economy: "Economy",
  compact: "Compact",
  midsize: "Midsize",
  fullsize: "Full-size",
  suv: "SUV",
  luxury: "Luxury",
  van: "Van",
  truck: "Truck",
  electric: "Electric",
};

const categoryIcons: Record<VehicleCategory, string> = {
  economy: "🚗",
  compact: "🚗",
  midsize: "🚘",
  fullsize: "🚘",
  suv: "🚙",
  luxury: "🏎️",
  van: "🚐",
  truck: "🛻",
  electric: "⚡",
};

export default function RentalsPage() {
  const [activeTab, setActiveTab] = useState<"browse" | "manage" | "fleet">("browse");
  const [pickupDate, setPickupDate] = useState("2026-03-10");
  const [dropoffDate, setDropoffDate] = useState("2026-03-13");
  const [selectedCar, setSelectedCar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [booked, setBooked] = useState<string | null>(null);

  const car = mockCars.find((c) => c.id === selectedCar);
  const days = Math.max(1, (new Date(dropoffDate).getTime() - new Date(pickupDate).getTime()) / (1000 * 60 * 60 * 24));

  async function handleBook() {
    if (!selectedCar || !car) return;
    setLoading(true);
    try {
      await fetch("/api/rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carId: selectedCar, pickupDate, dropoffDate }),
      });
    } catch { /* intentional */ }
    setBooked(selectedCar);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚙</span>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Rental Cars</h1>
            <p className="text-xs text-zinc-500">Fleet management · License verification · GPS tracking</p>
          </div>
        </div>
        <Link href="/services" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white">← Services</Link>
      </header>

      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 flex gap-6">
          {(["browse", "manage", "fleet"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`py-3 text-sm font-semibold capitalize border-b-2 transition-colors ${activeTab === tab ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white" : "border-transparent text-zinc-500 hover:text-zinc-700"}`}>
              {tab === "browse" ? "🔍 Browse" : tab === "manage" ? "📋 My Rentals" : "🏢 Fleet Admin"}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {activeTab === "browse" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Pickup</label>
                  <input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Return</label>
                  <input type="date" value={dropoffDate} onChange={(e) => setDropoffDate(e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Location</label>
                  <input defaultValue="SFO Airport" className="mt-1 w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900" />
                </div>
                <div className="flex items-end">
                  <button className="w-full py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-bold hover:bg-zinc-700 transition-colors">Search</button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockCars.map((car) => (
                <div key={car.id} className={`bg-white dark:bg-zinc-900 rounded-2xl border-2 transition-all p-5 ${!car.isAvailable ? "opacity-50" : selectedCar === car.id ? "border-zinc-900 dark:border-white" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 cursor-pointer"}`}
                  onClick={() => car.isAvailable && setSelectedCar(car.id === selectedCar ? null : car.id)}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{categoryIcons[car.category]}</span>
                        <h3 className="text-base font-bold text-zinc-900 dark:text-white">{car.year} {car.make} {car.model}</h3>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">{categoryLabels[car.category]} · {car.seats} seats · {car.transmission}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${car.isAvailable ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"}`}>
                      {car.isAvailable ? "Available" : "Rented"}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {car.features.map((f) => (
                      <span key={f} className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full text-xs">{f}</span>
                    ))}
                    {car.gpsEnabled && <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs">📍 GPS</span>}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xl font-extrabold text-zinc-900 dark:text-white">${car.dailyRate}</span>
                      <span className="text-xs text-zinc-500">/day</span>
                    </div>
                    <div className="text-xs text-zinc-400">{car.mileageLimit} mi/day · {car.fuelType}</div>
                  </div>

                  {selectedCar === car.id && car.isAvailable && (
                    <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center justify-between mb-3 text-sm">
                        <span className="text-zinc-600 dark:text-zinc-400">{days} days × ${car.dailyRate}/day</span>
                        <span className="font-bold text-zinc-900 dark:text-white">${(days * car.dailyRate).toFixed(2)}</span>
                      </div>
                      {booked === car.id ? (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-center text-sm font-semibold text-green-700 dark:text-green-400">
                          🎉 Reservation confirmed!
                        </div>
                      ) : (
                        <button onClick={handleBook} disabled={loading} className="w-full py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-60">
                          {loading ? "Booking…" : "Reserve This Car"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "manage" && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">My Rentals</h2>
            <div className="space-y-3">
              {[
                { id: "RNT-001", car: "2024 Toyota Corolla", dates: "Mar 10–13, 2026", status: "Upcoming", total: "$135" },
                { id: "RNT-002", car: "2024 Ford Explorer", dates: "Feb 20–23, 2026", status: "Completed", total: "$267" },
              ].map((r) => (
                <div key={r.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{r.car} · {r.id}</p>
                    <p className="text-xs text-zinc-500">{r.dates} · {r.total}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${r.status === "Upcoming" ? "bg-blue-100 text-blue-700" : "bg-zinc-100 text-zinc-500"}`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "fleet" && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Fleet Administration</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Total Fleet", value: "342", icon: "🚗" },
                { label: "Currently Rented", value: "218", icon: "🔑" },
                { label: "Avg Utilization", value: "63.7%", icon: "📊" },
                { label: "Monthly Revenue", value: "$284K", icon: "💰" },
              ].map(({ label, value, icon }) => (
                <div key={label} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 text-center">
                  <p className="text-2xl mb-1">{icon}</p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-white">{value}</p>
                  <p className="text-xs text-zinc-500">{label}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Maintenance Due</h3>
              {[
                { vehicle: "2022 Honda Civic · PLT-4421", due: "Oil change due in 500 miles", urgency: "Soon" },
                { vehicle: "2021 Chevy Malibu · PLT-3312", due: "Brake inspection overdue", urgency: "Urgent" },
              ].map((m) => (
                <div key={m.vehicle} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">{m.vehicle}</p>
                    <p className="text-xs text-zinc-500">{m.due}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${m.urgency === "Urgent" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {m.urgency}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
