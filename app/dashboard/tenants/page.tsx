"use client";

import React, { useEffect, useState } from "react";

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  plan: string;
  status: string;
  createdAt: string;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [name, setName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [plan, setPlan] = useState("starter");
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/tenant")
      .then((r) => r.json())
      .then((d) => setTenants(d.tenants ?? []))
      .catch(() => {});
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Creating…");
    const res = await fetch("/api/tenant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, subdomain, adminEmail, plan }),
    });
    const data = await res.json();
    if (data.ok) {
      setTenants((prev) => [data.tenant, ...prev]);
      setName("");
      setSubdomain("");
      setAdminEmail("");
      setStatus("Tenant created ✓");
    } else {
      setStatus(`Error: ${data.error}`);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "system-ui, sans-serif", padding: 32 }}>
      <a href="/dashboard" style={{ color: "#888", fontSize: 13 }}>← Dashboard</a>
      <h1 style={{ fontSize: 28, fontWeight: 800, margin: "16px 0 4px" }}>🏢 Tenant Management</h1>
      <p style={{ color: "#888", marginBottom: 32 }}>Multi-tenant SaaS administration panel.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={{ background: "#111", borderRadius: 12, border: "1px solid #222", padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Create Tenant</h2>
          <form onSubmit={create} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { val: name, set: setName, ph: "Organisation name" },
              { val: subdomain, set: setSubdomain, ph: "subdomain (e.g. acme)" },
              { val: adminEmail, set: setAdminEmail, ph: "Admin email" },
            ].map(({ val, set, ph }) => (
              <input key={ph} value={val} onChange={(e) => set(e.target.value)} placeholder={ph} required
                style={{ padding: 10, borderRadius: 8, border: "1px solid #333", background: "#0a0a0a", color: "#fff" }} />
            ))}
            <select value={plan} onChange={(e) => setPlan(e.target.value)}
              style={{ padding: 10, borderRadius: 8, border: "1px solid #333", background: "#0a0a0a", color: "#fff" }}>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <button type="submit"
              style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "#fff", color: "#000", fontWeight: 700, cursor: "pointer" }}>
              Create Tenant
            </button>
            {status && <p style={{ color: "#aaa", fontSize: 13 }}>{status}</p>}
          </form>
        </div>

        <div style={{ background: "#111", borderRadius: 12, border: "1px solid #222", padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Tenants ({tenants.length})</h2>
          {tenants.length === 0 ? (
            <p style={{ color: "#555" }}>No tenants yet.</p>
          ) : (
            tenants.map((t) => (
              <div key={t.id} style={{ padding: "12px 0", borderBottom: "1px solid #222" }}>
                <div style={{ fontWeight: 600 }}>{t.name}</div>
                <div style={{ color: "#888", fontSize: 12 }}>{t.subdomain}.zivoai.com · {t.plan} · {t.status}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
