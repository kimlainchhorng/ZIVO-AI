'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export interface UsageDataPoint {
  date: string;
  generations?: number;
  tokens?: number;
  errors?: number;
}

export interface UsageChartProps {
  data: UsageDataPoint[];
  type?: "line" | "bar";
  title?: string;
}

const TOOLTIP_STYLE = {
  background: "#0f1120",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  color: "#f1f5f9",
  fontSize: "0.8rem",
};

export default function UsageChart({ data, type = "line", title }: UsageChartProps): React.ReactElement {
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
      {title && (
        <h3 style={{ margin: "0 0 1rem", fontSize: "0.9375rem", fontWeight: 600, color: "#f1f5f9" }}>
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={200}>
        {type === "bar" ? (
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: "0.75rem", color: "#64748b" }} />
            <Bar dataKey="generations" fill="#6366f1" radius={[4, 4, 0, 0]} name="Generations" />
            {data[0]?.errors !== undefined && (
              <Bar dataKey="errors" fill="#ef4444" radius={[4, 4, 0, 0]} name="Errors" />
            )}
          </BarChart>
        ) : (
          <LineChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: "0.75rem", color: "#64748b" }} />
            <Line type="monotone" dataKey="generations" stroke="#6366f1" strokeWidth={2} dot={false} name="Generations" />
            {data[0]?.tokens !== undefined && (
              <Line type="monotone" dataKey="tokens" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Tokens" />
            )}
            {data[0]?.errors !== undefined && (
              <Line type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} dot={false} name="Errors" />
            )}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
