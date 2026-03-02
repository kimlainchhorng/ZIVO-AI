"use client";

import { useState } from "react";
import Link from "next/link";
import type { Restaurant } from "@/lib/services-types";

const mockRestaurants: Restaurant[] = [
  {
    id: "r1",
    name: "Bella Napoli",
    cuisine: ["Italian", "Pizza"],
    rating: 4.8,
    reviewCount: 2341,
    deliveryTime: 28,
    deliveryFee: 1.99,
    minimumOrder: 15,
    isOpen: true,
    address: "742 Evergreen Terrace, Springfield",
    menu: [
      {
        id: "c1",
        name: "Pizzas",
        items: [
          { id: "m1", name: "Margherita", description: "Tomato, fresh mozzarella, basil", price: 14.99, calories: 820, allergens: ["gluten", "dairy"], isAvailable: true },
          { id: "m2", name: "Pepperoni", description: "Classic pepperoni with marinara", price: 16.99, calories: 950, allergens: ["gluten", "dairy"], isAvailable: true },
        ],
      },
      {
        id: "c2",
        name: "Pasta",
        items: [
          { id: "m3", name: "Carbonara", description: "Spaghetti, egg yolk, pecorino, guanciale", price: 18.99, calories: 760, allergens: ["gluten", "dairy", "eggs"], isAvailable: true },
        ],
      },
    ],
  },
  {
    id: "r2",
    name: "Dragon Palace",
    cuisine: ["Chinese", "Dim Sum"],
    rating: 4.6,
    reviewCount: 1870,
    deliveryTime: 35,
    deliveryFee: 2.49,
    minimumOrder: 20,
    isOpen: true,
    address: "88 Dragon Lane, Chinatown",
    menu: [
      {
        id: "c3",
        name: "Dim Sum",
        items: [
          { id: "m4", name: "Har Gow", description: "Steamed shrimp dumplings (4 pcs)", price: 8.99, calories: 180, allergens: ["gluten", "shellfish"], isAvailable: true },
          { id: "m5", name: "BBQ Pork Buns", description: "Fluffy steamed char siu bao (3 pcs)", price: 7.99, calories: 210, allergens: ["gluten"], isAvailable: true },
        ],
      },
    ],
  },
];

