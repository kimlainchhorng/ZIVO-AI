'use client';

import { useState, useEffect, useCallback } from "react";

export interface Notification {
  id: string;
  type: "generation_complete" | "build_failed" | "build_succeeded" | "security_alert" | "team_change" | "pr_ready";
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  metadata?: Record<string, unknown>;
}

const TYPE_CONFIG: Record<Notification["type"], { icon: string; color: string }> = {
  generation_complete: { icon: "✦", color: "#6366f1" },
  build_succeeded: { icon: "✅", color: "#10b981" },
  build_failed: { icon: "❌", color: "#ef4444" },
  security_alert: { icon: "🔐", color: "#f59e0b" },
  team_change: { icon: "👥", color: "#3b82f6" },
  pr_ready: { icon: "🔀", color: "#8b5cf6" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationCenter({ userId }: { userId?: string }): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (userId) params.set("user_id", userId);
      const res = await fetch(`/api/notifications?${params}`);
      if (res.ok) {
        const data = await res.json() as { notifications: Notification[] };
        setNotifications(data.notifications ?? []);
      }
    } catch {
      // Silently ignore fetch errors
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read", user_id: userId }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // Ignore errors
    }
  };

  const markRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read", id }),
      });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {
      // Ignore errors
    }
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "relative",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "0.35rem",
          color: "#94a3b8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-label="Notifications"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 16,
              height: 16,
              background: "#ef4444",
              borderRadius: "50%",
              fontSize: "0.6rem",
              fontWeight: 700,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            style={{ position: "fixed", inset: 0, zIndex: 49 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              width: 360,
              maxHeight: 480,
              display: "flex",
              flexDirection: "column",
              background: "#0f1120",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              zIndex: 50,
              overflow: "hidden",
              fontFamily: "'Inter',system-ui,sans-serif",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.875rem 1rem",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "#f1f5f9" }}>
                Notifications {unreadCount > 0 && <span style={{ marginLeft: 4, padding: "1px 6px", background: "#6366f1", borderRadius: 10, fontSize: "0.7rem", color: "#fff" }}>{unreadCount}</span>}
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  style={{ background: "transparent", border: "none", color: "#6366f1", fontSize: "0.75rem", cursor: "pointer", fontWeight: 500 }}
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {loading ? (
                <div style={{ padding: "1.5rem", textAlign: "center", color: "#475569", fontSize: "0.8rem" }}>
                  Loading…
                </div>
              ) : notifications.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "#475569", fontSize: "0.8rem" }}>
                  No notifications yet
                </div>
              ) : (
                notifications.map((n) => {
                  const cfg = TYPE_CONFIG[n.type];
                  return (
                    <button
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      style={{
                        display: "flex",
                        gap: "0.75rem",
                        padding: "0.875rem 1rem",
                        background: n.read ? "transparent" : "rgba(99,102,241,0.06)",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        width: "100%",
                        border: "none",
                        borderBottomWidth: 1,
                        borderBottomStyle: "solid",
                        borderBottomColor: "rgba(255,255,255,0.04)",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span style={{ fontSize: "1.1rem", flexShrink: 0, lineHeight: 1.3 }}>{cfg.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: n.read ? 400 : 600, fontSize: "0.825rem", color: "#f1f5f9", marginBottom: "0.2rem" }}>
                          {n.title}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {n.message}
                        </div>
                      </div>
                      <span style={{ fontSize: "0.7rem", color: "#475569", flexShrink: 0, marginTop: "0.1rem" }}>
                        {timeAgo(n.created_at)}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
