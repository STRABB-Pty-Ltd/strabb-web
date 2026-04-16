"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bed,
  Calendar,
  DollarSign,
  LogIn,
  Percent,
  Sparkles,
} from "lucide-react";

import type { KPIData } from "@/hooks/use-dashboard";

const iconMap: Record<string, React.ElementType> = {
  "dollar-sign": DollarSign,
  calendar: Calendar,
  percent: Percent,
  bed: Bed,
  "log-in": LogIn,
  sparkles: Sparkles,
};

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

interface KPICardProps {
  kpi: KPIData;
  compareValue?: string | number | null;
  onClick: () => void;
}

export function KPICard({ kpi, compareValue, onClick }: KPICardProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const Icon = iconMap[kpi.icon] ?? DollarSign;
  const hasTrend = typeof kpi.trend === "number" && kpi.trend !== 0;
  const trendPositive = (kpi.trend ?? 0) > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border bg-white p-4 text-left transition-shadow hover:shadow-md"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="mb-2 flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}
        >
          <Icon size={16} style={{ color: "var(--strabb-secondary)" }} />
        </div>
        {mounted && hasTrend && (
          <div
            className="ml-auto flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: trendPositive ? "rgba(22, 163, 74, 0.1)" : "rgba(220, 38, 38, 0.1)",
              color: trendPositive ? "#16A34A" : "#DC2626",
            }}
          >
            {trendPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(kpi.trend ?? 0)}%
          </div>
        )}
      </div>

      <p className="font-data text-2xl font-bold text-gray-900">
        {formatValue(kpi.value, kpi.type)}
      </p>

      {compareValue != null && (
        <p className="font-data mt-0.5 text-sm text-gray-400">
          vs {formatValue(compareValue, kpi.type)}
        </p>
      )}

      <p className="mt-1 text-xs text-gray-500">{kpi.label}</p>
    </button>
  );
}
