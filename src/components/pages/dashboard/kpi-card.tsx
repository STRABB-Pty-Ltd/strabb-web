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
      className="rounded-lg p-md text-left transition-shadow hover:shadow-md"
      style={{ backgroundColor: "var(--surface-card)" }}
    >
      <div className="mb-sm flex items-center gap-base">
        <div
          className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: "var(--icon-bg)" }}
        >
          <Icon size={21} style={{ color: "var(--icon-color)" }} />
        </div>
        <p
          className="min-w-0 flex-1 truncate text-subheading font-medium"
          style={{ color: "var(--brand-10)" }}
        >
          {kpi.label}
        </p>
        {mounted && hasTrend && (
          <div
            className="flex shrink-0 items-center gap-xs rounded-full px-base py-xs text-body font-medium"
            style={{
              backgroundColor: "var(--neutral-30)",
              color: trendPositive ? "var(--status-completed)" : "var(--status-issues)",
            }}
          >
            {trendPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {Math.abs(kpi.trend ?? 0)}%
          </div>
        )}
      </div>

      <p className="font-data text-heading" style={{ color: "var(--brand-10)" }}>
        {formatValue(kpi.value, kpi.type)}
      </p>

      {compareValue != null && (
        <p
          className="font-data mt-xs text-body"
          style={{ color: "var(--brand-10)", opacity: 0.55 }}
        >
          vs {formatValue(compareValue, kpi.type)}
        </p>
      )}
    </button>
  );
}
