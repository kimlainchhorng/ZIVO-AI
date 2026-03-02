"use client";

import { useState } from "react";

interface Member {
  id: string;
  name: string;
  email: string;
  role: "admin" | "developer" | "viewer";
  joinedAt: string;
}

const MOCK_MEMBERS: Member[] = [
  { id: "1", name: "Alex Johnson", email: "alex@zivo.ai", role: "admin", joinedAt: "2025-01-15" },
  { id: "2", name: "Sam Rivera", email: "sam@zivo.ai", role: "developer", joinedAt: "2025-02-20" },
  { id: "3", name: "Taylor Kim", email: "taylor@zivo.ai", role: "developer", joinedAt: "2025-03-10" },
  { id: "4", name: "Jordan Lee", email: "jordan@zivo.ai", role: "viewer", joinedAt: "2025-04-05" },
];

const MOCK_ACTIVITY = [
  { id: "a1", user: "Alex Johnson", action: "Generated landing page", time: "2 hours ago" },
  { id: "a2", user: "Sam Rivera", action: "Installed SEO Optimizer plugin", time: "5 hours ago" },
  { id: "a3", user: "Taylor Kim", action: "Published site v3", time: "1 day ago" },
  { id: "a4", user: "Jordan Lee", action: "Viewed analytics dashboard", time: "2 days ago" },
];

const ROLE_COLORS: Record<string, string> = {
  admin: "#f5a623",
  developer: "#6c47ff",
  viewer: "#4caf50",
};

const s = {
  page: { minHeight: "100vh", background: "#0a0a0a", color: "#f0f0f0", padding: "32px" } as React.CSSProperties,
  title: { fontSize: 32, fontWeight: 900, margin: 0, color: "#fff" } as React.CSSProperties,
  subtitle: { color: "#888", marginTop: 8, fontSize: 16, marginBottom: 32 } as React.CSSProperties,
  section: { marginBottom: 40 } as React.CSSProperties,
  sectionTitle: { fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 16 } as React.CSSProperties,
  card: { background: "#111", borderRadius: 16, padding: 24, border: "1px solid #222" } as React.CSSProperties,
  row: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #1a1a1a" } as React.CSSProperties,
  input: { width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #333", background: "#0a0a0a", color: "#f0f0f0", fontSize: 15, boxSizing: "border-box" as const },
  select: { padding: "12px 14px", borderRadius: 10, border: "1px solid #333", background: "#0a0a0a", color: "#f0f0f0", fontSize: 15 } as React.CSSProperties,
  btn: { padding: "12px 24px", borderRadius: 10, border: "none", background: "#6c47ff", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" } as React.CSSProperties,
};

export default function TeamPage() {
  const [members] = useState<Member[]>(MOCK_MEMBERS);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "developer" | "viewer">("developer");
  const [status, setStatus] = useState("");

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("Sending invite…");
    const res = await fetch("/api/team/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId: "team-demo", email, role }),
    });
    const data = await res.json();
    if (data.ok) {
      setStatus(`✓ ${data.message}`);
      setEmail("");
    } else {
      setStatus(`Error: ${data.error}`);
    }
  }

  return (
    <div style={s.page}>
      <h1 style={s.title}>Team Management</h1>
      <p style={s.subtitle}>Manage your team members and permissions</p>

      <div style={s.section}>
        <div style={s.sectionTitle}>Members ({members.length})</div>
        <div style={s.card}>
          {members.map((m, i) => (
            <div key={m.id} style={{ ...s.row, borderBottom: i === members.length - 1 ? "none" : "1px solid #1a1a1a" }}>
              <div>
                <div style={{ fontWeight: 700, color: "#fff" }}>{m.name}</div>
                <div style={{ color: "#666", fontSize: 13 }}>{m.email} · Joined {m.joinedAt}</div>
              </div>
              <span style={{ background: "#1a1a1a", color: ROLE_COLORS[m.role], fontSize: 13, padding: "4px 12px", borderRadius: 99, fontWeight: 700 }}>
                {m.role.charAt(0).toUpperCase() + m.role.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={s.section}>
        <div style={s.sectionTitle}>Invite Member</div>
        <div style={s.card}>
          <form onSubmit={handleInvite} style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" as const }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ color: "#888", fontSize: 13, marginBottom: 6 }}>Email Address</div>
              <input
                style={s.input}
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <div style={{ color: "#888", fontSize: 13, marginBottom: 6 }}>Role</div>
              <select style={s.select} value={role} onChange={(e) => setRole(e.target.value as "admin" | "developer" | "viewer")}>
                <option value="admin">Admin</option>
                <option value="developer">Developer</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <button style={s.btn} type="submit">Send Invite</button>
          </form>
          {status && <div style={{ marginTop: 12, color: status.startsWith("✓") ? "#4caf50" : "#f44336", fontSize: 14 }}>{status}</div>}
        </div>
      </div>

      <div style={s.section}>
        <div style={s.sectionTitle}>Recent Activity</div>
        <div style={s.card}>
          {MOCK_ACTIVITY.map((item, i) => (
            <div key={item.id} style={{ ...s.row, borderBottom: i === MOCK_ACTIVITY.length - 1 ? "none" : "1px solid #1a1a1a" }}>
              <div>
                <span style={{ color: "#fff", fontWeight: 600 }}>{item.user}</span>
                <span style={{ color: "#888" }}> — {item.action}</span>
              </div>
              <div style={{ color: "#555", fontSize: 13 }}>{item.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
