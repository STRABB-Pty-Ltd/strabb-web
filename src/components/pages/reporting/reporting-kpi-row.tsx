"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Bed,
  Calendar,
  CreditCard,
  DollarSign,
  Percent,
  TrendingUp,
} from "lucide-react";

import type { ReportingKPI } from "@/hooks/use-reporting";
import { useAppStore } from "@/stores/app-store";

const iconMap: Record<string, React.ElementType> = {
  "dollar-sign": DollarSign,
  percent: Percent,
  calendar: Calendar,
  bed: Bed,
  "credit-card": CreditCard,
  "trending-up": TrendingUp,
};

const formatValue = (value: number, type: ReportingKPI["type"]) => {
  if (type === "currency") {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      maximumFractionDigits: 0,
    }).format(value);
  }
  if (type === "percentage") return `${value}%`;
  return String(value);
};

interface ReportingKPIRowProps {
  kpis: ReportingKPI[];
}

export function ReportingKPIRow({ kpis }: ReportingKPIRowProps) {
  const setDrillDown = useAppStore((s) => s.setDrillDown);

  return (
    <div className="gap-sm grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {kpis.map((kpi) => {
        const Icon = iconMap[kpi.icon] ?? DollarSign;
        const trendPositive = kpi.trend > 0;
        const trendNeutral = kpi.trend === 0;

        return (
          <button
            key={kpi.label}
            type="button"
            onClick={() =>
              setDrillDown({
                type: "kpi",
                itemId: kpi.label,
                label: kpi.label,
              })
            }
            className="p-md rounded-lg border bg-white text-left transition-shadow hover:shadow-md"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="mb-base gap-base flex items-center">
              <div
                className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: "var(--icon-bg)" }}
              >
                <Icon size={21} style={{ color: "var(--icon-color)" }} />
              </div>
              {!trendNeutral && (
                <div
                  className="gap-xs px-base py-xs text-body ml-auto flex items-center rounded-full font-medium"
                  style={{
                    backgroundColor: trendPositive
                      ? "rgba(22, 163, 74, 0.1)"
                      : "rgba(220, 38, 38, 0.1)",
                    color: trendPositive ? "var(--status-success)" : "var(--status-danger)",
                  }}
                >
                  {trendPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {Math.abs(kpi.trend)}%
                </div>
              )}
            </div>
            <p className="font-data text-subheading font-bold text-gray-900">
              {formatValue(kpi.value, kpi.type)}
            </p>
            <p className="mt-xs text-body" style={{ color: "var(--brand-10)" }}>
              {kpi.label}
            </p>
          </button>
        );
      })}
    </div>
  );
}
