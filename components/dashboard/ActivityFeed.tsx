'use client';

import { formatDistanceToNow } from "date-fns";

export interface ActivityItem {
  id: string;
  type: "website" | "mobile" | "code" | "api" | "deploy" | "security";
  title: string;
  detail?: string;
  timestamp: string;
  success?: boolean;
}

const TYPE_CONFIG: Record<ActivityItem["type"], { icon: string; color: string }> = {
  website: { icon: "🌐", color: "#6366f1" },
  mobile: { icon: "📱", color: "#8b5cf6" },
  code: { icon: "⚡", color: "#06b6d4" },
  api: { icon: "🔌", color: "#10b981" },
  deploy: { icon: "🚀", color: "#f59e0b" },
  security: { icon: "🔐", color: "#ef4444" },
};

export interface ActivityFeedProps {
  items: ActivityItem[];
  title?: string;
  maxItems?: number;
}

export default function ActivityFeed({ items, title = "Recent Activity", maxItems = 8 }: ActivityFeedProps): React.ReactElement {
  const displayed = items.slice(0, maxItems);

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        overflow: "hidden",
        fontFamily: "'Inter',system-ui,sans-serif",
      }}
    >
      <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <h3 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 600, color: "#f1f5f9" }}>{title}</h3>
      </div>
      <div>
        {displayed.length === 0 ? (
          <p style={{ padding: "1.5rem", textAlign: "center", color: "#475569", margin: 0, fontSize: "0.875rem" }}>
            No activity yet
          </p>
        ) : (
          displayed.map((item, idx) => {
            const cfg = TYPE_CONFIG[item.type];
            return (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 1.25rem",
                  borderBottom: idx < displayed.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}
              >
                <span style={{ fontSize: "1rem", flexShrink: 0 }}>{cfg.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: "#f1f5f9",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.title}
                  </div>
                  {item.detail && (
                    <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.1rem" }}>
                      {item.detail}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.15rem", flexShrink: 0 }}>
                  <span style={{ fontSize: "0.7rem", color: "#475569" }}>
                    {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                  </span>
                  {item.success !== undefined && (
                    <span
                      style={{
                        fontSize: "0.65rem",
                        fontWeight: 600,
                        color: item.success ? "#10b981" : "#ef4444",
                      }}
                    >
                      {item.success ? "✓ Success" : "✗ Failed"}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
