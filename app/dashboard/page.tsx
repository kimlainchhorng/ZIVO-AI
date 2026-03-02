import Link from "next/link";

const sections = [
  { href: "/dashboard/marketing", icon: "📣", title: "Marketing", description: "Campaigns, SEO, social media, newsletter stats" },
  { href: "/dashboard/launch", icon: "🚀", title: "Launch", description: "Launch checklist, countdown, beta program status" },
  { href: "/dashboard/analytics", icon: "📊", title: "Analytics", description: "DAU, MAU, retention, churn, LTV, CAC" },
  { href: "/dashboard/support", icon: "🎧", title: "Support", description: "Ticket queue, SLA compliance, satisfaction scores" },
  { href: "/dashboard/feedback", icon: "💬", title: "Feedback", description: "User feedback, feature requests, sentiment analysis" },
  { href: "/dashboard/community", icon: "🌐", title: "Community", description: "Members, discussions, moderation, events" },
  { href: "/dashboard/partnerships", icon: "🤝", title: "Partnerships", description: "Affiliates, commissions, partner performance" },
  { href: "/dashboard/sales", icon: "💰", title: "Sales", description: "Pipeline stages, deals, monthly revenue" },
  { href: "/dashboard/events", icon: "📅", title: "Events", description: "Webinars, registrations, recordings, attendees" },
  { href: "/dashboard/monitoring", icon: "🖥️", title: "Monitoring", description: "Uptime, response times, error rates, alerts" },
  { href: "/dashboard/customer-success", icon: "⭐", title: "Customer Success", description: "Health scores, NPS, onboarding, renewals" },
  { href: "/dashboard/growth", icon: "📈", title: "Growth", description: "A/B tests, referrals, viral coefficient" },
  { href: "/dashboard/retention", icon: "🔁", title: "Retention", description: "Churn trends, cohort analysis, win-back campaigns" },
  { href: "/dashboard/roadmap", icon: "🗺️", title: "Roadmap", description: "Quarterly features, voting, milestones" },
  { href: "/dashboard/investors", icon: "💼", title: "Investors", description: "MRR, ARR, runway, cap table, updates" },
  { href: "/dashboard/team", icon: "👥", title: "Team", description: "Members, OKRs, performance, open positions" },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-700 bg-gray-800/50 px-8 py-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold tracking-tight text-white">ZIVO AI — Dashboard</h1>
          <p className="mt-1 text-gray-400">Command center for all operations</p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-8 py-10">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="group flex flex-col rounded-xl bg-gray-800 p-6 transition-all hover:bg-gray-700 hover:ring-2 hover:ring-indigo-500"
            >
              <span className="mb-3 text-3xl">{section.icon}</span>
              <h2 className="text-lg font-semibold text-white group-hover:text-indigo-400">{section.title}</h2>
              <p className="mt-1 text-sm text-gray-400">{section.description}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
