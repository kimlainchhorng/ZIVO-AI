"use client";

import { useState } from "react";
import Link from "next/link";

const dietaryFilters = ["All", "Vegan", "Vegetarian", "Gluten-Free", "Halal", "Kosher", "Keto", "Dairy-Free"];

const menuItems = [
  { id: 1, name: "Impossible Burger", restaurant: "GreenBite", price: 14.99, calories: 480, dietary: ["Vegan"], img: "🍔" },
  { id: 2, name: "Spicy Ramen Bowl", restaurant: "Tokyo Express", price: 12.99, calories: 620, dietary: ["Vegetarian"], img: "🍜" },
  { id: 3, name: "Grilled Salmon", restaurant: "Ocean Grill", price: 22.99, calories: 540, dietary: ["Gluten-Free"], img: "🐟" },
  { id: 4, name: "Margherita Pizza", restaurant: "Pizza Bella", price: 16.99, calories: 780, dietary: ["Vegetarian"], img: "🍕" },
  { id: 5, name: "Acai Bowl", restaurant: "FreshBar", price: 11.99, calories: 310, dietary: ["Vegan", "Gluten-Free"], img: "🥣" },
  { id: 6, name: "Keto Chicken Wrap", restaurant: "FitFood", price: 13.99, calories: 420, dietary: ["Keto", "Gluten-Free"], img: "🌯" },
];

const subscriptions = [
  { name: "DashPass", price: "$9.99/mo", perks: ["$0 delivery fees", "Reduced service fees", "Exclusive offers", "Priority support"] },
  { name: "Eats Pass", price: "$9.99/mo", perks: ["Free delivery on $15+", "5% off orders", "Members-only deals", "Cancel anytime"] },
  { name: "Corporate Dining", price: "Custom", perks: ["Team meal management", "Expense integration", "Budget controls", "Dedicated support"] },
];

export default function FoodDeliveryPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [cart, setCart] = useState<{ id: number; qty: number }[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

  const filtered = activeFilter === "All"
    ? menuItems
    : menuItems.filter((item) => item.dietary.includes(activeFilter));

  const cartTotal = cart.reduce((sum, ci) => {
    const item = menuItems.find((m) => m.id === ci.id);
    return sum + (item ? item.price * ci.qty : 0);
  }, 0);

  const addToCart = (id: number) => {
    setCart((c) => {
      const existing = c.find((ci) => ci.id === id);
      if (existing) return c.map((ci) => ci.id === id ? { ...ci, qty: ci.qty + 1 } : ci);
      return [...c, { id, qty: 1 }];
    });
  };

  const applyPromo = () => {
    if (promoCode.toUpperCase() === "ZIVO20") setPromoApplied(true);
  };

  const discount = promoApplied ? cartTotal * 0.2 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-orange-500 text-white py-10 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/services" className="text-orange-200 text-sm hover:text-white mb-2 block">← All Services</Link>
            <div className="flex items-center gap-3">
              <span className="text-4xl">🍔</span>
              <div>
                <h1 className="text-3xl font-bold">Food Delivery Platform</h1>
                <p className="text-orange-100">Multi-restaurant · Dietary filters · Subscriptions</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="bg-white text-orange-500 text-xs font-bold px-3 py-1 rounded-full">#54</span>
            {cart.length > 0 && (
              <span className="bg-white text-orange-600 text-xs font-bold px-3 py-1 rounded-full">
                🛒 {cart.reduce((s, c) => s + c.qty, 0)} items · ${cartTotal.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </header>

      <section className="py-8 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap gap-2 mb-6">
            {dietaryFilters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  activeFilter === f
                    ? "bg-orange-500 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-orange-300"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => {
              const inCart = cart.find((c) => c.id === item.id);
              return (
                <div key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="h-24 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg flex items-center justify-center text-4xl mb-3">
                    {item.img}
                  </div>
                  <h3 className="font-bold mb-0.5">{item.name}</h3>
                  <p className="text-gray-500 text-xs mb-2">{item.restaurant} · {item.calories} cal</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.dietary.map((d) => (
                      <span key={d} className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                        {d}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-orange-600">${item.price.toFixed(2)}</span>
                    <button
                      onClick={() => addToCart(item.id)}
                      className="bg-orange-500 text-white text-xs px-4 py-1.5 rounded-lg hover:bg-orange-600"
                    >
                      {inCart ? `Add More (${inCart.qty})` : "Add to Cart"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {cart.length > 0 && (
            <div className="mt-8 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-bold text-lg mb-4">Order Summary</h3>
              <div className="space-y-2 mb-4 text-sm">
                {cart.map((ci) => {
                  const item = menuItems.find((m) => m.id === ci.id)!;
                  return (
                    <div key={ci.id} className="flex justify-between">
                      <span>{item.name} × {ci.qty}</span>
                      <span>${(item.price * ci.qty).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Promo code (try ZIVO20)"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button onClick={applyPromo} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                  Apply
                </button>
              </div>
              {promoApplied && (
                <div className="text-green-600 text-sm mb-3">✓ 20% discount applied! Saving ${discount.toFixed(2)}</div>
              )}
              <div className="border-t pt-3">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${(cartTotal - discount + 1.99).toFixed(2)}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">Includes $1.99 delivery fee · Tax calculated at checkout</div>
              </div>
              <button className="w-full mt-4 bg-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-600">
                Place Order
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="py-12 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Subscription Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subscriptions.map((sub) => (
              <div key={sub.name} className="bg-orange-50 rounded-xl p-6 border border-orange-100">
                <h3 className="font-bold text-xl mb-1">{sub.name}</h3>
                <div className="text-orange-600 font-bold text-lg mb-4">{sub.price}</div>
                <ul className="space-y-2">
                  {sub.perks.map((perk) => (
                    <li key={perk} className="flex items-center gap-2 text-sm">
                      <span className="text-green-500">✓</span> {perk}
                    </li>
                  ))}
                </ul>
                <button className="mt-4 w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 text-sm">
                  Get Started
                </button>
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