export default function FoodPage() {
  const [activeTab, setActiveTab] = useState<"order" | "track" | "restaurant">("order");
  const [cart, setCart] = useState<{ id: string; name: string; price: number; qty: number }[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [loading, setLoading] = useState(false);

  const restaurant = mockRestaurants.find((r) => r.id === selectedRestaurant);
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryFee = restaurant?.deliveryFee ?? 0;
  const total = subtotal + deliveryFee + 0.99;

  function addToCart(itemId: string, name: string, price: number) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === itemId);
      if (existing) return prev.map((i) => i.id === itemId ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: itemId, name, price, qty: 1 }];
    });
  }

  async function placeOrder() {
    setLoading(true);
    try {
      await fetch("/api/food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId: selectedRestaurant, items: cart }),
      });
    } catch { /* intentional */ }
    setOrderPlaced(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🍔</span>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Food Delivery</h1>
            <p className="text-xs text-zinc-500">DoorDash / UberEats style platform</p>
          </div>
        </div>
        <Link href="/services" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white">← Services</Link>
      </header>

      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 flex gap-6">
          {(["order", "track", "restaurant"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`py-3 text-sm font-semibold capitalize border-b-2 transition-colors ${activeTab === tab ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white" : "border-transparent text-zinc-500 hover:text-zinc-700"}`}>
              {tab === "order" ? "🍽️ Order Food" : tab === "track" ? "📍 Track Order" : "🏪 Restaurant Portal"}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {activeTab === "order" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Restaurant List */}
            <div className="md:col-span-2 space-y-4">
              {!selectedRestaurant ? (
                <>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Restaurants Near You</h2>
                  {mockRestaurants.map((r) => (
                    <button key={r.id} onClick={() => setSelectedRestaurant(r.id)} className="w-full text-left bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-base font-bold text-zinc-900 dark:text-white">{r.name}</h3>
                          <p className="text-sm text-zinc-500 mt-0.5">{r.cuisine.join(" · ")}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                            <span>⭐ {r.rating} ({r.reviewCount.toLocaleString()})</span>
                            <span>🕐 {r.deliveryTime} min</span>
                            <span>🛵 ${r.deliveryFee} delivery</span>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${r.isOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                          {r.isOpen ? "Open" : "Closed"}
                        </span>
                      </div>
                    </button>
                  ))}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <button onClick={() => { setSelectedRestaurant(null); setCart([]); }} className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white">← Back</button>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{restaurant?.name}</h2>
                  </div>
                  {restaurant?.menu.map((cat) => (
                    <div key={cat.id}>
                      <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">{cat.name}</h3>
                      <div className="space-y-2">
                        {cat.items.map((item) => (
                          <div key={item.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-zinc-900 dark:text-white">{item.name}</p>
                              <p className="text-xs text-zinc-500 mt-0.5">{item.description}</p>
                              {item.calories && <p className="text-xs text-zinc-400 mt-0.5">{item.calories} cal</p>}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold text-zinc-900 dark:text-white">${item.price}</span>
                              <button onClick={() => addToCart(item.id, item.name, item.price)} className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-lg leading-none hover:bg-zinc-700 transition-colors">+</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Cart */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 h-fit sticky top-6">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-4">🛒 Your Cart</h3>
              {cart.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-8">Add items to get started</p>
              ) : (
                <>
                  <div className="space-y-2 mb-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span className="text-zinc-700 dark:text-zinc-300">{item.qty}× {item.name}</span>
                        <span className="font-semibold text-zinc-900 dark:text-white">${(item.price * item.qty).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between text-zinc-500"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-zinc-500"><span>Delivery fee</span><span>${deliveryFee.toFixed(2)}</span></div>
                    <div className="flex justify-between text-zinc-500"><span>Service fee</span><span>$0.99</span></div>
                    <div className="flex justify-between font-bold text-zinc-900 dark:text-white pt-1 border-t border-zinc-100 dark:border-zinc-800"><span>Total</span><span>${total.toFixed(2)}</span></div>
                  </div>
                  {orderPlaced ? (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-center text-sm font-semibold text-green-700 dark:text-green-400">
                      🎉 Order placed! Preparing now…
                    </div>
                  ) : (
                    <button onClick={placeOrder} disabled={loading} className="mt-4 w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm hover:bg-zinc-700 transition-colors disabled:opacity-60">
                      {loading ? "Placing order…" : "Place Order"}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === "track" && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Order Tracking</h2>
            <div className="space-y-4">
              {[
                { step: "Order Placed", done: true, time: "12:30 PM" },
                { step: "Restaurant Confirmed", done: true, time: "12:32 PM" },
                { step: "Preparing Your Order", done: true, time: "12:35 PM" },
                { step: "Driver Assigned", done: false, time: "" },
                { step: "Picked Up", done: false, time: "" },
                { step: "Delivered", done: false, time: "" },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${s.done ? "bg-green-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"}`}>
                    {s.done ? "✓" : i + 1}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${s.done ? "text-zinc-900 dark:text-white" : "text-zinc-400"}`}>{s.step}</p>
                    {s.time && <p className="text-xs text-zinc-400">{s.time}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "restaurant" && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Restaurant Dashboard</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Orders Today", value: "127", icon: "📋" },
                { label: "Revenue Today", value: "$3,842", icon: "💰" },
                { label: "Avg Rating", value: "4.8 ⭐", icon: "⭐" },
                { label: "Active Drivers", value: "8", icon: "🛵" },
              ].map(({ label, value, icon }) => (
                <div key={label} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 text-center">
                  <p className="text-2xl mb-1">{icon}</p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-white">{value}</p>
                  <p className="text-xs text-zinc-500">{label}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Recent Orders</h3>
              {[
                { id: "#4521", items: "Margherita × 2, Carbonara × 1", status: "Preparing", time: "5 min ago" },
                { id: "#4520", items: "Pepperoni × 1", status: "Ready", time: "12 min ago" },
                { id: "#4519", items: "Har Gow × 2, BBQ Buns × 3", status: "Picked Up", time: "18 min ago" },
              ].map((o) => (
                <div key={o.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm">
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-white">{o.id} · {o.items}</p>
                    <p className="text-xs text-zinc-400">{o.time}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${o.status === "Ready" ? "bg-green-100 text-green-700" : o.status === "Picked Up" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {o.status}
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
