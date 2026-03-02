import Link from "next/link";

const features = [
  { icon: "🚀", title: "AI Website Builder", desc: "Generate full websites from a single prompt using GPT-4.1.", href: "/ai" },
  { icon: "📊", title: "Analytics Hub", desc: "Track DAU, MAU, retention, LTV, and growth in real-time.", href: "/dashboard/analytics" },
  { icon: "📣", title: "Marketing", desc: "Multi-channel campaigns, SEO, social media, and email automation.", href: "/dashboard/marketing" },
  { icon: "🎯", title: "Launch Command", desc: "Countdown, checklists, beta program, and launch day coordination.", href: "/dashboard/launch" },
  { icon: "🤝", title: "Community", desc: "Forum, Q&A, feature voting, badges, and moderation tools.", href: "/dashboard/community" },
  { icon: "💬", title: "Support", desc: "Ticketing, SLA management, live chat, and satisfaction tracking.", href: "/dashboard/support" },
  { icon: "💼", title: "Sales Pipeline", desc: "CRM, deal tracking, proposals, and revenue forecasting.", href: "/dashboard/sales" },
  { icon: "🌐", title: "Partnerships", desc: "Affiliate system, commission tracking, and partner portal.", href: "/dashboard/partnerships" },
  { icon: "📅", title: "Events", desc: "Webinars, virtual conferences, registrations, and recordings.", href: "/dashboard/events" },
  { icon: "📡", title: "Monitoring", desc: "Uptime, performance, error tracking, and incident management.", href: "/dashboard/monitoring" },
  { icon: "🏆", title: "Customer Success", desc: "Health scores, churn risk, onboarding automation, and NPS.", href: "/dashboard/customer-success" },
  { icon: "📈", title: "Growth", desc: "A/B testing, referral programs, viral loops, and experiments.", href: "/dashboard/growth" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-indigo-400">ZIVO</span>
            <span className="rounded bg-indigo-600 px-2 py-0.5 text-xs font-semibold text-white">AI</span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <Link href="/ai" className="hover:text-white transition-colors">Builder</Link>
            <Link href="/ai-login" className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500 transition-colors">
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="mb-4 inline-block rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1 text-sm text-indigo-400">
            Post-Launch Infrastructure Ready
          </span>
          <h1 className="mt-4 text-5xl font-bold tracking-tight text-white sm:text-6xl">
            Build, Launch &amp; Grow with{" "}
            <span className="text-indigo-400">ZIVO AI</span>
          </h1>
          <p className="mt-6 text-xl text-gray-400">
            The all-in-one platform for AI-powered website building with comprehensive
            marketing, analytics, community, and business operations infrastructure.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/ai"
              className="rounded-xl bg-indigo-600 px-8 py-3 text-base font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              Start Building Free
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl border border-gray-700 px-8 py-3 text-base font-semibold text-gray-300 hover:border-gray-500 hover:text-white transition-colors"
            >
              View Dashboard →
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-gray-800 bg-gray-900/50 py-8">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 sm:grid-cols-4">
          {[
            { label: "API Endpoints", value: "50+" },
            { label: "Dashboard Pages", value: "16+" },
            { label: "Integrations", value: "50+" },
            { label: "Features", value: "400+" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-indigo-400">{stat.value}</div>
              <div className="mt-1 text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="mb-4 text-center text-3xl font-bold text-white">
          Complete Business Infrastructure
        </h2>
        <p className="mb-12 text-center text-gray-400">
          Everything you need to run a successful SaaS business, built in.
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {features.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="group rounded-xl border border-gray-800 bg-gray-900 p-6 transition-all hover:border-indigo-500/50 hover:bg-gray-800"
            >
              <div className="mb-3 text-3xl">{f.icon}</div>
              <h3 className="mb-2 font-semibold text-white group-hover:text-indigo-400 transition-colors">
                {f.title}
              </h3>
              <p className="text-sm text-gray-400">{f.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-24 text-center">
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-600/10 p-12">
          <h2 className="text-3xl font-bold text-white">Ready to launch?</h2>
          <p className="mt-4 text-gray-400">
            Access your full post-launch dashboard and start growing today.
          </p>
          <Link
            href="/dashboard"
            className="mt-8 inline-block rounded-xl bg-indigo-600 px-10 py-3 font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            Open Dashboard
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-8 text-center text-sm text-gray-600">
        © {new Date().getFullYear()} ZIVO AI. All rights reserved.
      </footer>
    </div>
  );
}
