"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  Clock,
  MessageSquare,
  RefreshCw,
  Wrench,
  X,
} from "lucide-react";

import type { AlertItem } from "@/hooks/use-dashboard";
import { useAlertNavigation } from "@/hooks/use-alert-navigation";

const severityBg: Record<string, string> = {
  red: "var(--neutral-30)",
  amber: "var(--neutral-30)",
  blue: "var(--neutral-30)",
};

export const severityAccent: Record<string, string> = {
  red: "var(--status-issues)",
  amber: "var(--status-issues)",
  blue: "var(--highlight-10)",
};

export const typeIcon: Record<string, React.ElementType> = {
  message: MessageSquare,
  unscheduled: CalendarClock,
  "past-due-clean": Clock,
  ticket: Wrench,
  sync: RefreshCw,
};

interface AlertStripProps {
  alerts: AlertItem[];
}

export function AlertStrip({ alerts }: AlertStripProps) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const handleView = useAlertNavigation();

  const visible = alerts.filter((a) => !dismissed.includes(a.id));
  if (visible.length === 0) return null;

  return (
    // 1 col mobile, 2 col tablet/midrange, 3 col at lg, 4 col at xl - a fixed
    // 12-col/col-span-3 grid (always 4-per-row) had no room to shrink into
    // below wide-desktop widths, so a card's icon+text+View+dismiss row
    // overflowed its own rectangle instead of wrapping (found testing M.1's
    // shell fix at 850px, present at every width below ~1024px including
    // mobile). The lg:3/xl:4 buffer tier (same pattern as kpi-grid.tsx and
    // reporting-kpi-row.tsx) was added after cards still felt crowded jumping
    // straight from 2 to 4 right at 1024px.
    <div className="gap-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {visible.map((alert) => {
        const Icon = typeIcon[alert.type] ?? AlertTriangle;
        const bg = severityBg[alert.severity] ?? "var(--neutral-30)";
        const accent = severityAccent[alert.severity] ?? "var(--highlight-10)";
        return (
          <div
            key={alert.id}
            className="gap-sm px-md py-sm flex items-center rounded-lg transition-shadow hover:shadow-md"
            style={{ backgroundColor: bg }}
          >
            <Icon size={16} style={{ color: accent }} aria-hidden="true" />
            {/* min-w-0 overrides the flex item's default min-width:auto,
                which otherwise refuses to shrink below the text's intrinsic
                width and pushes the row wider than the card instead of
                wrapping. */}
            <span className="text-body min-w-0 flex-1" style={{ color: "var(--highlight-10)" }}>
              {alert.description}
            </span>
            <button
              type="button"
              onClick={() => handleView(alert)}
              className="text-body cursor-pointer rounded font-semibold whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
              style={{ color: accent }}
              data-no-elevate
            >
              View
            </button>
            <button
              type="button"
              onClick={() => setDismissed((d) => [...d, alert.id])}
              aria-label="Dismiss alert"
              className="rounded outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
              style={{ color: "var(--text-secondary)" }}
              data-no-elevate
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
