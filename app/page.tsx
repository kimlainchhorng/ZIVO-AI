import Link from "next/link";
import Navigation from "./components/Navigation";

const features = [
  { icon: "🔍", title: "AI-Powered Search", desc: "Semantic search across all your data" },
  { icon: "📊", title: "Advanced Analytics", desc: "Real-time insights and ML-driven forecasts" },
  { icon: "🔗", title: "Blockchain/Web3", desc: "Smart contract deployment and DeFi integrations" },
  { icon: "🤖", title: "AI Testing Suite", desc: "Automated testing with AI-generated test cases" },
  { icon: "⚡", title: "Performance Optimizer", desc: "AI-driven performance tuning and caching" },
  { icon: "🎙️", title: "Voice AI", desc: "Natural language voice commands and speech synthesis" },
  { icon: "🥽", title: "AR/VR Support", desc: "Immersive 3D interfaces and spatial computing" },
  { icon: "🧠", title: "ML Integration", desc: "Custom model training and inference pipelines" },
  { icon: "📝", title: "Advanced CMS", desc: "AI-assisted content management and SEO" },
  { icon: "🔒", title: "Security Suite", desc: "Zero-trust security, threat detection, and compliance" },
  { icon: "🚀", title: "Deployment Hub", desc: "One-click deployment to 10+ cloud providers" },
  { icon: "🌐", title: "API Management", desc: "Rate limiting, versioning, and API gateway" },
  { icon: "💾", title: "Data Management", desc: "ETL pipelines, data lakes, and governance" },
  { icon: "📈", title: "Workflow Automation", desc: "Visual workflow builder with 50+ triggers" },
  { icon: "🔌", title: "50+ Integrations", desc: "Connect with Slack, GitHub, Stripe, Salesforce and more" },
  { icon: "🎯", title: "Smart Recommendations", desc: "Context-aware AI suggestions" },
];

const stats = [
  { value: "50+", label: "Integrations" },
  { value: "16", label: "Feature Modules" },
  { value: "99.9%", label: "Uptime" },
  { value: "Enterprise", label: "Ready" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navigation />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-purple-900/30 border border-purple-700/50 rounded-full px-4 py-1.5 text-purple-300 text-sm mb-8">
          <span className="w-2 h-2 rounded-full bg-purple-400 inline-block animate-pulse"></span>
          Now with 16 Feature Modules
        </div>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
          The{" "}
          <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Ultimate AI
          </span>{" "}
          Platform
        </h1>
        <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10">
          Build, deploy, and scale intelligent applications with ZIVO AI — the all-in-one platform for modern AI-powered products.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-8 py-3 text-base font-semibold transition-colors w-full sm:w-auto"
          >
            Launch Dashboard
          </Link>
          <Link
            href="/integrations"
            className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 rounded-lg px-8 py-3 text-base font-semibold transition-colors w-full sm:w-auto"
          >
            View Integrations
          </Link>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-gray-800 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                {s.value}
              </div>
              <div className="text-gray-400 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
          Everything you need,{" "}
          <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            built in
          </span>
        </h2>
        <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
          16 powerful modules working together to power your AI-driven products.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-purple-600/50 transition-colors group"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-white mb-1 group-hover:text-purple-300 transition-colors">
                {f.title}
              </h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} ZIVO AI. All rights reserved.
      </footer>
    </div>
  );
}
