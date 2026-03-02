import Link from "next/link";

const features = [
  { icon: "📦", title: "Bulk Order Management", desc: "Manage thousands of orders simultaneously with batch processing, priority queues, and automated fulfillment workflows." },
  { icon: "💰", title: "Custom Pricing & Volume Discounts", desc: "Tiered pricing based on volume, dedicated rates for enterprise accounts, and contract pricing management." },
  { icon: "🏷️", title: "White-Label Options", desc: "Full white-label platform with custom branding, domain, and customer-facing interfaces under your brand." },
  { icon: "🔗", title: "API & Webhook Integration", desc: "RESTful APIs, real-time webhooks, and pre-built connectors for Shopify, SAP, Oracle, and 50+ platforms." },
  { icon: "📡", title: "EDI Integration", desc: "Electronic Data Interchange support for X12 and EDIFACT standards, enabling automated B2B order processing." },
  { icon: "📊", title: "SLA Management", desc: "Define, monitor, and enforce SLAs with automated escalations, performance dashboards, and breach alerts." },
  { icon: "🛡️", title: "Risk Management", desc: "Fraud detection, order screening, insurance management, and compliance monitoring for enterprise safety." },
  { icon: "📈", title: "Custom Analytics & Reporting", desc: "Build custom dashboards, scheduled reports, and data exports for business intelligence integration." },
  { icon: "🔐", title: "Audit Trails & Compliance", desc: "Complete audit logs for every transaction, user action, and system event for regulatory compliance." },
];

const integrations = [
  { category: "ERP Systems", items: ["SAP", "Oracle", "Microsoft Dynamics", "NetSuite", "Sage"] },
  { category: "E-commerce", items: ["Shopify", "WooCommerce", "Magento", "BigCommerce", "Amazon"] },
  { category: "Warehouse Management", items: ["Manhattan", "Blue Yonder", "HighJump", "3PL Central"] },
  { category: "Accounting", items: ["QuickBooks", "Xero", "FreshBooks", "Stripe Billing"] },
];

const slaMetrics = [
  { label: "Order Processing Time", target: "< 2 min", current: "1.4 min" },
  { label: "API Response Time", target: "< 200ms", current: "142ms" },
  { label: "On-Time Delivery", target: "> 98%", current: "99.1%" },
  { label: "System Uptime", target: "> 99.9%", current: "99.97%" },
];

export default function B2BDeliveryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-700 text-white py-10 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/services" className="text-indigo-200 text-sm hover:text-white mb-2 block">← All Services</Link>
            <div className="flex items-center gap-3">
              <span className="text-4xl">🏢</span>
              <div>
                <h1 className="text-3xl font-bold">B2B Delivery (Enterprise)</h1>
                <p className="text-indigo-200">Bulk orders · Custom pricing · API/EDI · SLA management</p>
              </div>
            </div>
          </div>
          <span className="bg-white text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">#59</span>
        </div>
      </header>

      <section className="bg-indigo-900 text-white py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-8">Live SLA Dashboard</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {slaMetrics.map((metric) => (
              <div key={metric.label} className="bg-white/10 rounded-xl p-4">
                <div className="text-2xl font-black text-green-400 mb-1">{metric.current}</div>
                <div className="text-indigo-200 text-xs mb-2">{metric.label}</div>
                <div className="text-xs text-indigo-300">Target: {metric.target}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Enterprise Platform Features</h2>
          <p className="text-gray-500 mb-8">Everything you need to run enterprise-scale delivery operations with the reliability and customization your business demands.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat) => (
              <div key={feat.title} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-2xl mb-2">{feat.icon}</div>
                <h3 className="font-bold mb-1">{feat.title}</h3>
                <p className="text-gray-600 text-sm">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Pre-Built Integrations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {integrations.map((group) => (
              <div key={group.category} className="bg-indigo-50 rounded-xl p-6">
                <h3 className="font-bold text-indigo-900 mb-3">{group.category}</h3>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span key={item} className="text-sm bg-white border border-indigo-100 text-indigo-700 px-3 py-1 rounded-lg font-medium">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-6 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl font-bold mb-4">API-First Platform</h2>
              <p className="text-gray-300 mb-4">
                Every feature available through our RESTful API. Build custom workflows, integrate with existing systems, and automate end-to-end delivery operations.
              </p>
              <ul className="space-y-2 text-sm text-gray-300">
                {["Full REST API with OpenAPI documentation", "Webhook notifications for all events", "OAuth 2.0 & API key authentication", "Rate limiting & quota management", "Sandbox environment for testing"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-black rounded-xl p-4 font-mono text-sm text-green-400">
              <div className="text-gray-500 mb-2"># Create bulk order</div>
              <div className="text-blue-400">POST</div> /api/v1/orders/bulk<br />
              <br />
              <div className="text-gray-500">Authorization: Bearer {"<token>"}</div>
              <br />
              <div className="text-yellow-400">{"{"}</div>
              <div className="pl-4">&quot;orders&quot;: [...]</div>
              <div className="pl-4">&quot;priority&quot;: &quot;high&quot;</div>
              <div className="pl-4">&quot;sla_tier&quot;: &quot;enterprise&quot;</div>
              <div className="text-yellow-400">{"}"}</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-black text-gray-500 text-center py-6 text-sm">
        <Link href="/services" className="text-gray-400 hover:text-white">← Back to all services</Link>
      </footer>
    </div>
  );
}
