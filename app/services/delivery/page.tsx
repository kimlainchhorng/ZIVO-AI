"use client";

import { useState } from "react";
import Link from "next/link";

const restaurants = [
  { id: 1, name: "Burger Palace", cuisine: "American", rating: 4.8, time: "20-30 min", fee: "$1.99", min: "$10", tags: ["Popular", "Burgers"] },
  { id: 2, name: "Sakura Sushi", cuisine: "Japanese", rating: 4.9, time: "25-40 min", fee: "$2.49", min: "$15", tags: ["Sushi", "Healthy"] },
  { id: 3, name: "Pizza Bella", cuisine: "Italian", rating: 4.7, time: "30-45 min", fee: "$1.49", min: "$12", tags: ["Pizza", "Family"] },
  { id: 4, name: "Taco Fiesta", cuisine: "Mexican", rating: 4.6, time: "15-25 min", fee: "$0.99", min: "$8", tags: ["Mexican", "Fast"] },
  { id: 5, name: "Green Bowl", cuisine: "Healthy", rating: 4.9, time: "20-30 min", fee: "$2.99", min: "$14", tags: ["Vegan", "Healthy"] },
  { id: 6, name: "Dragon Wok", cuisine: "Chinese", rating: 4.5, time: "25-35 min", fee: "$1.99", min: "$12", tags: ["Chinese", "Noodles"] },
];

const orderStatuses = ["Order Placed", "Confirmed by Restaurant", "Preparing", "Driver Picked Up", "On the Way", "Delivered"];

const features = [
  { icon: "🍽️", title: "Restaurant Onboarding", desc: "Streamlined menu management, KDS integration, and real-time inventory sync." },
  { icon: "📡", title: "Real-time Order Tracking", desc: "Live GPS map showing driver location with ETA updates every 30 seconds." },
  { icon: "⭐", title: "Rating & Review System", desc: "Post-delivery ratings for food quality, packaging, and delivery speed." },
  { icon: "💰", title: "Driver Earnings & Incentives", desc: "Transparent earnings dashboard with surge bonuses and performance rewards." },
  { icon: "🗺️", title: "Route Optimization", desc: "Multi-stop batching with ML-optimized delivery sequences for faster ETAs." },
  { icon: "📊", title: "Analytics Dashboard", desc: "Restaurant sales reports, peak time analysis, and revenue tracking." },
];

export default function DeliveryPage() {
  const [activeTab, setActiveTab] = useState<"order" | "track">("order");
  const [cart, setCart] = useState<number[]>([]);
  const [trackingStep, setTrackingStep] = useState(2);
  const [filter, setFilter] = useState("");

  const filteredRestaurants = filter
    ? restaurants.filter((r) =>
        r.cuisine.toLowerCase().includes(filter.toLowerCase()) ||
        r.name.toLowerCase().includes(filter.toLowerCase()) ||
        r.tags.some((t) => t.toLowerCase().includes(filter.toLowerCase()))
      )
    : restaurants;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-red-600 text-white py-10 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/services" className="text-red-200 text-sm hover:text-white mb-2 block">← All Services</Link>
            <div className="flex items-center gap-3">
              <span className="text-4xl">🛵</span>
              <div>
                <h1 className="text-3xl font-bold">Delivery Services</h1>
                <p className="text-red-200">DoorDash · UberEats · Grubhub — All platforms</p>
              </div>
            </div>
          </div>
          <span className="bg-white text-red-600 text-xs font-bold px-3 py-1 rounded-full">#53</span>
        </div>
      </header>

      <div className="bg-white border-b px-6">
        <div className="max-w-5xl mx-auto flex">
          {(["order", "track"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 font-semibold text-sm border-b-2 transition-colors capitalize ${
                activeTab === tab ? "border-red-600 text-red-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "order" ? "🍔 Order Food" : "📍 Track Order"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "order" && (
        <section className="py-8 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex gap-3 mb-6">
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search restaurants, cuisines..."
                className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              {cart.length > 0 && (
                <button className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold text-sm">
                  Cart ({cart.length})
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRestaurants.map((r) => (
                <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="h-32 bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center text-5xl">
                    🍽️
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-bold">{r.name}</h3>
                      <span className="text-xs text-yellow-600 font-semibold">⭐ {r.rating}</span>
                    </div>
                    <p className="text-gray-500 text-xs mb-2">{r.cuisine} · {r.time}</p>
                    <div className="flex gap-1 mb-3">
                      {r.tags.map((tag) => (
                        <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Fee: {r.fee} · Min: {r.min}</span>
                      <button
                        onClick={() => setCart((c) => [...c, r.id])}
                        className="bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-700"
                      >
                        Order
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {activeTab === "track" && (
        <section className="py-8 px-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="font-bold text-xl mb-2">Order #DR-8834</h2>
              <p className="text-gray-500 text-sm mb-6">Burger Palace · Estimated: 12 min remaining</p>
              <div className="space-y-3 mb-6">
                {orderStatuses.map((status, i) => (
                  <div key={status} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i <= trackingStep ? "bg-red-600 text-white" : "bg-gray-200 text-gray-400"
                    }`}>
                      {i <= trackingStep ? "✓" : i + 1}
                    </div>
                    <span className={`text-sm ${i <= trackingStep ? "font-semibold text-gray-900" : "text-gray-400"}`}>
                      {status}
                    </span>
                    {i === trackingStep && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Current</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setTrackingStep((s) => Math.min(s + 1, orderStatuses.length - 1))}
                  className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-red-700"
                >
                  Simulate Next Step
                </button>
                <button className="px-4 py-3 border border-gray-300 rounded-xl text-sm hover:bg-gray-50">
                  Contact Driver
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="py-12 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Platform Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat) => (
              <div key={feat.title} className="bg-red-50 rounded-xl p-5">
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
