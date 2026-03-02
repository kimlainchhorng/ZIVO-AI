"use client";

import { useState } from "react";
import Navigation from "../components/Navigation";

const methods = ["GET", "POST", "PUT", "DELETE"] as const;
type Method = typeof methods[number];

const methodColors: Record<Method, string> = {
  GET: "bg-emerald-900 text-emerald-300",
  POST: "bg-blue-900 text-blue-300",
  PUT: "bg-yellow-900 text-yellow-300",
  DELETE: "bg-red-900 text-red-300",
};

const endpoints = [
  { method: "GET" as Method, path: "/api/v2/users", rateLimit: "1000/min", calls: 48200 },
  { method: "POST" as Method, path: "/api/v2/chat", rateLimit: "100/min", calls: 23100 },
  { method: "GET" as Method, path: "/api/v2/analytics", rateLimit: "500/min", calls: 12800 },
  { method: "POST" as Method, path: "/api/v2/search", rateLimit: "200/min", calls: 9400 },
  { method: "PUT" as Method, path: "/api/v2/workflow/:id", rateLimit: "50/min", calls: 4200 },
  { method: "DELETE" as Method, path: "/api/v2/workflow/:id", rateLimit: "20/min", calls: 870 },
];

const apiVersions = [
  { version: "v3", status: "current", released: "2024-11-01", deprecated: false },
  { version: "v2", status: "supported", released: "2024-03-15", deprecated: false },
  { version: "v1", status: "deprecated", released: "2023-06-01", deprecated: true },
];

const apiKeys = [
  { name: "Web App Key", key: "zivo_••••••••••1abc", scopes: "read, write", calls: 92300 },
  { name: "Mobile App Key", key: "zivo_••••••••••2def", scopes: "read", calls: 41200 },
];

const maxCalls = Math.max(...endpoints.map((e) => e.calls), 1);

export default function ApiManagementPage() {
  const [keys, setKeys] = useState(apiKeys);

  const revokeKey = (name: string) => {
    setKeys((prev) => prev.filter((k) => k.name !== name));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
          API Management
        </h1>
        <p className="text-gray-400 mb-10">Rate limiting, versioning, and API gateway</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* API keys */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">API Keys</h2>
              <button className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-3 py-1.5 text-xs font-medium transition-colors">
                + Create
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {keys.map((k) => (
                <div key={k.name} className="border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-white">{k.name}</span>
                    <button onClick={() => revokeKey(k.name)} className="text-red-400 hover:text-red-300 text-xs transition-colors">
                      Revoke
                    </button>
                  </div>
                  <p className="text-gray-500 text-xs font-mono mb-1">{k.key}</p>
                  <p className="text-gray-500 text-xs">Scopes: {k.scopes}</p>
                  <p className="text-gray-500 text-xs">{k.calls.toLocaleString()} calls/day</p>
                </div>
              ))}
            </div>
          </div>

          {/* Versioning */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="font-semibold mb-4">API Versions</h2>
            <div className="flex flex-col gap-4">
              {apiVersions.map((v) => (
                <div key={v.version} className="border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white">{v.version}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      v.status === "current" ? "bg-emerald-900 text-emerald-300"
                      : v.status === "supported" ? "bg-blue-900 text-blue-300"
                      : "bg-red-900 text-red-300"
                    }`}>
                      {v.status}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs">Released: {v.released}</p>
                  {v.deprecated && (
                    <p className="text-red-400 text-xs mt-1">⚠️ Deprecated — migrate to v3</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Rate limits */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="font-semibold mb-4">Rate Limiting</h2>
            <div className="flex flex-col gap-3">
              {[
                { tier: "Free", limit: "100 req/min", color: "text-gray-300" },
                { tier: "Pro", limit: "1,000 req/min", color: "text-blue-300" },
                { tier: "Enterprise", limit: "Unlimited", color: "text-purple-300" },
              ].map((t) => (
                <div key={t.tier} className="flex justify-between items-center border-b border-gray-700 pb-2 last:border-0">
                  <span className="text-gray-400 text-sm">{t.tier}</span>
                  <span className={`text-sm font-medium ${t.color}`}>{t.limit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Endpoints table */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
          <h2 className="font-semibold mb-4">Endpoints</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left pb-3 font-medium">Method</th>
                  <th className="text-left pb-3 font-medium">Path</th>
                  <th className="text-right pb-3 font-medium">Rate Limit</th>
                  <th className="text-right pb-3 font-medium">Calls/day</th>
                </tr>
              </thead>
              <tbody>
                {endpoints.map((ep) => (
                  <tr key={`${ep.method}-${ep.path}`} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${methodColors[ep.method]}`}>
                        {ep.method}
                      </span>
                    </td>
                    <td className="py-3 text-gray-300 font-mono">{ep.path}</td>
                    <td className="py-3 text-right text-gray-400">{ep.rateLimit}</td>
                    <td className="py-3 text-right text-purple-400">{ep.calls.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Usage chart */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="font-semibold mb-4">Endpoint Usage</h2>
          <div className="flex flex-col gap-3">
            {endpoints.map((ep) => (
              <div key={`chart-${ep.method}-${ep.path}`} className="flex items-center gap-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded flex-shrink-0 ${methodColors[ep.method]}`}>{ep.method}</span>
                <span className="text-gray-400 text-sm w-44 truncate font-mono">{ep.path}</span>
                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${(ep.calls / maxCalls) * 100}%` }}
                  ></div>
                </div>
                <span className="text-gray-300 text-sm w-16 text-right">{(ep.calls / 1000).toFixed(1)}k</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
