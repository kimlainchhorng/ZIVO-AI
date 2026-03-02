import Link from "next/link";

const services = [
  {
    id: "ride-sharing",
    number: 51,
    title: "Ride-Sharing Empire",
    description:
      "Uber/Lyft/Blacklane-style platform with real-time GPS tracking, dynamic pricing, driver matching, surge automation, and premium corporate accounts.",
    icon: "🚗",
    color: "bg-black",
    features: [
      "Real-time GPS tracking",
      "Dynamic pricing algorithm",
      "Driver matching & routing",
      "Premium & luxury rides",
      "Corporate accounts",
      "SOS emergency button",
    ],
  },
  {
    id: "flights",
    number: 52,
    title: "Flight Booking & Travel",
    description:
      "Full-featured flight search engine with multi-airline integration, seat selection, baggage management, travel packages, and loyalty program support.",
    icon: "✈️",
    color: "bg-blue-600",
    features: [
      "Multi-airline search",
      "Flexible itineraries",
      "Seat selection",
      "Travel packages",
      "Price alerts",
      "Loyalty miles",
    ],
  },
  {
    id: "delivery",
    number: 53,
    title: "Delivery Services",
    description:
      "DoorDash/UberEats/Grubhub-style platform with restaurant onboarding, real-time order tracking, driver dispatch, and advanced analytics.",
    icon: "🛵",
    color: "bg-red-600",
    features: [
      "Restaurant onboarding",
      "Kitchen display system",
      "Real-time tracking",
      "Multiple order batching",
      "Driver earnings",
      "Analytics dashboard",
    ],
  },
  {
    id: "food-delivery",
    number: 54,
    title: "Food Delivery Platform",
    description:
      "Multi-restaurant aggregation with dietary filters, nutritional data, scheduled deliveries, group orders, catering, and subscription options.",
    icon: "🍔",
    color: "bg-orange-500",
    features: [
      "Dietary filters",
      "Nutritional data",
      "Group orders",
      "Catering",
      "Subscriptions",
      "Flash sales",
    ],
  },
  {
    id: "packages",
    number: 55,
    title: "Package Delivery",
    description:
      "Roadies/Amazon-style platform with package listing, GPS tracking, proof of delivery, cold-chain support, damage claims, and reverse logistics.",
    icon: "📦",
    color: "bg-yellow-600",
    features: [
      "GPS tracking",
      "Proof of delivery",
      "Cold chain support",
      "Signature capture",
      "Damage claims",
      "Return logistics",
    ],
  },
  {
    id: "rental-cars",
    number: 56,
    title: "Rental Car Services",
    description:
      "Full fleet management with vehicle inventory, GPS tracking, maintenance scheduling, insurance integration, and corporate rental accounts.",
    icon: "🚙",
    color: "bg-green-600",
    features: [
      "Fleet inventory",
      "GPS tracking",
      "Maintenance scheduling",
      "Insurance integration",
      "Corporate accounts",
      "Toll management",
    ],
  },
  {
    id: "last-mile",
    number: 57,
    title: "Last-Mile Delivery",
    description:
      "Micro-fulfillment and same-day/next-hour delivery with batch optimization, geofencing, photographic evidence, and reverse logistics.",
    icon: "⚡",
    color: "bg-purple-600",
    features: [
      "Same-day delivery",
      "Batch optimization",
      "Geofencing",
      "Photo evidence",
      "Failed delivery process",
      "Reverse logistics",
    ],
  },
  {
    id: "logistics",
    number: 58,
    title: "Logistics & Freight",
    description:
      "Enterprise freight platform with load posting, driver matching, fuel/toll optimization, temperature monitoring, hazmat compliance, and EDI integration.",
    icon: "🚛",
    color: "bg-gray-700",
    features: [
      "Load posting",
      "Route optimization",
      "Temperature monitoring",
      "Hazmat compliance",
      "Bill of lading",
      "Invoice generation",
    ],
  },
  {
    id: "b2b-delivery",
    number: 59,
    title: "B2B Delivery (Enterprise)",
    description:
      "Enterprise delivery platform with bulk order management, custom pricing, white-label options, API/webhook/EDI integration, and SLA management.",
    icon: "🏢",
    color: "bg-indigo-600",
    features: [
      "Bulk order management",
      "Custom pricing",
      "White-label options",
      "API/EDI integration",
      "SLA management",
      "Compliance reporting",
    ],
  },
  {
    id: "maintenance",
    number: 60,
    title: "Maintenance & Service",
    description:
      "Field service marketplace with technician assignment, route optimization, parts inventory, digital signatures, warranty tracking, and SLA compliance.",
    icon: "🔧",
    color: "bg-teal-600",
    features: [
      "Service booking",
      "Technician dispatch",
      "Parts inventory",
      "Digital signature",
      "Warranty tracking",
      "SLA management",
    ],
  },
];

