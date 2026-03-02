"use client";

import { useState } from "react";
import Link from "next/link";

const tripTypes = ["One Way", "Round Trip", "Multi-City"];

const popularRoutes = [
  { from: "New York (JFK)", to: "London (LHR)", price: "$480", duration: "7h 30m", airline: "British Airways" },
  { from: "Los Angeles (LAX)", to: "Tokyo (NRT)", price: "$620", duration: "11h 15m", airline: "Japan Airlines" },
  { from: "San Francisco (SFO)", to: "Paris (CDG)", price: "$550", duration: "10h 45m", airline: "Air France" },
  { from: "Chicago (ORD)", to: "Dubai (DXB)", price: "$710", duration: "13h 20m", airline: "Emirates" },
];

const travelPackages = [
  { icon: "🌺", name: "Honeymoon Package", desc: "Flight + 5-star hotel + transfers + activities", price: "From $2,499" },
  { icon: "👨‍👩‍👧‍👦", name: "Family Package", desc: "Group flights + family resort + kids activities", price: "From $3,299" },
  { icon: "💼", name: "Corporate Travel", desc: "Business class + lounge access + expense reports", price: "Custom pricing" },
  { icon: "🎒", name: "Adventure Package", desc: "Flexible flights + eco-lodges + guided tours", price: "From $1,899" },
  { icon: "✨", name: "Luxury Package", desc: "First class + 5-star hotels + private transfers", price: "From $5,999" },
  { icon: "💰", name: "Budget Package", desc: "Economy flights + hostels + city passes", price: "From $699" },
];

const flightFeatures = [
  { icon: "🔍", title: "Smart Flight Search", desc: "Search across 500+ airlines with flexible date grids and price calendars." },
  { icon: "💺", title: "Seat Selection", desc: "Interactive seat maps with legroom info, window/aisle preferences, and upgrades." },
  { icon: "🧳", title: "Baggage Management", desc: "Add bags, track allowances, and manage special luggage across all airlines." },
  { icon: "🔔", title: "Price Alerts", desc: "Set price drop alerts and get notified when fares hit your target price." },
  { icon: "📱", title: "Mobile Boarding Pass", desc: "Digital boarding passes with real-time gate updates and push notifications." },
  { icon: "🔄", title: "Cancellation & Rebooking", desc: "Easy rebooking, credit management, and refund processing for disruptions." },
];

export default function FlightsPage() {
  const [tripType, setTripType] = useState("Round Trip");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departDate, setDepartDate] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-700 text-white py-10 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/services" className="text-blue-200 text-sm hover:text-white mb-2 block">← All Services</Link>
            <div className="flex items-center gap-3">
              <span className="text-4xl">✈️</span>
              <div>
                <h1 className="text-3xl font-bold">Flight Booking & Travel</h1>
                <p className="text-blue-200">500+ airlines · Travel packages · Loyalty rewards</p>
              </div>
            </div>
          </div>
          <span className="bg-white text-blue-700 text-xs font-bold px-3 py-1 rounded-full">#52</span>
        </div>
      </header>

      <section className="py-10 px-6 bg-white border-b">
        <div className="max-w-5xl mx-auto">
          <div className="flex gap-2 mb-6">
            {tripTypes.map((t) => (
              <button
                key={t}
                onClick={() => setTripType(t)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  tripType === t ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <form onSubmit={handleSearch} className="bg-gray-50 rounded-2xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="City or airport"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="City or airport"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departure Date</label>
                <input
                  type="date"
                  value={departDate}
                  onChange={(e) => setDepartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors"
            >
              Search Flights
            </button>
          </form>

          {searched && (
            <div className="mt-6">
              <h3 className="font-bold text-lg mb-4">Available Flights: {origin} → {destination}</h3>
              <div className="space-y-3">
                {popularRoutes.map((route) => (
                  <div key={route.from} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                      <div className="font-semibold">{route.airline}</div>
                      <div className="text-sm text-gray-500">{route.duration} · Non-stop</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-blue-600">{route.price}</div>
                      <button className="mt-1 bg-blue-600 text-white text-xs px-4 py-1.5 rounded-lg hover:bg-blue-700">
                        Select
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Travel Packages</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {travelPackages.map((pkg) => (
              <div key={pkg.name} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{pkg.icon}</div>
                <h3 className="font-bold mb-1">{pkg.name}</h3>
                <p className="text-gray-500 text-sm mb-3">{pkg.desc}</p>
                <div className="font-bold text-blue-600">{pkg.price}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Platform Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flightFeatures.map((feat) => (
              <div key={feat.title} className="bg-blue-50 rounded-xl p-5">
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
