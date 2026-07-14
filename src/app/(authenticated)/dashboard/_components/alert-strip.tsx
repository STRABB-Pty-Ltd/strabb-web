"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AlertItem } from "@/hooks/use-dashboard";
import { useAlertNavigation } from "@/hooks/use-alert-navigation";
import { severityAccent, typeIcon } from "@/lib/alert-display";

const severityBg: Record<string, string> = {
  red: "var(--neutral-30)",
  amber: "var(--neutral-30)",
  blue: "var(--neutral-30)",
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
            <Button
              type="button"
              variant="quiet"
              size="xs"
              onClick={() => handleView(alert)}
              className="font-semibold"
              style={{ color: accent }}
              data-no-elevate
            >
              View
            </Button>
            <Button
              type="button"
              variant="quiet"
              size="icon-xs"
              onClick={() => setDismissed((d) => [...d, alert.id])}
              aria-label="Dismiss alert"
              style={{ color: "var(--text-secondary)" }}
              data-no-elevate
            >
              <X size={14} aria-hidden="true" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
