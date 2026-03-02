import Link from "next/link";

const partners = [
  { name: "CloudBase Technologies", category: "Technology", status: "Active", commission: "$8,400", referrals: 24 },
  { name: "GrowthLabs Agency", category: "Channel", status: "Active", commission: "$6,120", referrals: 18 },
  { name: "ScaleUp Ventures", category: "Strategic", status: "Active", commission: "$4,800", referrals: 12 },
  { name: "DevTools Hub", category: "Technology", status: "Active", commission: "$3,200", referrals: 9 },
  { name: "MarketBoost Co.", category: "Channel", status: "Pending", commission: "$0", referrals: 0 },
];

const categories = [
  { name: "Technology", count: 14, commission: "$42,100", color: "bg-indigo-500" },
  { name: "Channel", count: 9, commission: "$28,400", color: "bg-emerald-500" },
  { name: "Strategic", count: 5, commission: "$18,600", color: "bg-amber-500" },
];

const applications = [
  { company: "SynthWave AI", type: "Technology", date: "Jan 3, 2026", status: "Under Review" },
  { company: "FunnelPro", type: "Channel", date: "Jan 2, 2026", status: "Under Review" },
  { company: "DataMesh Inc.", type: "Strategic", date: "Dec 28, 2025", status: "Approved" },
];

const categoryColor: Record<string, string> = {
  Technology: "bg-indigo-900/40 text-indigo-400",
  Channel: "bg-emerald-900/40 text-emerald-400",
  Strategic: "bg-amber-900/40 text-amber-400",
};

const statusColor: Record<string, string> = {
  Active: "bg-emerald-900/40 text-emerald-400",
  Pending: "bg-amber-900/40 text-amber-400",
  "Under Review": "bg-gray-700 text-gray-400",
  Approved: "bg-emerald-900/40 text-emerald-400",
};

export default function PartnershipsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-700 bg-gray-800/50 px-8 py-6">
        <div className="mx-auto max-w-7xl">
          <Link href="/dashboard" className="text-sm text-indigo-400 hover:text-indigo-300">← Back to Dashboard</Link>
          <h1 className="mt-1 text-3xl font-bold text-white">Partnership Management</h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-8 py-10 space-y-10">
        {/* Summary Stats */}
        <section>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            <div className="rounded-xl bg-gray-800 p-6">
              <p className="text-sm text-gray-400">Active Partners</p>
              <p className="mt-2 text-3xl font-bold text-indigo-400">28</p>
            </div>
            <div className="rounded-xl bg-gray-800 p-6">
              <p className="text-sm text-gray-400">Total Commission Paid</p>
              <p className="mt-2 text-3xl font-bold text-emerald-400">$89,100</p>
            </div>
            <div className="rounded-xl bg-gray-800 p-6">
              <p className="text-sm text-gray-400">Partner Referrals</p>
              <p className="mt-2 text-3xl font-bold text-amber-400">341</p>
            </div>
            <div className="rounded-xl bg-gray-800 p-6">
              <p className="text-sm text-gray-400">Pending Applications</p>
              <p className="mt-2 text-3xl font-bold text-rose-400">4</p>
            </div>
          </div>
        </section>

        {/* Partner Categories */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Partner Categories</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {categories.map((c) => (
              <div key={c.name} className="rounded-xl bg-gray-800 p-6">
                <div className={`mb-3 h-1.5 w-12 rounded-full ${c.color}`} />
                <p className="font-semibold text-white">{c.name}</p>
                <p className="mt-1 text-2xl font-bold text-white">{c.count} <span className="text-sm font-normal text-gray-400">partners</span></p>
                <p className="mt-1 text-sm text-gray-400">{c.commission} commission earned</p>
              </div>
            ))}
          </div>
        </section>

        {/* Active Partners */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Active Partners</h2>
          <div className="overflow-x-auto rounded-xl bg-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-left text-gray-400">
                  <th className="px-6 py-4 font-medium">Partner</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Commission</th>
                  <th className="px-6 py-4 font-medium">Referrals</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((p) => (
                  <tr key={p.name} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="px-6 py-3 font-medium text-white">{p.name}</td>
                    <td className="px-6 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${categoryColor[p.category]}`}>{p.category}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor[p.status]}`}>{p.status}</span>
                    </td>
                    <td className="px-6 py-3 font-semibold text-emerald-400">{p.commission}</td>
                    <td className="px-6 py-3 text-gray-300">{p.referrals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Partner Applications */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Partner Applications</h2>
          <div className="space-y-3">
            {applications.map((a) => (
              <div key={a.company} className="flex items-center justify-between rounded-xl bg-gray-800 p-5">
                <div>
                  <p className="font-semibold text-white">{a.company}</p>
                  <p className="text-sm text-gray-400">{a.type} Partner · Applied {a.date}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor[a.status]}`}>{a.status}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
