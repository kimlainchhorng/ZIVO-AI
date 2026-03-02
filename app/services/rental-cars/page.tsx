"use client";

import { useState } from "react";
import Link from "next/link";

const vehicleCategories = [
  { id: "economy", name: "Economy", icon: "🚗", examples: "Corolla, Civic", seats: 5, bags: 2, price: 39, mpg: 35 },
  { id: "compact", name: "Compact", icon: "🚙", examples: "Jetta, Elantra", seats: 5, bags: 2, price: 49, mpg: 32 },
  { id: "midsize", name: "Mid-size", icon: "🚘", examples: "Camry, Accord", seats: 5, bags: 3, price: 64, mpg: 30 },
  { id: "suv", name: "SUV", icon: "🛻", examples: "RAV4, CR-V", seats: 7, bags: 4, price: 79, mpg: 28 },
  { id: "luxury", name: "Luxury", icon: "🏎️", examples: "BMW 5, Audi A6", seats: 5, bags: 3, price: 129, mpg: 25 },
  { id: "van", name: "Minivan", icon: "🚐", examples: "Sienna, Odyssey", seats: 8, bags: 6, price: 89, mpg: 26 },
];

const addOns = [
  { id: "gps", label: "GPS Navigation", price: 9.99 },
  { id: "child", label: "Child Seat", price: 11.99 },
  { id: "prepaid_fuel", label: "Prepaid Fuel", price: 24.99 },
  { id: "roadside", label: "Roadside Assistance Plus", price: 14.99 },
  { id: "extra_driver", label: "Additional Driver", price: 12.99 },
  { id: "toll", label: "Toll Pass", price: 6.99 },
];

const features = [
  { icon: "📍", title: "GPS Vehicle Tracking", desc: "Real-time GPS for every vehicle in the fleet with geofencing alerts." },
  { icon: "🔧", title: "Maintenance Scheduling", desc: "Automated maintenance reminders based on mileage and manufacturer schedules." },
  { icon: "📋", title: "Vehicle Inspection", desc: "Digital walk-around inspection reports with photo documentation." },
  { icon: "💼", title: "Corporate Accounts", desc: "Team billing, custom rates, policy enforcement, and expense reporting." },
  { icon: "🛡️", title: "Insurance Management", desc: "Integrated insurance options with collision damage waiver and liability." },
  { icon: "🆘", title: "Roadside Assistance", desc: "24/7 roadside assistance with towing, battery jump, and lockout service." },
];

export default function RentalCarsPage() {
  const [pickup, setPickup] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [selectedCat, setSelectedCat] = useState("midsize");
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [searched, setSearched] = useState(false);

  const toggleAddOn = (id: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const vehicle = vehicleCategories.find((v) => v.id === selectedCat)!;
  const addOnCost = selectedAddOns.reduce((sum, id) => {
    const a = addOns.find((ao) => ao.id === id);
    return sum + (a ? a.price : 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-700 text-white py-10 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/services" className="text-green-200 text-sm hover:text-white mb-2 block">← All Services</Link>
            <div className="flex items-center gap-3">
              <span className="text-4xl">🚙</span>
              <div>
                <h1 className="text-3xl font-bold">Rental Car Services</h1>
                <p className="text-green-200">Fleet management · GPS tracking · Corporate accounts</p>
              </div>
            </div>
          </div>
          <span className="bg-white text-green-700 text-xs font-bold px-3 py-1 rounded-full">#56</span>
        </div>
      </header>

      <section className="py-10 px-6 bg-white border-b">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Search Available Vehicles</h2>
          <div className="bg-gray-50 rounded-2xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
                <input
                  type="text"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  placeholder="City, airport, or address"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <button
              onClick={() => setSearched(true)}
              className="w-full bg-green-700 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-800"
            >
              Search Vehicles
            </button>
          </div>
        </div>
      </section>

      {searched && (
        <section className="py-8 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Available Vehicles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {vehicleCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCat(cat.id)}
                  className={`bg-white rounded-xl p-5 border-2 text-left hover:shadow-md transition-all ${
                    selectedCat === cat.id ? "border-green-500 bg-green-50" : "border-gray-100"
                  }`}
                >
                  <div className="text-3xl mb-2">{cat.icon}</div>
                  <h3 className="font-bold">{cat.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{cat.examples}</p>
                  <div className="flex gap-3 text-xs text-gray-500 mb-2">
                    <span>👤 {cat.seats}</span>
                    <span>🧳 {cat.bags} bags</span>
                    <span>⛽ {cat.mpg} mpg</span>
                  </div>
                  <div className="font-bold text-green-700">${cat.price}/day</div>
                </button>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-lg mb-4">Add-Ons for {vehicle.name}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {addOns.map((addOn) => (
                  <label
                    key={addOn.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedAddOns.includes(addOn.id) ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAddOns.includes(addOn.id)}
                      onChange={() => toggleAddOn(addOn.id)}
                      className="accent-green-600"
                    />
                    <div>
                      <div className="text-sm font-medium">{addOn.label}</div>
                      <div className="text-xs text-gray-500">${addOn.price}/day</div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="border-t pt-4 flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold">Estimated Total</div>
                  <div className="text-sm text-gray-500">Per day · Based on current selection</div>
                </div>
                <div className="text-2xl font-black text-green-700">
                  ${(vehicle.price + addOnCost).toFixed(2)}/day
                </div>
              </div>
              <button className="mt-4 w-full bg-green-700 text-white py-4 rounded-xl font-bold hover:bg-green-800">
                Reserve {vehicle.name}
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="py-12 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Fleet Management Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat) => (
              <div key={feat.title} className="bg-green-50 rounded-xl p-5">
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
