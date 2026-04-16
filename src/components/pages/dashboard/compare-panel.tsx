"use client";

import type { KPIData } from "@/hooks/use-dashboard";

interface ComparePanelProps {
  current: KPIData[];
  comparison: KPIData[];
}

const formatValue = (value: string | number, type: KPIData["type"]) => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (type === "currency") {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      maximumFractionDigits: 0,
    }).format(num);
  }
  if (type === "percentage") return `${num}%`;
  return String(num);
};

export function ComparePanel({ current, comparison }: ComparePanelProps) {
  return (
    <div className="rounded-lg border bg-white p-4" style={{ borderColor: "var(--border)" }}>
      <h3 className="mb-3 text-sm font-semibold text-gray-700">Period Comparison</h3>
      <div className="space-y-2">
        {current.map((kpi, i) => {
          const comp = comparison[i];
          if (!comp) return null;
          const currentNum = typeof kpi.value === "string" ? parseFloat(kpi.value) : kpi.value;
          const compNum = typeof comp.value === "string" ? parseFloat(comp.value) : comp.value;
          const delta = compNum > 0 ? ((currentNum - compNum) / compNum) * 100 : 0;
          const positive = delta > 0;

          return (
            <div
              key={kpi.label}
              className="flex items-center justify-between rounded px-3 py-2 text-sm"
              style={{ backgroundColor: "#F9FAFB" }}
            >
              <span className="text-gray-600">{kpi.label}</span>
              <div className="flex items-center gap-4">
                <span className="font-data font-medium text-gray-900">
                  {formatValue(kpi.value, kpi.type)}
                </span>
                <span className="font-data text-gray-400">
                  {formatValue(comp.value, comp.type)}
                </span>
                <span
                  className="font-data text-xs font-medium"
                  style={{ color: positive ? "#16A34A" : "#DC2626" }}
                >
                  {positive ? "+" : ""}
                  {Math.round(delta * 10) / 10}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