const integrations = [
  {
    category: "Payment Processors",
    items: ["Stripe", "Square", "PayPal", "Adyen", "Razorpay", "Apple Pay", "Google Pay"],
  },
  {
    category: "Mapping & Navigation",
    items: ["Google Maps", "Mapbox", "HERE Maps", "OpenStreetMap", "TomTom"],
  },
  {
    category: "Communication",
    items: ["Twilio", "SendGrid", "Firebase", "Socket.io", "Pusher", "AWS SNS"],
  },
  {
    category: "Analytics",
    items: ["Google Analytics", "Mixpanel", "Amplitude", "DataDog", "Sentry"],
  },
  {
    category: "Cloud Infrastructure",
    items: ["AWS", "Google Cloud", "Azure", "Vercel", "Railway"],
  },
  {
    category: "AI/ML Services",
    items: ["OpenAI", "Anthropic", "TensorFlow", "AWS SageMaker", "Google Vertex AI"],
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black text-white py-16 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block bg-white text-black text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
            Epic PR #17
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            MEGA SERVICES PLATFORM
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            The complete transportation, delivery, and logistics ecosystem — 10 platforms, 50+ integrations, enterprise-grade.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
            <span>🚗 Ride-Sharing</span>
            <span>✈️ Flights</span>
            <span>🛵 Food Delivery</span>
            <span>📦 Packages</span>
            <span>🚙 Rental Cars</span>
            <span>🚛 Freight</span>
          </div>
        </div>
      </header>

      {/* Services Grid */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            10 Complete Service Platforms
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {services.map((service) => (
              <Link
                key={service.id}
                href={`/services/${service.id}`}
                className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
              >
                <div className={`${service.color} p-6 text-white`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{service.icon}</span>
                    <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">
                      #{service.number}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold">{service.title}</h3>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    {service.description}
                  </p>
                  <ul className="grid grid-cols-2 gap-1">
                    {service.features.map((feature) => (
                      <li key={feature} className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="text-green-500">✓</span> {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 text-sm font-semibold text-gray-900 group-hover:underline">
                    Explore platform →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">
            50+ Enterprise Integrations
          </h2>
          <p className="text-center text-gray-500 mb-12">
            Plug-and-play integrations across payments, maps, communications, analytics, cloud, and AI.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {integrations.map((group) => (
              <div key={group.category} className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-3">{group.category}</h3>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span
                      key={item}
                      className="text-xs bg-white border border-gray-200 text-gray-700 px-2 py-1 rounded-lg"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">Platform at a Glance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "10", label: "Service Platforms" },
              { value: "50+", label: "Integrations" },
              { value: "500+", label: "Features" },
              { value: "∞", label: "Scalability" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl font-black mb-1">{stat.value}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-black text-gray-500 text-center py-6 text-sm">
        ZIVO AI — Mega Services Platform · Built with Next.js
      </footer>
    </div>
  );
}
