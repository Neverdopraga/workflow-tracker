"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { Task } from "@/lib/types";

interface StatusChartProps {
  tasks: Task[];
}

const COLORS = {
  Pending: "#f59e0b",
  Done: "#10b981",
  Delayed: "#ef4444",
};

export default function StatusChart({ tasks }: StatusChartProps) {
  const data = [
    { name: "Pending", value: tasks.filter((t) => t.status === "Pending").length },
    { name: "Done", value: tasks.filter((t) => t.status === "Done").length },
    { name: "Delayed", value: tasks.filter((t) => t.status === "Delayed").length },
  ].filter((d) => d.value > 0);

  if (!data.length) {
    return (
      <div className="bg-white rounded-2xl border border-border p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Task Distribution</h3>
        <div className="h-48 flex items-center justify-center text-sm text-gray-400">
          No tasks yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <h3 className="text-sm font-bold text-gray-900 mb-4">Task Distribution</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={COLORS[entry.name as keyof typeof COLORS]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                fontSize: "12px",
                fontWeight: 600,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-5 mt-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: COLORS[d.name as keyof typeof COLORS] }}
            />
            <span className="font-medium">{d.name}</span>
            <span className="font-bold text-gray-700">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
