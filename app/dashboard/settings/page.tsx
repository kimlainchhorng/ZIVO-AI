"use client";

import { useState } from "react";

const s = {
  page: { minHeight: "100vh", background: "#0a0a0a", color: "#f0f0f0", padding: "32px" } as React.CSSProperties,
  title: { fontSize: 32, fontWeight: 900, margin: 0, color: "#fff" } as React.CSSProperties,
  subtitle: { color: "#888", marginTop: 8, fontSize: 16, marginBottom: 32 } as React.CSSProperties,
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 900 } as React.CSSProperties,
  card: { background: "#111", borderRadius: 16, padding: 28, border: "1px solid #222" } as React.CSSProperties,
  sectionTitle: { fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 18 } as React.CSSProperties,
  label: { display: "block", color: "#888", fontSize: 13, marginBottom: 6, fontWeight: 600 } as React.CSSProperties,
  input: { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #333", background: "#0a0a0a", color: "#f0f0f0", fontSize: 14, boxSizing: "border-box" as const },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #1a1a1a" } as React.CSSProperties,
  btn: { padding: "10px 20px", borderRadius: 10, border: "none", background: "#6c47ff", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" } as React.CSSProperties,
  dangerBtn: { padding: "10px 20px", borderRadius: 10, border: "1px solid #f44336", background: "transparent", color: "#f44336", fontWeight: 700, fontSize: 14, cursor: "pointer" } as React.CSSProperties,
  toggle: { width: 42, height: 24, borderRadius: 99, cursor: "pointer", border: "none", transition: "background 0.2s" } as React.CSSProperties,
  maskedKey: { fontFamily: "monospace", color: "#888", fontSize: 14 } as React.CSSProperties,
  planBadge: { background: "#1a0a30", color: "#a78bfa", fontSize: 13, padding: "4px 12px", borderRadius: 99, fontWeight: 700 } as React.CSSProperties,
  progressBar: { height: 8, borderRadius: 99, background: "#1a1a1a", overflow: "hidden", marginTop: 8 } as React.CSSProperties,
};

export default function SettingsPage() {
  const [name, setName] = useState("Alex Johnson");
  const [email, setEmail] = useState("alex@zivo.ai");
  const [twoFa, setTwoFa] = useState(false);
  const [emailNotif, setEmailNotif] = useState(true);
  const [slackNotif, setSlackNotif] = useState(false);
  const [saved, setSaved] = useState("");

  function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaved("✓ Profile saved");
    setTimeout(() => setSaved(""), 3000);
  }

  return (
    <div style={s.page}>
      <h1 style={s.title}>Settings</h1>
      <p style={s.subtitle}>Manage your account, billing, and preferences</p>

      <div style={s.grid}>
        {/* Profile */}
        <div style={s.card}>
          <div style={s.sectionTitle}>Profile</div>
          <form onSubmit={saveProfile}>
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>Full Name</label>
              <input style={s.input} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={s.label}>Email Address</label>
              <input style={s.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button style={s.btn} type="submit">Save Changes</button>
            {saved && <span style={{ marginLeft: 12, color: "#4caf50", fontSize: 14 }}>{saved}</span>}
          </form>
        </div>

        {/* API Keys */}
        <div style={s.card}>
          <div style={s.sectionTitle}>API Keys</div>
          <div style={s.row}>
            <div>
              <div style={{ color: "#fff", fontWeight: 600 }}>Production Key</div>
              <div style={s.maskedKey}>zivo_prod_••••••••••••••••ab3f</div>
            </div>
            <button style={{ ...s.btn, background: "#1a1a1a", color: "#ccc", border: "1px solid #333" }}>
              Regenerate
            </button>
          </div>
          <div style={{ ...s.row, borderBottom: "none" }}>
            <div>
              <div style={{ color: "#fff", fontWeight: 600 }}>Test Key</div>
              <div style={s.maskedKey}>zivo_test_••••••••••••••••7d2c</div>
            </div>
            <button style={{ ...s.btn, background: "#1a1a1a", color: "#ccc", border: "1px solid #333" }}>
              Regenerate
            </button>
          </div>
        </div>

        {/* Plan & Billing */}
        <div style={s.card}>
          <div style={s.sectionTitle}>Plan & Billing</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ color: "#fff", fontWeight: 600 }}>Current Plan</div>
              <div style={{ color: "#888", fontSize: 13 }}>Renews on Aug 1, 2025</div>
            </div>
            <span style={s.planBadge}>Pro</span>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#888", fontSize: 13 }}>
              <span>API Usage</span><span>1,284 / 5,000 calls</span>
            </div>
            <div style={s.progressBar}>
              <div style={{ width: "25.7%", height: "100%", background: "#6c47ff", borderRadius: 99 }} />
            </div>
          </div>
          <button style={{ ...s.btn, width: "100%" }}>Upgrade to Enterprise</button>
        </div>

        {/* Security */}
        <div style={s.card}>
          <div style={s.sectionTitle}>Security</div>
          <div style={s.row}>
            <div>
              <div style={{ color: "#fff", fontWeight: 600 }}>Two-Factor Authentication</div>
              <div style={{ color: "#888", fontSize: 13 }}>Add an extra layer of security</div>
            </div>
            <button
              style={{ ...s.toggle, background: twoFa ? "#6c47ff" : "#333" }}
              onClick={() => setTwoFa(!twoFa)}
            />
          </div>
          <div style={{ ...s.row, borderBottom: "none" }}>
            <div>
              <div style={{ color: "#fff", fontWeight: 600 }}>Active Sessions</div>
              <div style={{ color: "#888", fontSize: 13 }}>2 active sessions</div>
            </div>
            <button style={s.dangerBtn}>Revoke All</button>
          </div>
        </div>

        {/* Notifications */}
        <div style={{ ...s.card, gridColumn: "1 / -1" }}>
          <div style={s.sectionTitle}>Notifications</div>
          <div style={s.row}>
            <div>
              <div style={{ color: "#fff", fontWeight: 600 }}>Email Notifications</div>
              <div style={{ color: "#888", fontSize: 13 }}>Generation completions, billing, team invites</div>
            </div>
            <button
              style={{ ...s.toggle, background: emailNotif ? "#6c47ff" : "#333" }}
              onClick={() => setEmailNotif(!emailNotif)}
            />
          </div>
          <div style={{ ...s.row, borderBottom: "none" }}>
            <div>
              <div style={{ color: "#fff", fontWeight: 600 }}>Slack Notifications</div>
              <div style={{ color: "#888", fontSize: 13 }}>Send alerts to connected Slack workspace</div>
            </div>
            <button
              style={{ ...s.toggle, background: slackNotif ? "#6c47ff" : "#333" }}
              onClick={() => setSlackNotif(!slackNotif)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
