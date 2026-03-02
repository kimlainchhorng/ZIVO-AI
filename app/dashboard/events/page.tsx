import Link from "next/link";

const upcomingEvents = [
  { title: "ZIVO AI Product Demo Webinar", date: "Jan 10, 2026", time: "2:00 PM EST", registered: 284, type: "Webinar" },
  { title: "AI for Startups Workshop", date: "Jan 18, 2026", time: "11:00 AM EST", registered: 142, type: "Workshop" },
  { title: "Monthly Community Meetup", date: "Jan 25, 2026", time: "4:00 PM EST", registered: 96, type: "Community" },
  { title: "Enterprise Q&A Session", date: "Feb 3, 2026", time: "1:00 PM EST", registered: 58, type: "Webinar" },
];

const pastRecordings = [
  { title: "Getting Started with ZIVO AI", date: "Dec 12, 2025", views: 1840, duration: "48 min" },
  { title: "Advanced Analytics Deep Dive", date: "Dec 5, 2025", views: 1120, duration: "62 min" },
  { title: "Integration Partners Showcase", date: "Nov 28, 2025", views: 840, duration: "35 min" },
];

const attendeeStats = [
  { label: "Total Registrations", value: "4,820", color: "text-indigo-400" },
  { label: "Avg. Attendance Rate", value: "72%", color: "text-emerald-400" },
  { label: "Avg. Satisfaction", value: "4.7/5", color: "text-amber-400" },
  { label: "Total Events Run", value: "38", color: "text-purple-400" },
];

const typeColor: Record<string, string> = {
  Webinar: "bg-indigo-900/40 text-indigo-400",
  Workshop: "bg-amber-900/40 text-amber-400",
  Community: "bg-emerald-900/40 text-emerald-400",
};

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-700 bg-gray-800/50 px-8 py-6">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="text-sm text-indigo-400 hover:text-indigo-300">← Back to Dashboard</Link>
            <h1 className="mt-1 text-3xl font-bold text-white">Event Manager</h1>
          </div>
          <button className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors">
            + Create Event
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-8 py-10 space-y-10">
        {/* Stats */}
        <section>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {attendeeStats.map((s) => (
              <div key={s.label} className="rounded-xl bg-gray-800 p-6">
                <p className="text-sm text-gray-400">{s.label}</p>
                <p className={`mt-2 text-3xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Upcoming Events */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Upcoming Events</h2>
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div key={event.title} className="flex items-center justify-between rounded-xl bg-gray-800 p-5">
                <div className="flex items-center gap-5">
                  <div className="rounded-lg bg-gray-700 p-3 text-center min-w-[64px]">
                    <p className="text-xs text-gray-400">{event.date.split(" ")[0]}</p>
                    <p className="text-2xl font-bold text-white">{event.date.split(" ")[1].replace(",", "")}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-white">{event.title}</p>
                    <p className="text-sm text-gray-400">{event.date} · {event.time}</p>
                    <p className="text-sm text-indigo-400">{event.registered} registered</p>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${typeColor[event.type]}`}>{event.type}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Past Recordings */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Past Event Recordings</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {pastRecordings.map((r) => (
              <div key={r.title} className="rounded-xl bg-gray-800 p-6">
                <div className="mb-3 flex h-32 items-center justify-center rounded-lg bg-gray-700 text-4xl">▶️</div>
                <p className="font-semibold text-white">{r.title}</p>
                <p className="mt-1 text-sm text-gray-400">{r.date} · {r.duration}</p>
                <p className="mt-1 text-sm text-indigo-400">{r.views.toLocaleString()} views</p>
              </div>
            ))}
          </div>
        </section>

        {/* Create Event Form Placeholder */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Create New Event</h2>
          <div className="rounded-xl bg-gray-800 p-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Event Title</label>
                <div className="h-10 rounded-lg bg-gray-700 border border-gray-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Event Type</label>
                <div className="h-10 rounded-lg bg-gray-700 border border-gray-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Date</label>
                <div className="h-10 rounded-lg bg-gray-700 border border-gray-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Time</label>
                <div className="h-10 rounded-lg bg-gray-700 border border-gray-600" />
              </div>
            </div>
            <button className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors">
              Schedule Event
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
