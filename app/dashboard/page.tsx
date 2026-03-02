"use client";

import Link from "next/link";
import Navigation from "../components/Navigation";

const modules = [
  { icon: "🔍", name: "AI Search", desc: "Semantic search across all data sources", href: "/search", badge: "Active", badgeColor: "bg-emerald-900 text-emerald-300" },
  { icon: "📊", name: "Analytics", desc: "Real-time insights and ML-driven forecasts", href: "/analytics", badge: "Active", badgeColor: "bg-emerald-900 text-emerald-300" },
  { icon: "🎙️", name: "Voice AI", desc: "Natural language voice commands and synthesis", href: "/voice", badge: "Beta", badgeColor: "bg-blue-900 text-blue-300" },
  { icon: "🥽", name: "AR/VR", desc: "Immersive 3D interfaces and spatial computing", href: "/arvr", badge: "Coming Soon", badgeColor: "bg-gray-700 text-gray-300" },
  { icon: "🔗", name: "Blockchain", desc: "Smart contracts and DeFi integrations", href: "/blockchain", badge: "Beta", badgeColor: "bg-blue-900 text-blue-300" },
  { icon: "🧠", name: "ML Pipeline", desc: "Custom model training and inference", href: "/ml", badge: "Active", badgeColor: "bg-emerald-900 text-emerald-300" },
  { icon: "📝", name: "CMS", desc: "AI-assisted content management and SEO", href: "/cms", badge: "Coming Soon", badgeColor: "bg-gray-700 text-gray-300" },
  { icon: "🔒", name: "Security", desc: "Zero-trust security and threat detection", href: "/security", badge: "Active", badgeColor: "bg-emerald-900 text-emerald-300" },
  { icon: "🚀", name: "Deployment", desc: "One-click deploy to 10+ cloud providers", href: "/deployment", badge: "Active", badgeColor: "bg-emerald-900 text-emerald-300" },
  { icon: "🌐", name: "API Management", desc: "Rate limiting, versioning, and gateway", href: "/api-management", badge: "Active", badgeColor: "bg-emerald-900 text-emerald-300" },
  { icon: "💾", name: "Data Management", desc: "ETL pipelines, data lakes, and governance", href: "/data-management", badge: "Beta", badgeColor: "bg-blue-900 text-blue-300" },
  { icon: "📈", name: "Workflow", desc: "Visual workflow builder with 50+ triggers", href: "/workflow", badge: "Active", badgeColor: "bg-emerald-900 text-emerald-300" },
  { icon: "🖥️", name: "Monitoring", desc: "Live system metrics and health checks", href: "/monitoring", badge: "Active", badgeColor: "bg-emerald-900 text-emerald-300" },
  { icon: "🔌", name: "Integrations", desc: "Connect with 50+ external services", href: "/integrations", badge: "Active", badgeColor: "bg-emerald-900 text-emerald-300" },
];

const statusItems = [
  "AI Engine Online",
  "API Gateway",
  "Search Index",
  "ML Models",
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-400 mt-1">Manage and access all ZIVO AI feature modules</p>
        </div>

        {/* Feature modules grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {modules.map((mod) => (
            <div
              key={mod.name}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-purple-600/50 transition-colors flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-3xl">{mod.icon}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${mod.badgeColor}`}>
                  {mod.badge}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-white">{mod.name}</h3>
                <p className="text-gray-400 text-sm mt-1">{mod.desc}</p>
              </div>
              <Link
                href={mod.href}
                className="mt-auto bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2 text-sm font-medium text-center transition-colors"
              >
                Open
              </Link>
            </div>
          ))}
        </div>

        {/* System status */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold mb-4">System Status</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {statusItems.map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 flex-shrink-0"></span>
                <span className="text-sm text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
