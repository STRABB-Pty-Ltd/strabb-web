"use client";

import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";

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
  onClick: () => void;
}

export function KPICard({ kpi, onClick }: KPICardProps) {
  // A real 0% delta renders a flat chip; null/undefined (no prior-period
  // data) renders no chip at all - mirrors the server's null-vs-zero trend
  // contract instead of collapsing both to "nothing".
  const hasTrend = typeof kpi.trend === "number";
  const trendFlat = kpi.trend === 0;
  const trendPositive = (kpi.trend ?? 0) > 0;

  // Single explicit aria-label so screen readers announce one tidy string
  // rather than concatenating each child node (which produced "value, button,
  // group" - VoiceOver inferring grouping from the CSS Grid parent).
  const trendDescription = hasTrend
    ? trendFlat
      ? ", unchanged"
      : `, ${trendPositive ? "up" : "down"} ${Math.abs(kpi.trend ?? 0)} percent`
    : "";
  const ariaLabel = `${kpi.label}, ${formatValue(kpi.value, kpi.type)}${trendDescription}`;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="p-sm rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
      style={{ backgroundColor: "var(--neutral-30)" }}
      data-no-elevate
    >
      {/* items-start (not -center): once the label can wrap to 2 lines in a
          narrower card, centering the trend badge against the label's full
          height looked odd - top-aligned matches the label's first line
          instead, like a headline + tag. */}
      <div className="mb-sm gap-base flex items-start">
        {/* Wraps instead of truncating - a fixed truncate + narrow card
            combination silently cut "Total Revenue" down to "Tota..." at
            some widths (found via kpi-grid.tsx's grid-cols tuning); nothing
            constrains this card to single-line height, so wrapping loses no
            information instead of an ellipsis losing characters. title stays
            as a harmless hover reference even though the full text now
            always renders. */}
        <p
          title={kpi.label}
          className="text-subheading min-w-0 flex-1 font-medium"
          style={{ color: "var(--highlight-10)" }}
        >
          {kpi.label}
        </p>
        {hasTrend && (
          <div
            className="gap-xs px-base py-xs text-body flex shrink-0 items-center rounded-full font-medium"
            style={{
              backgroundColor: "var(--neutral-30)",
              color: trendFlat
                ? "var(--highlight-10)"
                : trendPositive
                  ? "var(--status-completed)"
                  : "var(--status-issues)",
            }}
          >
            {trendFlat ? (
              <ArrowRight size={13} aria-hidden="true" />
            ) : trendPositive ? (
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
    </button>
  );
}
