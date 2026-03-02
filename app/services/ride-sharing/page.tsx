"use client";

import { useState } from "react";
import Link from "next/link";

const rideTypes = [
  { id: "economy", name: "Economy", icon: "🚗", desc: "Affordable everyday rides", price: "~$1.20/mi", eta: "4 min" },
  { id: "xl", name: "XL", icon: "🚙", desc: "More space for groups up to 6", price: "~$1.75/mi", eta: "6 min" },
  { id: "pool", name: "Pool", icon: "🚌", desc: "Share your ride, save money", price: "~$0.80/mi", eta: "8 min" },
  { id: "premium", name: "Premium", icon: "🏎️", desc: "High-end cars, top-rated drivers", price: "~$2.50/mi", eta: "5 min" },
  { id: "blacklane", name: "Blacklane", icon: "✨", desc: "Professional chauffeur service", price: "Fixed pricing", eta: "Pre-book" },
  { id: "corporate", name: "Corporate", icon: "💼", desc: "Business accounts & expense tracking", price: "Corporate rate", eta: "On demand" },
];

const driverFeatures = [
  "Real-time GPS navigation",
  "Earnings dashboard",
  "Shift management",
  "Vehicle maintenance alerts",
  "In-app wallet & payouts",
  "Driver ratings",
  "Surge zone map",
  "Driver communication tools",
];

const advancedFeatures = [
  { icon: "🤖", title: "ML Driver Matching", desc: "AI pairs passengers with the best nearby driver based on ratings, ETA, and preferences." },
  { icon: "📈", title: "Surge Pricing Automation", desc: "Dynamic pricing adjusts in real-time based on supply/demand, traffic, and events." },
  { icon: "🗺️", title: "Route Optimization", desc: "Multi-stop route planning with live traffic integration and alternative suggestions." },
  { icon: "🌿", title: "Carbon Offset Tracking", desc: "Track and offset your trip emissions with integrated carbon credit purchases." },
  { icon: "♿", title: "Accessibility Features", desc: "Wheelchair accessible vehicles, assisted boarding, and hearing-impaired driver options." },
  { icon: "🚨", title: "SOS Emergency Button", desc: "One-tap emergency button connects to local emergency services with live location sharing." },
];

export default function RideSharingPage() {
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [selectedRide, setSelectedRide] = useState("economy");
  const [booked, setBooked] = useState(false);

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (pickup && dropoff) setBooked(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-black text-white py-10 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/services" className="text-gray-400 text-sm hover:text-white mb-2 block">← All Services</Link>
            <div className="flex items-center gap-3">
              <span className="text-4xl">🚗</span>
              <div>
                <h1 className="text-3xl font-bold">Ride-Sharing Empire</h1>
                <p className="text-gray-400">Uber · Lyft · Blacklane — All in one platform</p>
              </div>
            </div>
          </div>
          <span className="bg-white text-black text-xs font-bold px-3 py-1 rounded-full">#51</span>
        </div>
      </header>

      <section className="py-10 px-6 bg-white border-b">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Book a Ride</h2>
          {!booked ? (
            <form onSubmit={handleBook} className="bg-gray-50 rounded-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
                  <input
                    type="text"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    placeholder="Enter pickup address"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dropoff Location</label>
                  <input
                    type="text"
                    value={dropoff}
                    onChange={(e) => setDropoff(e.target.value)}
                    placeholder="Enter destination"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  />
                </div>
              </div>
              <h3 className="font-semibold mb-3">Select Ride Type</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {rideTypes.map((ride) => (
                  <button
                    key={ride.id}
                    type="button"
                    onClick={() => setSelectedRide(ride.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedRide === ride.id
                        ? "border-black bg-black text-white"
                        : "border-gray-200 bg-white hover:border-gray-400"
                    }`}
                  >
                    <div className="text-2xl mb-1">{ride.icon}</div>
                    <div className="font-bold text-sm">{ride.name}</div>
                    <div className={`text-xs mt-1 ${selectedRide === ride.id ? "text-gray-300" : "text-gray-500"}`}>{ride.price}</div>
                    <div className={`text-xs ${selectedRide === ride.id ? "text-gray-300" : "text-gray-400"}`}>ETA: {ride.eta}</div>
                  </button>
                ))}
              </div>
              <button
                type="submit"
                className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors"
              >
                Book Ride
              </button>
            </form>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-2xl font-bold text-green-800 mb-2">Ride Booked!</h3>
              <p className="text-green-700 mb-1">
                <strong>{pickup}</strong> → <strong>{dropoff}</strong>
              </p>
              <p className="text-green-600 mb-4">Driver is on the way · ETA: 4 min</p>
              <div className="flex justify-center gap-3">
                <button className="bg-black text-white px-6 py-2 rounded-xl text-sm font-semibold">Track Driver</button>
                <button
                  onClick={() => setBooked(false)}
                  className="border border-gray-300 px-6 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50"
                >
                  Book Another
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Advanced Platform Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advancedFeatures.map((feat) => (
              <div key={feat.title} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <div className="text-3xl mb-3">{feat.icon}</div>
                <h3 className="font-bold mb-2">{feat.title}</h3>
                <p className="text-gray-600 text-sm">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Driver App Features</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {driverFeatures.map((feat) => (
              <div key={feat} className="flex items-center gap-2 bg-gray-50 rounded-xl p-4 text-sm">
                <span className="text-green-500 font-bold">✓</span>
                <span>{feat}</span>
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
