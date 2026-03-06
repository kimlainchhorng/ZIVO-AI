"use client";

import { useState } from "react";
import { Search, Globe, Loader2, CheckCircle, XCircle } from "lucide-react";

interface DomainRecord {
  type: string;
  name: string;
  value: string;
  ttl?: number;
}

interface DomainInfo {
  domain: string;
  available: boolean;
  records: DomainRecord[];
  sslStatus: "active" | "pending" | "inactive";
}

export default function DomainManager() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<DomainInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/domains?domain=${encodeURIComponent(query.trim())}`
      );
      const data = await res.json() as DomainInfo & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Lookup failed");
      setInfo(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const sslColor = {
    active: "text-green-600",
    pending: "text-yellow-600",
    inactive: "text-red-600",
  } as const;

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Globe className="w-5 h-5" /> Domain Manager
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Search domains and manage DNS records
        </p>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="example.com"
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="bg-indigo-600 text-white rounded-xl px-4 py-2 hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 text-sm"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          Search
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{error}</p>
      )}

      {info && (
        <div className="space-y-4 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {info.available ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <span className="font-medium text-gray-800">{info.domain}</span>
            </div>
            <span className={`text-xs font-medium ${sslColor[info.sslStatus]}`}>
              SSL: {info.sslStatus}
            </span>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              DNS Records
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-gray-700">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="pb-1 pr-3">Type</th>
                    <th className="pb-1 pr-3">Name</th>
                    <th className="pb-1 pr-3">Value</th>
                    <th className="pb-1">TTL</th>
                  </tr>
                </thead>
                <tbody>
                  {info.records.map((r, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-1 pr-3 font-mono text-indigo-600">
                        {r.type}
                      </td>
                      <td className="py-1 pr-3">{r.name}</td>
                      <td className="py-1 pr-3 font-mono truncate max-w-[180px]">
                        {r.value}
                      </td>
                      <td className="py-1">{r.ttl ?? 300}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
