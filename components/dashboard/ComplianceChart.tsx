"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { COMPLIANCE_STATUS_LABELS } from "@/config";

interface ComplianceChartProps {
  statusCounts: Record<string, number>;
}

const STATUS_COLORS: Record<string, string> = {
  PASS: "#22c55e",
  FAIL: "#ef4444",
  PENDING: "#eab308",
  NOT_APPLICABLE: "#94a3b8",
  EXPIRED: "#f97316",
};

export function ComplianceChart({ statusCounts }: ComplianceChartProps) {
  const data = Object.entries(statusCounts)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: COMPLIANCE_STATUS_LABELS[status] ?? status,
      value: count,
      color: STATUS_COLORS[status] ?? "#94a3b8",
    }));

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        尚無合規紀錄
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value, name) => [value, name]} />
        <Legend iconType="circle" iconSize={8} />
      </PieChart>
    </ResponsiveContainer>
  );
}
