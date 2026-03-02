import Link from "next/link";

const deliveryTypes = [
  { name: "Same-Day Delivery", icon: "⚡", time: "Within 4 hours", price: "From $12.99", desc: "Express fulfillment from local warehouses to your door." },
  { name: "Next-Hour Delivery", icon: "🚀", time: "Within 60 min", price: "From $19.99", desc: "Micro-fulfillment centers enable hyper-local ultra-fast delivery." },
  { name: "Scheduled Delivery", icon: "📅", time: "Your time window", price: "From $6.99", desc: "Choose a 2-hour delivery window that works for your schedule." },
  { name: "Batch Express", icon: "📦", time: "1-2 hours", price: "From $8.99", desc: "Grouped with nearby deliveries for cost-efficient fast delivery." },
];

const proofMethods = [
  { icon: "📸", name: "Photo Evidence", desc: "Automatic photo capture at delivery location with timestamp and GPS." },
  { icon: "✍️", name: "Digital Signature", desc: "Contactless or in-person signature capture on mobile device." },
  { icon: "📹", name: "Video Documentation", desc: "Short video proof of delivery for high-value or disputed packages." },
  { icon: "📍", name: "Geofence Confirmation", desc: "GPS verifies driver was within 50ft of delivery address." },
];

const exceptionHandling = [
  "Failed delivery attempt notification",
  "Automatic rescheduling options",
  "Neighbor delivery authorization",
  "Safe location drop-off selection",
  "Return to sender workflow",
  "Customer self-reschedule portal",
];

const metrics = [
  { value: "99.2%", label: "On-Time Rate" },
  { value: "<45 min", label: "Avg Same-Day" },
  { value: "4.9/5", label: "Customer Rating" },
  { value: "12M+", label: "Deliveries/Month" },
];

export default function LastMilePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-purple-700 text-white py-10 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/services" className="text-purple-200 text-sm hover:text-white mb-2 block">← All Services</Link>
            <div className="flex items-center gap-3">
              <span className="text-4xl">⚡</span>
              <div>
                <h1 className="text-3xl font-bold">Last-Mile Delivery</h1>
                <p className="text-purple-200">Micro-fulfillment · Same-day · Next-hour · Batch optimization</p>
              </div>
            </div>
          </div>
          <span className="bg-white text-purple-700 text-xs font-bold px-3 py-1 rounded-full">#57</span>
        </div>
      </header>

      <section className="py-12 px-6 bg-purple-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {metrics.map((m) => (
              <div key={m.label}>
                <div className="text-4xl font-black mb-1">{m.value}</div>
                <div className="text-purple-300 text-sm">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Delivery Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {deliveryTypes.map((dt) => (
              <div key={dt.name} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{dt.icon}</div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">{dt.name}</h3>
                    <p className="text-gray-500 text-sm mb-3">{dt.desc}</p>
                    <div className="flex gap-4 text-sm">
                      <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full font-medium">{dt.time}</span>
                      <span className="bg-gray-50 text-gray-700 px-3 py-1 rounded-full font-medium">{dt.price}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Proof of Delivery Methods</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {proofMethods.map((pm) => (
              <div key={pm.name} className="bg-purple-50 rounded-xl p-5 text-center">
                <div className="text-3xl mb-3">{pm.icon}</div>
                <h3 className="font-bold mb-2">{pm.name}</h3>
                <p className="text-gray-600 text-sm">{pm.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Exception Handling</h2>
          <p className="text-gray-500 mb-6">When deliveries don't go as planned, our automated exception handling ensures every package finds its way.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {exceptionHandling.map((item) => (
              <div key={item} className="flex items-center gap-3 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <span className="text-purple-500 text-lg">🔄</span>
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-6 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">AI-Powered Route Optimization</h2>
          <p className="text-gray-300 mb-8">
            Our ML engine optimizes delivery batches in real-time, considering traffic, package priorities, delivery windows, and driver proximity to minimize total delivery time.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "🧠", title: "Predictive Demand", desc: "Forecast delivery volumes 30 days out to pre-position drivers and inventory." },
              { icon: "🗺️", title: "Dynamic Routing", desc: "Routes update every 60 seconds based on live traffic and new orders." },
              { icon: "📦", title: "Smart Batching", desc: "Group deliveries by geographic clusters to maximize stops per hour." },
            ].map((item) => (
              <div key={item.title} className="bg-white/10 rounded-xl p-5">
                <div className="text-2xl mb-2">{item.icon}</div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-gray-300 text-sm">{item.desc}</p>
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
