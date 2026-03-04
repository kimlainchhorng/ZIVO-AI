'use client';
import { useState } from 'react';

type ServiceStatus = 'operational' | 'degraded' | 'outage';

interface Service {
  id: string;
  name: string;
  status: ServiceStatus;
  uptime: number;
}

interface Incident {
  id: string;
  title: string;
  service: string;
  severity: 'critical' | 'major' | 'minor';
  status: 'resolved' | 'investigating' | 'monitoring';
  timestamp: string;
  description: string;
}

interface UptimeBar {
  day: string;
  value: number;
  status: ServiceStatus;
}

interface GenerateStatusResponse {
  services: Service[];
  incidents: Incident[];
}

const MOCK_SERVICES: Service[] = [
  { id: '1', name: 'API Gateway', status: 'operational', uptime: 99.98 },
  { id: '2', name: 'Web App', status: 'operational', uptime: 99.95 },
  { id: '3', name: 'Database Cluster', status: 'degraded', uptime: 98.2 },
  { id: '4', name: 'CDN / Assets', status: 'operational', uptime: 100 },
  { id: '5', name: 'Auth Service', status: 'operational', uptime: 99.99 },
  { id: '6', name: 'Background Jobs', status: 'outage', uptime: 85.4 },
];

const MOCK_INCIDENTS: Incident[] = [
  { id: 'i1', title: 'Database slow query degradation', service: 'Database Cluster', severity: 'major', status: 'monitoring', timestamp: '2025-01-15 14:23 UTC', description: 'Elevated query latencies due to index rebuild. Read performance partially restored.' },
  { id: 'i2', title: 'Background job processor crash', service: 'Background Jobs', severity: 'critical', status: 'investigating', timestamp: '2025-01-15 16:05 UTC', description: 'Job workers failed to start after deployment. Engineers are rolling back.' },
  { id: 'i3', title: 'CDN cache purge delay', service: 'CDN / Assets', severity: 'minor', status: 'resolved', timestamp: '2025-01-14 09:10 UTC', description: 'Cache propagation was delayed by 15 minutes. Fully resolved.' },
];

function generateUptimeBars(uptime: number): UptimeBar[] {
  return Array.from({ length: 30 }, (_, i) => {
    const day = new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString('en', { month: 'short', day: 'numeric' });
    const isRecent = i >= 28;
    const value = isRecent ? uptime : Math.min(100, uptime + (Math.random() - 0.3) * 2);
    const status: ServiceStatus = value >= 99 ? 'operational' : value >= 95 ? 'degraded' : 'outage';
    return { day, value, status };
  });
}

const STATUS_COLORS: Record<ServiceStatus, string> = {
  operational: 'bg-green-500',
  degraded: 'bg-amber-500',
  outage: 'bg-red-500',
};

const STATUS_TEXT: Record<ServiceStatus, string> = {
  operational: 'text-green-400',
  degraded: 'text-amber-400',
  outage: 'text-red-400',
};

const STATUS_LABELS: Record<ServiceStatus, string> = {
  operational: 'Operational',
  degraded: 'Degraded',
  outage: 'Outage',
};

const SEVERITY_COLORS: Record<Incident['severity'], string> = {
  critical: 'bg-red-900/50 text-red-300 border-red-700/50',
  major: 'bg-amber-900/50 text-amber-300 border-amber-700/50',
  minor: 'bg-blue-900/50 text-blue-300 border-blue-700/50',
};

const INCIDENT_STATUS_COLORS: Record<Incident['status'], string> = {
  resolved: 'text-green-400',
  investigating: 'text-red-400',
  monitoring: 'text-amber-400',
};

