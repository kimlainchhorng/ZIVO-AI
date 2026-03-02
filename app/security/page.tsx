"use client";

import { useState } from "react";
import Navigation from "../components/Navigation";

const compliance = [
  { name: "SOC 2 Type II", status: true },
  { name: "GDPR", status: true },
  { name: "HIPAA", status: true },
  { name: "ISO 27001", status: true },
  { name: "PCI DSS", status: false },
];

const threats = [
  { level: "low", message: "Unusual login attempt from new IP (192.168.x.x)", time: "5m ago" },
  { level: "medium", message: "API key used from unrecognized region", time: "1h ago" },
  { level: "low", message: "Rate limit threshold reached on /api/chat", time: "2h ago" },
  { level: "high", message: "SQL injection pattern detected and blocked", time: "1d ago" },
];

const apiKeys = [
  { name: "Production Key", key: "sk-prod-••••••••••••3a9f", lastUsed: "2m ago", status: "active" },
  { name: "Dev Key", key: "sk-dev-••••••••••••b72c", lastUsed: "1h ago", status: "active" },
  { name: "Legacy Key", key: "sk-leg-••••••••••••f11d", lastUsed: "30d ago", status: "revoked" },
];

const policies = [
  { name: "Zero-Trust Authentication", enabled: true },
  { name: "MFA Enforcement", enabled: true },
  { name: "IP Allowlisting", enabled: false },
  { name: "Audit Logging", enabled: true },
  { name: "DLP Scanning", enabled: false },
];

const threatColors: Record<string, string> = {
  low: "border-blue-800 bg-blue-900/20 text-blue-300",
  medium: "border-yellow-800 bg-yellow-900/20 text-yellow-300",
  high: "border-red-800 bg-red-900/20 text-red-300",
};

export default function SecurityPage() {
  const [policyState, setPolicyState] = useState(
    Object.fromEntries(policies.map((p) => [p.name, p.enabled]))
  );

  const togglePolicy = (name: string) => {
    setPolicyState((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const score = 94;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
          Security Suite
        </h1>
        <p className="text-gray-400 mb-10">Zero-trust security, threat detection, and compliance</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Security score */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 flex flex-col items-center justify-center">
            <p className="text-gray-400 text-sm mb-4">Security Score</p>
            <div className="relative w-36 h-36">
              <svg className="w-36 h-36 -rotate-90" viewBox="0 0 144 144">
                <circle cx="72" cy="72" r="60" fill="none" stroke="#374151" strokeWidth="14" />
                <circle
                  cx="72" cy="72" r="60"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="14"
                  strokeDasharray={`${(score / 100) * 377} 377`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-white">{score}</span>
                <span className="text-gray-400 text-xs">/ 100</span>
              </div>
            </div>
            <p className="text-emerald-400 text-sm mt-4 font-medium">Excellent</p>
          </div>

          {/* Compliance */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="font-semibold mb-4">Compliance</h2>
            <div className="flex flex-col gap-3">
              {compliance.map((c) => (
                <div key={c.name} className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">{c.name}</span>
                  <span className={c.status ? "text-emerald-400" : "text-gray-500"}>
                    {c.status ? "✓ Compliant" : "✗ Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Zero-trust policies */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="font-semibold mb-4">Zero-Trust Policies</h2>
            <div className="flex flex-col gap-3">
              {policies.map((p) => (
                <div key={p.name} className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">{p.name}</span>
                  <button
                    onClick={() => togglePolicy(p.name)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${policyState[p.name] ? "bg-purple-600" : "bg-gray-600"}`}
                    aria-label={`Toggle ${p.name}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${policyState[p.name] ? "left-5" : "left-0.5"}`}></span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Threat detection */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="font-semibold mb-4">Threat Detection</h2>
            <div className="flex flex-col gap-3">
              {threats.map((t, i) => (
                <div key={i} className={`rounded-lg border p-3 text-sm ${threatColors[t.level]}`}>
                  <div className="flex justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <span className="font-bold uppercase text-xs mt-0.5">[{t.level}]</span>
                      <span>{t.message}</span>
                    </div>
                    <span className="text-gray-500 flex-shrink-0 text-xs">{t.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* API Key management */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">API Keys</h2>
              <button className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-3 py-1.5 text-xs font-medium transition-colors">
                + Create Key
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {apiKeys.map((k) => (
                <div key={k.name} className="border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-white">{k.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${k.status === "active" ? "bg-emerald-900 text-emerald-300" : "bg-red-900 text-red-300"}`}>
                      {k.status}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs font-mono mb-2">{k.key}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-xs">Last used {k.lastUsed}</span>
                    {k.status === "active" && (
                      <button className="text-red-400 hover:text-red-300 text-xs transition-colors">Revoke</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
