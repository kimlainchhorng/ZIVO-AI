'use client';

import { useState } from 'react';
import NavBar from '../components/NavBar';

const COLORS = {
  bg: "#0a0b14",
  bgPanel: "#0f1120",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
};

const fadeInCSS = '@keyframes fadeIn { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }';

type ServiceStatus = 'online' | 'degraded' | 'offline';

interface Service {
  name: string;
  status: ServiceStatus;
  uptime: string;
  latency: string;
}

const SERVICES: Service[] = [
  { name: 'API Gateway',     status: 'online',   uptime: '99.9%',  latency: '45ms'  },
  { name: 'Database',        status: 'online',   uptime: '99.7%',  latency: '12ms'  },
  { name: 'AI Service',      status: 'degraded', uptime: '98.1%',  latency: '340ms' },
  { name: 'Object Storage',  status: 'online',   uptime: '100%',   latency: '8ms'   },
  { name: 'Cache',           status: 'online',   uptime: '99.9%',  latency: '2ms'   },
];

const STATUS_COLOR: Record<ServiceStatus, string> = {
  online:   COLORS.success,
  degraded: COLORS.warning,
  offline:  COLORS.error,
};

interface Alert {
  id: number;
  name: string;
  description: string;
  enabled: boolean;
}

const INITIAL_ALERTS: Alert[] = [
  { id: 1, name: 'High Latency',    description: 'Alert when response time exceeds 500ms', enabled: true  },
  { id: 2, name: 'Error Rate Spike', description: 'Alert when error rate exceeds 2% in 5min window', enabled: true  },
  { id: 3, name: 'Disk Usage',       description: 'Alert when disk usage exceeds 85%', enabled: false },
];

const INCIDENTS = [
  {
    date: '2026-03-10',
    severity: 'minor',
    description: 'Elevated AI Service latency due to model warm-up delay.',
    resolution: '14 min',
  },
  {
    date: '2026-02-28',
    severity: 'major',
    description: 'Database primary failover triggered during high-write period.',
    resolution: '8 min',
  },
  {
    date: '2026-02-14',
    severity: 'minor',
    description: 'Redis cache eviction caused temporary cache miss surge (68%).',
    resolution: '22 min',
  },
];

const SEVERITY_COLORS: Record<string, string> = {
  minor: COLORS.warning,
  major: COLORS.error,
};

const UPTIME_POINTS = [99.9, 100, 99.7, 99.9, 98.1, 99.5, 99.9];

function buildUptimePath(points: number[]): string {
  const w = 500, h = 60, pad = 8;
  const min = 97, max = 100.1;
  return points.map((v, i) => {
    const x = pad + (i / (points.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / (max - min)) * (h - pad * 2);
    return `${x},${y}`;
  }).join(' ');
}

const HEALTH_SCORE = 94;
const CIRCUMFERENCE = 2 * Math.PI * 45;

export default function HealthPage() {
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);

  const toggleAlert = (id: number) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const uptimeLine = buildUptimePath(UPTIME_POINTS);

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', color: COLORS.textPrimary }}>
      <style>{fadeInCSS}</style>
      <NavBar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 6px' }}>System Health</h1>
            <p style={{ margin: 0, color: COLORS.textMuted, fontSize: 14 }}>Live infrastructure status and monitoring</p>
          </div>
          {/* Health Score Ring */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <svg width="110" height="110" viewBox="0 0 110 110">
              <circle cx="55" cy="55" r="45" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <circle cx="55" cy="55" r="45" fill="none" stroke={COLORS.success} strokeWidth="8"
                strokeDasharray={`${(HEALTH_SCORE / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                strokeDashoffset={CIRCUMFERENCE * 0.25}
                strokeLinecap="round"
                style={{ transform: 'rotate(-90deg)', transformOrigin: '55px 55px' }}
              />
              <text x="55" y="51" textAnchor="middle" fill={COLORS.textPrimary} fontSize="18" fontWeight="700">{HEALTH_SCORE}%</text>
              <text x="55" y="67" textAnchor="middle" fill={COLORS.textMuted} fontSize="10">Health Score</text>
            </svg>
          </div>
        </div>

        {/* Service Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 28 }}>
          {SERVICES.map(svc => (
            <div key={svc.name} style={{
              background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12,
              padding: '18px 16px', animation: 'fadeIn 0.35s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: STATUS_COLOR[svc.status], flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{svc.name}</span>
              </div>
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 4 }}>
                Status: <span style={{ color: STATUS_COLOR[svc.status], fontWeight: 600 }}>{svc.status}</span>
              </div>
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 4 }}>
                Uptime: <span style={{ color: COLORS.textSecondary, fontWeight: 600 }}>{svc.uptime}</span>
              </div>
              <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                Latency: <span style={{ color: COLORS.textSecondary, fontWeight: 600 }}>{svc.latency}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Uptime Chart */}
        <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>7-Day Uptime Trend</h2>
          <svg viewBox="0 0 500 60" style={{ width: '100%', height: 60 }}>
            <polyline points={uptimeLine} fill="none" stroke={COLORS.success} strokeWidth="2.5" strokeLinejoin="round" />
            {UPTIME_POINTS.map((v, i) => {
              const x = 8 + (i / (UPTIME_POINTS.length - 1)) * 484;
              const y = 60 - 8 - ((v - 97) / 3.1) * 44;
              return <circle key={i} cx={x} cy={y} r="3.5" fill={COLORS.success} />;
            })}
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <span key={d}>{d}</span>)}
          </div>
        </div>

        {/* Alerts + Incidents */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Alert Configs */}
          <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 18px' }}>Alert Configuration</h2>
            {alerts.map(alert => (
              <div key={alert.id} style={{
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                padding: '12px 0', borderBottom: `1px solid ${COLORS.border}`,
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary, marginBottom: 4 }}>{alert.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted }}>{alert.description}</div>
                </div>
                <div onClick={() => toggleAlert(alert.id)} style={{
                  width: 40, height: 22, borderRadius: 11, background: alert.enabled ? COLORS.accent : 'rgba(255,255,255,0.1)',
                  position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0, marginLeft: 12,
                }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 3, left: alert.enabled ? 21 : 3, transition: 'left 0.2s',
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* Incident Timeline */}
          <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 18px' }}>Incident Timeline</h2>
            {INCIDENTS.map((inc, i) => (
              <div key={i} style={{
                padding: '12px 0', borderBottom: i < INCIDENTS.length - 1 ? `1px solid ${COLORS.border}` : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: COLORS.textMuted }}>{inc.date}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 5, textTransform: 'uppercase',
                    background: `${SEVERITY_COLORS[inc.severity]}22`, color: SEVERITY_COLORS[inc.severity],
                  }}>{inc.severity}</span>
                </div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 }}>{inc.description}</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>Resolved in: <span style={{ color: COLORS.success }}>{inc.resolution}</span></div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