function StatusIndicator({ status }: { status: ServiceStatus }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[status]}`} />
      <span className={`text-xs font-medium ${STATUS_TEXT[status]}`}>{STATUS_LABELS[status]}</span>
    </div>
  );
}

function UptimeGraph({ bars }: { bars: UptimeBar[] }) {
  return (
    <div className="flex items-end gap-0.5 h-8">
      {bars.map((bar, i) => (
        <div
          key={i}
          title={`${bar.day}: ${bar.value.toFixed(2)}%`}
          style={{ height: `${Math.max(20, bar.value)}%` }}
          className={`flex-1 rounded-sm ${STATUS_COLORS[bar.status]} opacity-80 hover:opacity-100 transition-opacity cursor-pointer`}
        />
      ))}
    </div>
  );
}

function IncidentTimeline({ incidents }: { incidents: Incident[] }) {
  return (
    <div className="space-y-3">
      {incidents.map(incident => (
        <div key={incident.id} className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4">
          <div className="flex items-start justify-between gap-3 mb-1">
            <span className="font-medium text-sm">{incident.title}</span>
            <span className={`text-xs px-2 py-0.5 rounded border flex-shrink-0 ${SEVERITY_COLORS[incident.severity]}`}>
              {incident.severity}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
            <span className={INCIDENT_STATUS_COLORS[incident.status]}>● {incident.status}</span>
            <span>{incident.service}</span>
            <span>{incident.timestamp}</span>
          </div>
          <p className="text-xs text-gray-400">{incident.description}</p>
        </div>
      ))}
    </div>
  );
}

export default function StatusPage() {
  const [appName, setAppName] = useState('My Application');
  const [serviceInput, setServiceInput] = useState('');
  const [services, setServices] = useState<Service[]>(MOCK_SERVICES);
  const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS);
  const [loading, setLoading] = useState(false);

  const overallStatus: ServiceStatus = services.some(s => s.status === 'outage')
    ? 'outage'
    : services.some(s => s.status === 'degraded')
    ? 'degraded'
    : 'operational';

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/generate-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appName, services: serviceInput }),
      });
      if (res.ok) {
        const data = await res.json() as GenerateStatusResponse;
        setServices(data.services);
        setIncidents(data.incidents);
      }
    } catch { /* use mock data */ } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <h1 className="text-2xl font-bold mb-2">Status Page Builder</h1>
      <p className="text-gray-400 text-sm mb-8">Generate and monitor a status page for your application.</p>

      {/* Config */}
      <div className="bg-[#111111] border border-white/10 rounded-xl p-5 mb-8">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Configuration</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">App Name</label>
            <input
              value={appName}
              onChange={e => setAppName(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6366f1]"
              placeholder="My Application"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Services (comma-separated)</label>
            <input
              value={serviceInput}
              onChange={e => setServiceInput(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6366f1]"
              placeholder="API, Web App, Database…"
            />
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="mt-4 bg-[#6366f1] hover:bg-[#5254cc] disabled:opacity-50 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
        >
          {loading ? 'Generating…' : 'Generate Status Page'}
        </button>
      </div>

      {/* Overall Status Banner */}
      <div className={`rounded-xl p-5 mb-6 border ${overallStatus === 'operational' ? 'bg-green-950/30 border-green-700/40' : overallStatus === 'degraded' ? 'bg-amber-950/30 border-amber-700/40' : 'bg-red-950/30 border-red-700/40'}`}>
        <div className="flex items-center gap-3">
          <span className={`w-4 h-4 rounded-full ${STATUS_COLORS[overallStatus]}`} />
          <div>
            <p className="font-bold">{appName}</p>
            <p className={`text-sm ${STATUS_TEXT[overallStatus]}`}>{STATUS_LABELS[overallStatus]}</p>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Services</h2>
        <div className="space-y-3">
          {services.map(service => {
            const bars = generateUptimeBars(service.uptime);
            return (
              <div key={service.id} className="bg-[#111111] border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{service.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-400">{service.uptime.toFixed(2)}% uptime</span>
                    <StatusIndicator status={service.status} />
                  </div>
                </div>
                <UptimeGraph bars={bars} />
                <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Incidents */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Incident Timeline</h2>
        <IncidentTimeline incidents={incidents} />
      </section>
    </main>
  );
}
