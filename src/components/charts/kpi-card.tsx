"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { formatCurrency } from "@/lib/format-currency";

import type { KPIData } from "@/hooks/use-dashboard";

const formatValue = (value: string | number, type: KPIData["type"]) => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (type === "currency") return formatCurrency(num);
  if (type === "percentage") return `${num}%`;
  return String(num);
};

interface KPICardProps {
  kpi: KPIData;
  compareValue?: string | number | null;
  onClick: () => void;
}

export function KPICard({ kpi, compareValue, onClick }: KPICardProps) {
  const hasTrend = typeof kpi.trend === "number" && kpi.trend !== 0;
  const trendPositive = (kpi.trend ?? 0) > 0;

  // Single explicit aria-label so screen readers announce one tidy string
  // rather than concatenating each child node (which produced "value, button,
  // group" - VoiceOver inferring grouping from the CSS Grid parent).
  const trendDescription = hasTrend
    ? `, ${trendPositive ? "up" : "down"} ${Math.abs(kpi.trend ?? 0)} percent`
    : "";
  const compareDescription =
    compareValue != null ? `, compared to ${formatValue(compareValue, kpi.type)}` : "";
  const ariaLabel = `${kpi.label}, ${formatValue(kpi.value, kpi.type)}${trendDescription}${compareDescription}`;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="p-sm rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
      style={{ backgroundColor: "var(--neutral-30)" }}
      data-no-elevate
    >
      <div className="mb-sm gap-base flex items-center">
        <p
          title={kpi.label}
          className="text-subheading min-w-0 flex-1 truncate font-medium"
          style={{ color: "var(--highlight-10)" }}
        >
          {kpi.label}
        </p>
        {hasTrend && (
          <div
            className="gap-xs px-base py-xs text-body flex shrink-0 items-center rounded-full font-medium"
            style={{
              backgroundColor: "var(--neutral-30)",
              color: trendPositive ? "var(--status-completed)" : "var(--status-issues)",
            }}
          >
            {trendPositive ? (
              <ArrowUpRight size={13} aria-hidden="true" />
            ) : (
              <ArrowDownRight size={13} aria-hidden="true" />
            )}
            {Math.abs(kpi.trend ?? 0)}%
          </div>
        )}
      </div>

      <p className="font-data text-subheading" style={{ color: "var(--highlight-10)" }}>
        {formatValue(kpi.value, kpi.type)}
      </p>

      {compareValue != null && (
        <p className="font-data mt-xs text-body" style={{ color: "var(--text-secondary)" }}>
          vs {formatValue(compareValue, kpi.type)}
        </p>
      )}
    </button>
  );
}
