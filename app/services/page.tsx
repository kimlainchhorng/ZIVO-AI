"use client";

import Link from "next/link";

const services = [
  {
    href: "/services/rides",
    title: "Ride-Sharing",
    description:
      "Uber/Lyft/Blacklane-style passenger & driver apps with real-time GPS, dynamic pricing, and route optimization.",
    icon: "🚗",
    features: ["Real-time GPS tracking", "Dynamic pricing", "Driver matching", "Premium services", "Emergency SOS"],
  },
  {
    href: "/services/flights",
    title: "Flight Booking",
    description:
      "Multi-airline flight search, seat selection, baggage management, travel insurance, and group bookings.",
    icon: "✈️",
    features: ["Multi-airline search", "Seat selection", "Price alerts", "Travel insurance", "Loyalty integration"],
  },
  {
    href: "/services/food",
    title: "Food Delivery",
    description:
      "DoorDash/UberEats-style restaurant platform with menu management, delivery logistics, and loyalty programs.",
    icon: "🍔",
    features: ["Restaurant platform", "Menu management", "Order tracking", "Loyalty programs", "Catering orders"],
  },
  {
    href: "/services/packages",
    title: "Package Delivery",
    description:
      "Roadies-style sender & delivery partner features with real-time tracking and proof of delivery.",
    icon: "📦",
    features: ["Real-time tracking", "Proof of delivery", "Temperature control", "Damage claims", "Returns management"],
  },
  {
    href: "/services/rentals",
    title: "Rental Cars",
    description:
      "Vehicle inventory, fleet management, pricing, booking, license verification, and GPS tracking.",
    icon: "🚙",
    features: ["Fleet management", "Booking system", "License verification", "Damage documentation", "Roadside assistance"],
  },
  {
    href: "/services/last-mile",
    title: "Last-Mile Delivery",
    description:
      "Same-day and next-hour delivery with batch optimization, geofencing, and photographic proof of delivery.",
    icon: "📍",
    features: ["Same-day delivery", "Next-hour delivery", "Batch optimization", "Geofencing", "Failed delivery handling"],
  },
  {
    href: "/services/logistics",
    title: "Logistics & Freight",
    description:
      "Load posting, route optimization, temperature monitoring, hazmat compliance, and bill of lading.",
    icon: "🚛",
    features: ["Load posting", "Route optimization", "Hazmat compliance", "Toll management", "Bill of lading"],
  },
  {
    href: "/services/maintenance",
    title: "Field Service & Maintenance",
    description:
      "Service provider platform with technician assignment, parts management, invoicing, and SLA management.",
    icon: "🔧",
    features: ["Technician assignment", "Parts management", "Invoice generation", "Service history", "SLA management"],
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">ZIVO Services Platform</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Mega Services — 8 verticals, 50+ integrations</p>
          </div>
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-16 text-center">
        <h2 className="text-4xl font-extrabold text-zinc-900 dark:text-white mb-4">
          The Complete Services Ecosystem
        </h2>
        <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
          From ride-sharing and flight booking to food delivery and freight logistics — one unified platform
          powering every service vertical.
        </p>
      </section>

      {/* Services Grid */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => (
            <Link
              key={service.href}
              href={service.href}
              className="group bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 hover:shadow-lg hover:border-zinc-400 dark:hover:border-zinc-600 transition-all"
            >
              <div className="text-4xl mb-4">{service.icon}</div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {service.title}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
                {service.description}
              </p>
              <ul className="space-y-1">
                {service.features.map((f) => (
                  <li key={f} className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </Link>
          ))}
        </div>
      </section>

      {/* Integrations Banner */}
      <section className="bg-zinc-900 dark:bg-zinc-950 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h3 className="text-2xl font-bold text-white mb-3">50+ Platform Integrations</h3>
          <p className="text-zinc-400 mb-8">
            Payment processors · Mapping APIs · Communication · Analytics · Cloud · AI/ML · Insurance · Identity
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "Stripe", "PayPal", "Braintree", "Square", "Adyen",
              "Google Maps", "Mapbox", "HERE", "OpenStreetMap",
              "Twilio", "SendGrid", "Firebase FCM",
              "Segment", "Mixpanel", "Amplitude",
              "AWS", "GCP", "Azure",
              "PostgreSQL", "MongoDB", "Redis",
              "OpenAI", "Anthropic", "Google AI",
              "Zurich Insurance", "Allianz", "AXA",
              "Stripe Identity", "Jumio", "Persona",
              "EasyPost", "ShipStation", "FedEx API", "UPS API",
            ].map((name) => (
              <span
                key={name}
                className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-full text-xs font-medium"
              >
                {name}
              </span>
            ))}
          </div>
          <Link
            href="/api/integrations"
            className="inline-block mt-8 px-6 py-3 bg-white text-zinc-900 rounded-full text-sm font-semibold hover:bg-zinc-100 transition-colors"
          >
            View All Integrations →
          </Link>
        </div>
      </section>
    </div>
  );
}
