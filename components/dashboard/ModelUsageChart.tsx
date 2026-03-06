'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

export interface ModelUsageData {
  model: string;
  requests: number;
  tokens: number;
}

export interface ModelUsageChartProps {
  data: ModelUsageData[];
  title?: string;
}

const COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

const TOOLTIP_STYLE = {
  background: "#0f1120",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  color: "#f1f5f9",
  fontSize: "0.8rem",
};

export default function ModelUsageChart({ data, title = "Model Usage" }: ModelUsageChartProps): React.ReactElement {
  const totalRequests = data.reduce((s, d) => s + d.requests, 0);

  const pieData = data.map((d) => ({
    name: d.model,
    value: d.requests,
    pct: totalRequests > 0 ? Math.round((d.requests / totalRequests) * 100) : 0,
  }));

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: "1.25rem",
        fontFamily: "'Inter',system-ui,sans-serif",
      }}
    >
      <h3 style={{ margin: "0 0 1rem", fontSize: "0.9375rem", fontWeight: 600, color: "#f1f5f9" }}>
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {pieData.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value, name) => [`${value ?? 0} requests`, name]}
          />
          <Legend
            wrapperStyle={{ fontSize: "0.75rem", color: "#64748b" }}
            formatter={(value) => {
              const item = pieData.find((d) => d.name === value);
              return `${value} (${item?.pct ?? 0}%)`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      {data.length === 0 && (
        <p style={{ textAlign: "center", color: "#475569", fontSize: "0.875rem", margin: "1rem 0 0" }}>
          No model usage data yet
        </p>
      )}
    </div>
  );
}
