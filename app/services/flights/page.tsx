"use client";

import { useState } from "react";
import Link from "next/link";
import type { CabinClass, Flight } from "@/lib/services-types";

const cabinClasses: { value: CabinClass; label: string }[] = [
  { value: "economy", label: "Economy" },
  { value: "premium_economy", label: "Premium Economy" },
  { value: "business", label: "Business" },
  { value: "first", label: "First Class" },
];

const mockFlights: Flight[] = [
  {
    id: "f1",
    flightNumber: "UA 123",
    airline: "United Airlines",
    origin: "SFO",
    destination: "JFK",
    departureTime: "2026-03-10T08:30:00Z",
    arrivalTime: "2026-03-10T17:05:00Z",
    duration: 335,
    stops: 0,
    price: 289,
    cabinClass: "economy",
    seatsAvailable: 42,
    status: "scheduled",
    amenities: ["Wi-Fi", "USB Power", "Meal Service"],
  },
  {
    id: "f2",
    flightNumber: "DL 456",
    airline: "Delta Air Lines",
    origin: "SFO",
    destination: "JFK",
    departureTime: "2026-03-10T11:15:00Z",
    arrivalTime: "2026-03-10T19:50:00Z",
    duration: 335,
    stops: 0,
    price: 315,
    cabinClass: "economy",
    seatsAvailable: 18,
    status: "scheduled",
    amenities: ["Wi-Fi", "Streaming Entertainment", "USB Power"],
  },
  {
    id: "f3",
    flightNumber: "AA 789",
    airline: "American Airlines",
    origin: "SFO",
    destination: "JFK",
    departureTime: "2026-03-10T14:00:00Z",
    arrivalTime: "2026-03-10T22:30:00Z",
    duration: 330,
    stops: 1,
    price: 198,
    cabinClass: "economy",
    seatsAvailable: 65,
    status: "scheduled",
    amenities: ["USB Power", "Snack Service"],
  },
];

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export default function FlightsPage() {
  const [origin, setOrigin] = useState("SFO");
  const [destination, setDestination] = useState("JFK");
  const [date, setDate] = useState("2026-03-10");
  const [passengers, setPassengers] = useState(1);
  const [cabinClass, setCabinClass] = useState<CabinClass>("economy");
  const [results, setResults] = useState<Flight[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"search" | "manage" | "alerts">("search");

  async function handleSearch() {
    setLoading(true);
    try {
      const res = await fetch("/api/flights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, destination, departureDate: date, passengers, cabinClass }),
      });
      const data = await res.json();
      setResults(data.flights ?? mockFlights);
    } catch {
      setResults(mockFlights);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✈️</span>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Flight Booking</h1>
            <p className="text-xs text-zinc-500">Multi-airline · Seat selection · Travel insurance</p>
          </div>
        </div>
        <Link href="/services" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white">← Services</Link>
      </header>

      {/* Tabs */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 flex gap-6">
          {(["search", "manage", "alerts"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-sm font-semibold capitalize border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white"
                  : "border-transparent text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {tab === "search" ? "🔍 Search" : tab === "manage" ? "📋 Manage Bookings" : "🔔 Price Alerts"}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {activeTab === "search" && (
          <div className="space-y-6">
            {/* Search Form */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Search Flights</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">From</label>
                  <input
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                    maxLength={3}
                    className="mt-1 w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">To</label>
                  <input
                    value={destination}
                    onChange={(e) => setDestination(e.target.value.toUpperCase())}
                    maxLength={3}
                    className="mt-1 w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1 w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Passengers</label>
                  <input
                    type="number"
                    min={1}
                    max={9}
                    value={passengers}
                    onChange={(e) => setPassengers(Number(e.target.value))}
                    className="mt-1 w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {cabinClasses.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setCabinClass(value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                      cabinClass === value
                        ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent"
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                onClick={handleSearch}
                disabled={loading}
                className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors disabled:opacity-60"
              >
                {loading ? "Searching flights…" : "Search Flights"}
              </button>
            </div>

            {/* Results */}
            {results && (
              <div className="space-y-3">
                <p className="text-sm text-zinc-500">{results.length} flights found · {origin} → {destination}</p>
                {results.map((flight) => (
                  <div
                    key={flight.id}
                    onClick={() => setSelected(selected === flight.id ? null : flight.id)}
                    className={`bg-white dark:bg-zinc-900 rounded-2xl border-2 transition-all cursor-pointer p-5 ${
                      selected === flight.id
                        ? "border-zinc-900 dark:border-white"
                        : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-lg font-bold text-zinc-900 dark:text-white">{formatTime(flight.departureTime)}</p>
                          <p className="text-xs text-zinc-500">{flight.origin}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-zinc-400">{formatDuration(flight.duration)}</p>
                          <div className="flex items-center gap-1 my-1">
                            <div className="w-8 h-px bg-zinc-300" />
                            <span className="text-xs text-zinc-400">✈️</span>
                            <div className="w-8 h-px bg-zinc-300" />
                          </div>
                          <p className="text-xs text-zinc-400">{flight.stops === 0 ? "Nonstop" : `${flight.stops} stop`}</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-zinc-900 dark:text-white">{formatTime(flight.arrivalTime)}</p>
                          <p className="text-xs text-zinc-500">{flight.destination}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-extrabold text-zinc-900 dark:text-white">${flight.price}</p>
                        <p className="text-xs text-zinc-500">per person</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{flight.seatsAvailable} seats left</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-zinc-500">{flight.airline}</span>
                      <span className="text-zinc-300 dark:text-zinc-600">·</span>
                      <span className="text-xs text-zinc-500">{flight.flightNumber}</span>
                      {flight.amenities.map((a) => (
                        <span key={a} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs">
                          {a}
                        </span>
                      ))}
                    </div>
                    {selected === flight.id && (
                      <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-3">
                        <button className="flex-1 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-bold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors">
                          Select Seat &amp; Book
                        </button>
                        <button className="px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 transition-colors">
                          Add Travel Insurance
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "manage" && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Manage Bookings</h2>
            <div className="space-y-3">
              {[
                { pnr: "ZIVO01", route: "SFO → JFK", date: "Mar 10, 2026", status: "Confirmed", flight: "UA 123" },
                { pnr: "ZIVO02", route: "JFK → LAX", date: "Mar 15, 2026", status: "Checked In", flight: "DL 456" },
              ].map((b) => (
                <div key={b.pnr} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{b.route} · {b.flight}</p>
                    <p className="text-xs text-zinc-500">{b.date} · PNR: {b.pnr}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      b.status === "Checked In" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {b.status}
                    </span>
                    <button className="px-3 py-1.5 text-xs font-medium border border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-zinc-400 text-zinc-600 dark:text-zinc-400 transition-colors">
                      Manage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "alerts" && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Price Alerts</h2>
            <p className="text-sm text-zinc-500 mb-6">Get notified when prices drop for your routes.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { route: "SFO → JFK", current: "$289", alert: "$250", saved: "-$39" },
                { route: "LAX → LHR", current: "$672", alert: "$600", saved: "-$72" },
              ].map((a) => (
                <div key={a.route} className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">{a.route}</p>
                  <p className="text-xs text-zinc-500 mt-1">Current: {a.current} · Alert: {a.alert}</p>
                  <p className="text-xs text-green-600 font-semibold mt-1">Potential savings: {a.saved}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
